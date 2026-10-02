import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvConfig(root, true);

function reachable(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(2000);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur. Periksa file .env.');
  }
  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('Format DATABASE_URL tidak valid. Periksa file .env.');
  }

  // Only manage this project's existing Windows development database.
  // Other installations and remote databases retain their own startup flow.
  if (
    process.platform !== 'win32' ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.port !== '5433'
  ) {
    return;
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const port = Number(url.port);
  if (await reachable(host, port)) {
    console.log('[database] PostgreSQL lokal sudah aktif di port 5433.');
    return;
  }

  const dataDir = path.join(root, '.postgres-data');
  const versionFile = path.join(dataDir, 'PG_VERSION');
  if (!fs.existsSync(versionFile)) {
    throw new Error('Database lokal .postgres-data belum tersedia. Siapkan PostgreSQL dan DATABASE_URL terlebih dahulu.');
  }
  const version = fs.readFileSync(versionFile, 'utf8').trim();
  if (!/^\d+(\.\d+)?$/.test(version)) {
    throw new Error('Versi PostgreSQL pada .postgres-data/PG_VERSION tidak valid.');
  }
  const candidates = [
    process.env.PG_BIN && path.join(process.env.PG_BIN, 'pg_ctl.exe'),
    path.join(process.env.ProgramFiles || 'C:/Program Files', 'PostgreSQL', version, 'bin', 'pg_ctl.exe'),
  ].filter(Boolean);
  const pgCtl = candidates.find((candidate) => fs.existsSync(candidate));
  if (!pgCtl) {
    throw new Error(`PostgreSQL ${version} tidak ditemukan. Atur PG_BIN di .env ke folder bin PostgreSQL ${version}.`);
  }
  const binary = await run(pgCtl, ['--version'], { windowsHide: true });
  const binaryVersion = binary.stdout.match(/\(PostgreSQL\)\s+(\d+)(?:\.(\d+))?/);
  const major = binaryVersion && (Number(binaryVersion[1]) >= 10 ? binaryVersion[1] : `${binaryVersion[1]}.${binaryVersion[2]}`);
  if (major !== version) {
    throw new Error(`PG_BIN harus menunjuk ke PostgreSQL ${version}, sesuai database yang sudah ada.`);
  }

  console.log('[database] Menyalakan PostgreSQL lokal di port 5433...');
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(pgCtl, [
        'start', '-D', dataDir,
        // Keep the log outside PGDATA so crash recovery can scan its files.
        '-l', path.join(root, 'postgres.log'),
        '-o', '-p 5433 -h localhost', '-w', '-t', '60',
      ], { windowsHide: true, stdio: 'inherit' });
      // PostgreSQL may inherit handles on Windows; wait for pg_ctl's exit,
      // without waiting for the persistent database process to close them.
      child.once('error', reject);
      child.once('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('pg_ctl failed'));
      });
    });
  } catch {
    throw new Error('PostgreSQL gagal menyala. Periksa postgres.log di folder proyek.');
  }
  console.log('[database] PostgreSQL siap.');
}

main().catch((error) => {
  console.error(`[database] ${error.message}`);
  process.exitCode = 1;
});
