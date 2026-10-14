const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

function load(file, imports = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, FormData, File, Date, Intl, console,
    require(name) { if (!(name in imports)) throw new Error(`Unexpected import: ${name}`); return imports[name]; },
  });
  return module.exports;
}
const utils = load('src/lib/questionnaire.ts');
const options = [{ label: 'Ya' }, { label: 'Tidak' }];
assert.equal(utils.parseDateBoundary('2026-10-14').toISOString(), '2026-10-13T16:00:00.000Z');
assert.equal(utils.parseDateBoundary('2026-10-14', true).toISOString(), '2026-10-14T15:59:59.999Z');
assert.throws(() => utils.parseDateBoundary('2026-02-29'));
assert.throws(() => utils.parseOptions('Ya\nYa'));
assert.throws(() => utils.parseOptions('Satu pilihan'));
for (const type of ['RADIO', 'DROPDOWN', 'OPTIONS']) {
  assert.equal(utils.normalizeAnswer({ tipeJawaban: type, opsi: options }, { valueText: 'Ya' }).valueText, 'Ya');
  assert.throws(() => utils.normalizeAnswer({ tipeJawaban: type, opsi: options }, { valueText: 'Palsu' }));
}
assert.equal(utils.normalizeAnswer({ tipeJawaban: 'CHECKBOX', opsi: options }, { valueText: '["Ya","Tidak","Ya"]' }).valueText, '["Ya","Tidak"]');
assert.equal(utils.normalizeAnswer({ tipeJawaban: 'CHECKBOX', opsi: options }, { valueText: '[]' }).valueText, null);
assert.throws(() => utils.normalizeAnswer({ tipeJawaban: 'CHECKBOX', opsi: options }, { valueText: 'Ya' }));
assert.throws(() => utils.normalizeAnswer({ tipeJawaban: 'CHECKBOX', opsi: options }, { valueText: '["Palsu"]' }));
assert.equal(utils.normalizeAnswer({ tipeJawaban: 'NUMBER', opsi: [] }, { valueNumber: 0 }).valueNumber, 0);
assert.throws(() => utils.normalizeAnswer({ tipeJawaban: 'NUMBER', opsi: [] }, { valueNumber: Infinity }));
assert.equal(utils.normalizeAnswer({ tipeJawaban: 'TEXT', opsi: [] }, { valueText: ' Jawaban ' }).valueText, 'Jawaban');
assert.equal(utils.normalizeAnswer({ tipeJawaban: 'DATE', opsi: [] }, { valueDate: '2026-10-14' }).valueDate.toISOString(), '2026-10-14T00:00:00.000Z');
const window = { status: 'AKTIF', deadline: null, periode: { status: 'AKTIF', lockAt: null, startDate: utils.parseDateBoundary('2026-10-14'), endDate: utils.parseDateBoundary('2026-10-14', true) } };
assert.equal(utils.fillingError(window, window.periode.startDate), null);
assert.equal(utils.fillingError(window, window.periode.endDate), null);
assert.ok(utils.fillingError(window, new Date('2026-10-13T15:59:59Z')));
assert.ok(utils.fillingError(window, new Date('2026-10-14T16:00:00Z')));
assert.ok(utils.fillingError({ ...window, status: 'NONAKTIF' }, window.periode.startDate));
assert.ok(utils.fillingError({ ...window, deadline: new Date('2026-10-14T01:00:00Z') }, new Date('2026-10-14T02:00:00Z')));
console.log('PASS: five answer types, invalid options, checkbox clearing, numeric zero, inclusive WITA dates and assignment access.');

function form(values) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) fd.append(key, String(item));
  }
  return fd;
}

