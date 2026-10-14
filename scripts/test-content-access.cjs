const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

let role = null;
let databaseReads = 0;
const db = new Proxy({}, {
  get() {
    databaseReads++;
    return { findUnique: async () => null };
  },
});
function load(file, imports) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, FormData, File,
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return module.exports;
}
const helpers = load('src/lib/actions/helpers.ts', {
  '@/lib/questionnaire': load('src/lib/questionnaire.ts', {}),
  '@/lib/db': { db }, '@/lib/audit': {},
  '@/lib/auth': { getSession: async () => role ? { role, id: 'test-user' } : null },
});
const actions = load('src/lib/actions/opd.ts', {
  '@prisma/client': require('@prisma/client'), '@/lib/questionnaire': load('src/lib/questionnaire.ts', {}),
  'next/cache': {}, '@/lib/public-db': { PUBLIC_DATA_TAG: 'test' },
  '@/lib/db': { db }, '@/lib/audit': {}, '@/lib/article-images': {}, '@/lib/opd-logo': {},
  '@/lib/actions/helpers': helpers,
});
const names = ['simpanArtikel', 'publikasikanArtikel', 'hapusArtikel', 'simpanPublikasi', 'publikasikanPublikasi', 'hapusPublikasi'];
async function callAll() {
  for (const name of names) {
    const result = await actions[name](name.startsWith('simpan') ? new FormData() : 'test-id');
    assert.equal(result.ok, false);
  }
}
(async () => {
  for (role of [null, 'OPD', 'ADMIN']) {
    databaseReads = 0;
    await callAll();
    assert.equal(databaseReads, 0, `${role ?? 'guest'} accessed content database`);
  }
  role = 'BAPPERIDA'; databaseReads = 0;
  await callAll();
  assert.equal(databaseReads, 4, 'Bapperida must pass authorization for existing content');
  console.log('PASS: six content actions deny guests, OPD and ADMIN before database access; BAPPERIDA passes authorization.');
})().catch(error => { console.error(error); process.exitCode = 1; });
