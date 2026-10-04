import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import nextEnv from '@next/env';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
nextEnv.loadEnvConfig(root, true);

async function main() {
  // Export only from the existing local database, never the new Supabase target.
  const url = new URL(process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Atur LOCAL_DATABASE_URL ke database PostgreSQL lokal sumber ekspor.');
  }
  const version = (await fs.readFile(path.join(root, '.postgres-data/PG_VERSION'), 'utf8')).trim();
  if (!/^\d+(\.\d+)?$/.test(version)) throw new Error('Versi PostgreSQL lokal tidak valid.');
  const bin = process.env.PG_BIN || path.join(process.env.ProgramFiles || 'C:/Program Files', 'PostgreSQL', version, 'bin');
  const suffix = process.platform === 'win32' ? '.exe' : '';
  const env = { ...process.env, PGPASSWORD: decodeURIComponent(url.password), PGCLIENTENCODING: 'UTF8' };
  const connection = ['--host', url.hostname.replace(/^\[|\]$/g, ''), '--port', url.port || '5432',
    '--username', decodeURIComponent(url.username), '--dbname', decodeURIComponent(url.pathname.slice(1)), '--no-password'];
  const options = { env, windowsHide: true, maxBuffer: 64 * 1024 * 1024 };
  const psql = (sql) => run(path.join(bin, `psql${suffix}`), [...connection, '-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], options);
  const schema = await fs.readFile(path.join(root, 'prisma/schema.prisma'), 'utf8');
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]).sort();
  const { stdout: catalog } = await psql("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename;");
  const tables = catalog.trim().split(/\r?\n/).filter(Boolean).sort();
  if (JSON.stringify(tables) !== JSON.stringify(models)) {
    throw new Error('Tabel database lokal berbeda dari schema Prisma. Periksa struktur sebelum mengekspor.');
  }
  const folder = path.join(root, 'prisma/backups');
  await fs.mkdir(folder, { recursive: true });
  const dumpPath = path.join(folder, 'supabase-export.tmp.sql');
  // pg_dump uses one consistent snapshot; INSERT statements work in SQL Editor.
  await run(path.join(bin, `pg_dump${suffix}`), [...connection, '--schema=public', '--exclude-table=public._prisma_migrations',
    '--no-owner', '--no-privileges', '--column-inserts', '--quote-all-identifiers', '--file', dumpPath], options);
  let dump = await fs.readFile(dumpPath, 'utf8');
  // public already exists in Supabase. Keep its managed ownership/permissions.
  dump = dump.replace(/^CREATE SCHEMA "public";\r?\n/gm, '')
    .replace(/^COMMENT ON SCHEMA "public" IS .*;\r?\n/gm, '');
  const security = tables.map((table) => `ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;\n` +
    `DO $$ BEGIN\n` +
    `  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN\n` +
    `    REVOKE ALL ON public."${table}" FROM anon;\n  END IF;\n` +
    `  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN\n` +
    `    REVOKE ALL ON public."${table}" FROM authenticated;\n  END IF;\nEND $$;`).join('\n\n');
  const verify = tables.map((table) => `SELECT '${table}' AS tabel, count(*) AS jumlah FROM public."${table}"`).join('\nUNION ALL\n') + ';';
  const header = `-- Ekspor database lokal: ${new Date().toISOString()}\n` +
    `-- Struktur + seluruh baris dari ${tables.length} tabel aplikasi.\n` +
    '-- Jalankan SEKALI pada Supabase dengan tabel aplikasi yang masih kosong/belum dibuat.\n' +
    '-- Berisi data akun dan hash password; simpan privat. Tidak ada DROP/TRUNCATE.\n';
  await fs.writeFile(path.join(folder, 'supabase-full.sql'), `${header}\nBEGIN;\n${dump}\n${security}\nCOMMIT;\n\n${verify}\n`, 'utf8');
  await fs.writeFile(path.join(folder, 'verify-counts.sql'), verify + '\n', 'utf8');
  const counts = await psql(verify);
  await fs.writeFile(path.join(folder, 'source-counts.txt'), counts.stdout, 'utf8');
  await fs.unlink(dumpPath);
  console.log(`Ekspor selesai: ${tables.length} tabel -> prisma/backups/supabase-full.sql`);
  console.log('Jumlah baris sumber:\n' + counts.stdout.trim());
}

main().catch(() => {
  // Child-process errors can contain connection details or SQL data.
  console.error('Ekspor gagal. Pastikan PostgreSQL lokal aktif, LOCAL_DATABASE_URL benar, dan PG_BIN sesuai versi PostgreSQL.');
  process.exitCode = 1;
});