async function integration() {
  require('@next/env').loadEnvConfig(process.cwd());
  const prisma = require('@prisma/client');
  const actualDb = new prisma.PrismaClient();
  const prefix = `QA-${crypto.randomUUID().slice(0, 8)}`;
  const userId = crypto.randomUUID();
  const opdIds = [crypto.randomUUID(), crypto.randomUUID()];
  let actor = { id: userId, role: 'BAPPERIDA' };
  // Notifications from test submissions only target the temporary test account.
  const db = new Proxy(actualDb, { get(target, key) {
    if (key === 'user') return new Proxy(target.user, { get(model, operation) {
      if (operation === 'findMany') return async args => args?.where?.role === 'BAPPERIDA' ? [{ id: userId }] : model.findMany(args);
      return model[operation];
    } });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  const auth = { getSession: async () => actor };
  const helpers = load('src/lib/actions/helpers.ts', { '@/lib/db': { db }, '@/lib/auth': auth, '@/lib/audit': {}, '@/lib/questionnaire': utils });
  const common = { '@prisma/client': prisma, 'next/cache': { revalidatePath() {}, updateTag() {} }, '@/lib/public-db': { PUBLIC_DATA_TAG: 'test' }, '@/lib/db': { db }, '@/lib/audit': { logActivity: async () => {} }, '@/lib/actions/helpers': helpers, '@/lib/questionnaire': utils };
  const manage = load('src/lib/actions/questionnaire.ts', common);
  const assign = load('src/lib/actions/bapperida.ts', common);
  const opd = load('src/lib/actions/opd.ts', { ...common, '@/lib/article-images': {}, '@/lib/opd-logo': {} });
  const ok = result => assert.equal(result.ok, true, JSON.stringify(result));
  let indicatorId, aspectId, periodId;
  try {
    await db.user.create({ data: { id: userId, nama: prefix, email: `${prefix.toLowerCase()}@example.invalid`, role: 'BAPPERIDA', passwordHash: 'test-only-no-login' } });
    for (let index = 0; index < opdIds.length; index++) await db.opd.create({ data: { id: opdIds[index], kode: `${prefix}-${index}`, nama: `${prefix} OPD ${index}`, singkatan: prefix, slug: `${prefix.toLowerCase()}-${index}` } });
    for (const role of [null, 'OPD']) {
      actor = role ? { id: userId, role, opdId: opdIds[0] } : null;
      assert.equal((await manage.saveIndikator(form({ kode: prefix, nama: prefix }))).ok, false);
      assert.equal((await manage.savePertanyaan(form({}))).ok, false);
      assert.equal((await assign.createPeriode(form({}))).ok, false);
    }
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await manage.saveIndikator(form({ kode: prefix, nama: prefix, isActive: 'on' })));
    indicatorId = (await db.indikator.findUnique({ where: { kode: prefix } })).id;
    ok(await manage.saveAspek(form({ indikatorId: indicatorId, nama: 'Aspek pengujian' })));
    aspectId = (await db.aspekIndikator.findFirst({ where: { indikatorId: indicatorId } })).id;
    const qInputs = [];
    for (const type of ['RADIO', 'CHECKBOX', 'NUMBER', 'TEXT', 'DROPDOWN']) {
      const input = { aspekId: aspectId, kode: `${prefix}-${type}`, pertanyaan: `Pertanyaan ${type}`, tipeJawaban: type, wajibDefault: 'on', opsi: 'Ya\nTidak' };
      qInputs.push(input); ok(await manage.savePertanyaan(form(input)));
    }
    const questions = await db.pertanyaanIndikator.findMany({ where: { aspekId: aspectId } });
    const qByType = Object.fromEntries(questions.map(q => [q.tipeJawaban, q]));
    ok(await manage.savePertanyaan(form({ ...qInputs[3], id: qByType.TEXT.id, pertanyaan: 'Pertanyaan teks diperbarui' })));
    assert.equal((await db.pertanyaanIndikator.findUnique({ where: { id: qByType.TEXT.id } })).pertanyaan, 'Pertanyaan teks diperbarui');
    console.log('PASS: indicator, aspect and five question types created and edited.');
    const today = utils.dateInputValue(new Date());
    const periodInput = { kode: prefix, nama: prefix, startDate: today, endDate: today };
    ok(await assign.createPeriode(form(periodInput)));
    periodId = (await db.periodePengisian.findUnique({ where: { kode: prefix } })).id;
    assert.equal((await assign.createPenugasan(form({ periodeId: periodId, indikatorId: indicatorId, opdIds: opdIds[0], deadline: '2100-01-01' }))).ok, false);
    ok(await assign.createPenugasan(form({ periodeId: periodId, indikatorId: indicatorId, opdIds: opdIds[0] })));
    const assignment = await db.penugasanOpd.findFirst({ where: { periodeId: periodId } });
    assert.equal(await db.penugasanOpd.count({ where: { periodeId: periodId } }), 1);
    assert.equal(await db.penugasanPertanyaan.count({ where: { penugasanId: assignment.id } }), 5);
    actor = { id: userId, role: 'OPD', opdId: opdIds[1] };
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values: [] })).ok, false);
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    const values = [
      { pertanyaanId: qByType.RADIO.id, valueText: 'Ya' },
      { pertanyaanId: qByType.CHECKBOX.id, valueText: '["Ya","Tidak"]' },
      { pertanyaanId: qByType.NUMBER.id, valueNumber: 0 },
      { pertanyaanId: qByType.TEXT.id, valueText: 'Isi teks' },
      { pertanyaanId: qByType.DROPDOWN.id, valueText: 'Tidak' },
    ];
    ok(await opd.simpanDetailJawaban({ penugasanId: assignment.id, values }));
    const answer = await db.jawabanOpd.findFirst({ where: { penugasanId: assignment.id } });
    assert.equal((await db.progresPengisian.findUnique({ where: { penugasanId: assignment.id } })).percent, 100);
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values: [{ pertanyaanId: qByType.NUMBER.id, valueNumber: 42 }, { pertanyaanId: qByType.RADIO.id, valueText: 'Palsu' }] })).ok, false);
    assert.equal((await db.detailJawaban.findFirst({ where: { jawabanId: answer.id, pertanyaanId: qByType.NUMBER.id } })).valueNumber, 0, 'invalid batch must roll back earlier updates');
    ok(await opd.simpanDetailJawaban({ penugasanId: assignment.id, values: [{ pertanyaanId: qByType.CHECKBOX.id, valueText: '[]' }] }));
    assert.equal((await opd.kirimJawaban(assignment.id)).ok, false, 'empty required checkbox must block submission');
    ok(await opd.simpanDetailJawaban({ penugasanId: assignment.id, values }));
    actor = { id: userId, role: 'BAPPERIDA' };
    assert.equal((await manage.savePertanyaan(form({ ...qInputs[0], id: qByType.RADIO.id, tipeJawaban: 'NUMBER' }))).ok, false, 'answered question cannot change its storage type');
    const extra = { aspekId: aspectId, kode: `${prefix}-extra`, pertanyaan: 'Opsional tambahan', tipeJawaban: 'TEXT' };
    ok(await manage.savePertanyaan(form(extra)));
    const extraQ = await db.pertanyaanIndikator.findUnique({ where: { kode: extra.kode } });
    assert.equal((await db.penugasanPertanyaan.findUnique({ where: { penugasanId_pertanyaanId: { penugasanId: assignment.id, pertanyaanId: extraQ.id } } })).required, false);
    console.log('PASS: OPD scope, valid answers, atomic rollback, required checkbox and live optional question targets.');
    ok(await manage.savePertanyaan(form({ ...extra, id: extraQ.id, wajibDefault: 'on' })));
    ok(await manage.deletePertanyaan(extraQ.id));
    assert.equal((await db.pertanyaanIndikator.findUnique({ where: { id: extraQ.id } })).isActive, false);
    assert.equal(await db.penugasanPertanyaan.count({ where: { penugasanId: assignment.id, pertanyaanId: extraQ.id } }), 0, 'removed required question must leave draft targets');
    ok(await assign.updatePenugasan(form({ id: assignment.id, status: 'NONAKTIF' })));
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values })).ok, false);
    assert.equal((await opd.kirimJawaban(assignment.id)).ok, false);
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await assign.updatePenugasan(form({ id: assignment.id, status: 'AKTIF' })));
    ok(await assign.createPeriode(form({ ...periodInput, id: periodId, status: 'DITUTUP' })));
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    assert.equal((await opd.kirimJawaban(assignment.id)).ok, false);
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await assign.createPeriode(form({ ...periodInput, id: periodId, status: 'AKTIF' })));
    ok(await assign.createPeriode(form({ ...periodInput, id: periodId, startDate: '2096-01-01', endDate: '2096-01-02' })));
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values })).ok, false, 'future period must block saving');
    assert.equal((await opd.kirimJawaban(assignment.id)).ok, false, 'future period must block submitting');
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await assign.createPeriode(form({ ...periodInput, id: periodId, startDate: '2000-01-01', endDate: '2000-01-02' })));
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values })).ok, false, 'expired period must block saving');
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await assign.createPeriode(form({ ...periodInput, id: periodId })));
    actor = { id: userId, role: 'OPD', opdId: opdIds[0] };
    ok(await opd.kirimJawaban(assignment.id));
    assert.equal((await db.jawabanOpd.findUnique({ where: { id: answer.id } })).status, 'DIKIRIM');
    assert.equal((await db.progresPengisian.findUnique({ where: { penugasanId: assignment.id } })).percent, 100, 'removed required questions must not reduce submitted progress');
    assert.equal((await opd.simpanDetailJawaban({ penugasanId: assignment.id, values })).ok, false, 'submitted answer must be locked');
    actor = { id: userId, role: 'BAPPERIDA' };
    ok(await manage.deletePertanyaan(qByType.RADIO.id));
    assert.equal(await db.detailJawaban.count({ where: { jawabanId: answer.id, pertanyaanId: qByType.RADIO.id } }), 1, 'deleting a question must preserve submitted answers');
    console.log('PASS: real database CRUD, all five answer types, assignment scope, atomic draft validation, required/optional questions, schedule controls, submission lock and answer history.');
  } finally {
    // Only records owned by this uniquely named test fixture are removed.
    if (periodId) {
      const assignments = await db.penugasanOpd.findMany({ where: { periodeId: periodId }, select: { id: true } });
      const ids = assignments.map(p => p.id);
      const answers = await db.jawabanOpd.findMany({ where: { penugasanId: { in: ids } }, select: { id: true } });
      const answerIds = answers.map(a => a.id);
      await db.notifikasiPenerima.deleteMany({ where: { notifikasi: { penugasanId: { in: ids } } } });
      await db.notifikasi.deleteMany({ where: { penugasanId: { in: ids } } });
      await db.detailJawaban.deleteMany({ where: { jawabanId: { in: answerIds } } });
      await db.riwayatStatusJawaban.deleteMany({ where: { jawabanId: { in: answerIds } } });
      await db.jawabanOpd.deleteMany({ where: { penugasanId: { in: ids } } });
      await db.progresPengisian.deleteMany({ where: { penugasanId: { in: ids } } });
      await db.penugasanPertanyaan.deleteMany({ where: { penugasanId: { in: ids } } });
      await db.penugasanOpd.deleteMany({ where: { periodeId: periodId } });
      await db.periodePengisian.delete({ where: { id: periodId } });
    }
    if (indicatorId) {
      await db.opsiPertanyaan.deleteMany({ where: { pertanyaan: { aspek: { indikatorId: indicatorId } } } });
      await db.pertanyaanIndikator.deleteMany({ where: { aspek: { indikatorId: indicatorId } } });
      await db.aspekIndikator.deleteMany({ where: { indikatorId: indicatorId } });
      await db.konfigurasiVisualisasi.deleteMany({ where: { indikatorId: indicatorId } });
      await db.indikator.delete({ where: { id: indicatorId } });
    }
    await db.opd.deleteMany({ where: { id: { in: opdIds } } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  }
}
if (process.argv.includes('--integration')) integration().catch(error => { console.error(error); process.exitCode = 1; });
