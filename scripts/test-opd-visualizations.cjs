const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const presets = require('../src/data/opd-demo.json');

function load(db) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/opd-analytics.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, require(name) { assert.equal(name, '@/lib/db'); return { db }; },
  });
  return module.exports;
}
let assignmentWhere, detailWhere;
const api = load({ penugasanOpd: { findMany: async args => { assignmentWhere = args.where; return []; } }, detailJawaban: { findMany: async args => { detailWhere = args.where; return []; } } });
const assignment = (id, indicator, period, updated, status = 'DRAFT') => ({ id, indikator: { id: indicator, kode: indicator, nama: indicator }, periode: { id: period }, jawaban: [{ id: `answer-${id}`, updatedAt: new Date(updated), status }] });
const records = [assignment('old', 'IND-01', 'old-period', '2025-01-01', 'TERVERIFIKASI'), assignment('new', 'IND-01', 'demo-period', '2026-10-14'), assignment('second', 'IND-05', 'demo-period', '2026-10-15', 'PERLU_PERBAIKAN')];
assert.equal(api.selectOpdAnalyticsAssignment(records).id, 'second');
assert.equal(api.selectOpdAnalyticsAssignment(records, 'IND-01').id, 'new');
assert.equal(api.selectOpdAnalyticsAssignment(records, 'IND-01', 'old-period').id, 'old');
assert.equal(api.selectOpdAnalyticsAssignment(records, 'OTHER-OPD', 'demo-period'), null);
assert.equal(api.selectOpdAnalyticsAssignment(records, 'IND-01', 'foreign-period'), null);

async function run() {
  await api.getOpdAnalyticsAssignments('own-opd');
  await api.getOpdAnalyticsDetails('own-opd', 'foreign-answer');
  assert.equal(assignmentWhere.opdId, 'own-opd');
  assert.equal(detailWhere.jawaban.penugasan.opdId, 'own-opd');
  assert.equal(detailWhere.jawabanId, 'foreign-answer');
  assert.equal(detailWhere.pertanyaan.tipeJawaban, 'NUMBER');
  console.log('PASS: indicator/period selection, latest answer, all workflow statuses, invalid selection, and server-side OPD scope in both queries.');
  if (!process.argv.includes('--integration')) return;
  require('@next/env').loadEnvConfig(process.cwd());
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const real = load(db);
  try {
    const period = await db.periodePengisian.findUnique({ where: { kode: 'DEMO-OPD-2026' } });
    assert.ok(period);
    const districts = await db.wilayah.count({ where: { isActive: true } });
    const seenIds = new Set();
    let foreignAnswer;
    let firstOpd;
    for (const preset of presets) {
      const user = await db.user.findUnique({ where: { email: `demo.${preset.slug}@pinrang.go.id` }, include: { opd: true } });
      assert.equal(user.role, 'OPD');
      assert.equal(user.status, 'AKTIF');
      assert.equal(user.opd.slug, preset.slug);
      const choices = await real.getOpdAnalyticsAssignments(user.opdId);
      const demo = choices.filter(choice => choice.periode.id === period.id);
      assert.equal(demo.length, 2, `${preset.slug} must have two demo indicators`);
      assert.deepEqual(demo.map(choice => choice.indikator.kode).sort(), [...preset.indikator].sort());
      for (const choice of demo) {
        assert.ok(!seenIds.has(choice.jawaban[0].id), 'answers cannot be shared across OPDs');
        seenIds.add(choice.jawaban[0].id);
        const details = await real.getOpdAnalyticsDetails(user.opdId, choice.jawaban[0].id);
        assert.ok(details.length >= districts, 'every demo indicator must populate all districts');
        assert.equal(new Set(details.map(detail => detail.wilayahId)).size, districts);
        assert.ok(new Set(details.map(detail => detail.valueNumber)).size > 1, 'charts need varying data');
        assert.ok(details.every(detail => detail.isPublic === false));
      }
      if (!firstOpd) firstOpd = user.opdId;
      else foreignAnswer = demo[0].jawaban[0].id;
      console.log(`PASS: ${user.opd.singkatan} — two indicators, ${districts} districts, own answer records.`);
    }
    assert.equal((await real.getOpdAnalyticsDetails(firstOpd, foreignAnswer)).length, 0, 'foreign answer ID must return no data');
    const before = await db.datasetPublik.count({ where: { periodeId: period.id } });
    assert.equal(before, 0, 'demo data must not be published');
    console.log('PASS: eight correctly scoped demo accounts, sixteen populated assignments, cross-OPD isolation, and no public datasets.');
  } finally { await db.$disconnect(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
