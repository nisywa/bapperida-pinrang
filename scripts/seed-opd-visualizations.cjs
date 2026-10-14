const { PrismaClient, Prisma } = require('@prisma/client');
const crypto = require('node:crypto');
const presets = require('../src/data/opd-demo.json');
require('@next/env').loadEnvConfig(process.cwd());
const db = new PrismaClient();
const year = Number(process.argv.find(value => value.startsWith('--year='))?.split('=')[1] ?? new Date().getUTCFullYear());
const password = 'DemoOpd#2026';
const stableId = (...parts) => `demo-vis-${crypto.createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 28)}`;
function passwordHash() {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function numericValue(question, opdIndex, districtIndex) {
  const variation = opdIndex * 11 + districtIndex * 7 + question.sortOrder * 3;
  if (question.satuan === '%') return Math.round((62 + variation % 35 + districtIndex / 10) * 10) / 10;
  if ((question.satuan ?? '').toLowerCase() === 'km') return Math.round((18 + variation % 75 + districtIndex * 1.7) * 10) / 10;
  if ((question.satuan ?? '').toLowerCase() === 'ha') return 200 + variation * 17;
  if ((question.satuan ?? '').toLowerCase() === 'jiwa') return 120 + variation * 13;
  return 5 + variation % 48;
}

async function main() {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error('Tahun demo tidak valid.');
  const districts = await db.wilayah.findMany({ where: { isActive: true }, orderBy: { kodeBps: 'asc' } });
  if (!districts.length) throw new Error('Master kecamatan belum tersedia. Tidak ada data yang diubah.');
  const indicators = await db.indikator.findMany({ where: { kode: { in: [...new Set(presets.flatMap(item => item.indikator))] }, isActive: true }, include: { aspek: { include: { pertanyaan: { where: { isActive: true }, include: { opsi: { orderBy: { sortOrder: 'asc' } } } } } } } });
  const opds = await db.opd.findMany({ where: { slug: { in: presets.map(item => item.slug) }, status: 'AKTIF' } });
  for (const preset of presets) {
    if (!opds.some(opd => opd.slug === preset.slug)) throw new Error(`Master OPD ${preset.nama} tidak tersedia. Tidak ada data yang diubah.`);
    for (const code of preset.indikator) {
      const indicator = indicators.find(item => item.kode === code);
      if (!indicator?.aspek.some(aspect => aspect.pertanyaan.some(question => question.tipeJawaban === 'NUMBER' && question.dimensiWilayah))) throw new Error(`Indikator ${code} tidak memiliki pertanyaan angka per kecamatan.`);
    }
  }
  const periodCode = `DEMO-OPD-${year}`;
  const period = await db.periodePengisian.upsert({ where: { kode: periodCode }, update: {}, create: {
    id: stableId('period', year), kode: periodCode, nama: `Demo Visualisasi OPD ${year} (data dummy)`,
    startDate: new Date(`${year}-01-01T00:00:00+08:00`), endDate: new Date(`${year}-12-31T23:59:59.999+08:00`), status: 'AKTIF',
  } });
  let created = 0, preserved = 0;
  for (const [opdIndex, preset] of presets.entries()) {
    const opd = opds.find(item => item.slug === preset.slug);
    const email = `demo.${preset.slug}@pinrang.go.id`;
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser && (existingUser.role !== 'OPD' || existingUser.opdId !== opd.id)) throw new Error(`Akun ${email} sudah digunakan untuk role/cakupan lain. Tidak diubah.`);
    if (!existingUser) await db.user.create({ data: { nama: `Demo ${opd.singkatan}`, email, passwordHash: passwordHash(), role: 'OPD', opdId: opd.id } });
    for (const [indicatorIndex, code] of preset.indikator.entries()) {
      const indicator = indicators.find(item => item.kode === code);
      const questions = indicator.aspek.flatMap(item => item.pertanyaan);
      const result = await db.$transaction(async tx => {
        const existing = await tx.penugasanOpd.findUnique({ where: { periodeId_indikatorId_opdId: { periodeId: period.id, indikatorId: indicator.id, opdId: opd.id } }, include: { jawaban: { select: { id: true } } } });
        // Never replace answers that a user may have edited after a previous seed.
        if (existing?.jawaban.length) return 'preserved';
        const assignment = existing ?? await tx.penugasanOpd.create({ data: { id: stableId('assignment', year, opd.id, code), periodeId: period.id, indikatorId: indicator.id, opdId: opd.id, deadline: period.endDate, status: 'AKTIF' } });
        await tx.penugasanPertanyaan.createMany({ data: questions.map(question => ({ penugasanId: assignment.id, pertanyaanId: question.id, required: question.tipeJawaban === 'FILE' ? false : question.wajibDefault })), skipDuplicates: true });
        const status = indicatorIndex === 0 ? 'DRAFT' : 'DIKIRIM';
        const answer = await tx.jawabanOpd.create({ data: { id: stableId('answer', year, opd.id, code), penugasanId: assignment.id, status, version: 1, submittedAt: status === 'DIKIRIM' ? new Date() : null, lockedAt: status === 'DIKIRIM' ? new Date() : null } });
        const details = [];
        for (const question of questions) {
          if (question.tipeJawaban === 'FILE') continue;
          const regions = question.dimensiWilayah ? districts : [null];
          for (const [districtIndex, district] of regions.entries()) {
            const detail = { jawabanId: answer.id, pertanyaanId: question.id, wilayahId: district?.id ?? null, isPublic: false };
            if (question.tipeJawaban === 'NUMBER') detail.valueNumber = numericValue(question, opdIndex, districtIndex);
            else if (question.tipeJawaban === 'BOOLEAN') detail.valueBoolean = true;
            else if (question.tipeJawaban === 'DATE') detail.valueDate = new Date(`${year}-06-15T00:00:00Z`);
            else if (question.tipeJawaban === 'CHECKBOX') { if (!question.opsi.length) throw new Error(`Pilihan ${question.kode} belum diatur.`); detail.valueText = JSON.stringify(question.opsi.slice(0, 2).map(item => item.label)); }
            else if (['RADIO', 'DROPDOWN', 'OPTIONS'].includes(question.tipeJawaban)) { if (!question.opsi.length) throw new Error(`Pilihan ${question.kode} belum diatur.`); detail.valueText = question.opsi[opdIndex % question.opsi.length].label; }
            else detail.valueText = `Contoh program ${opd.singkatan} untuk ${indicator.nama}. Data dummy untuk demonstrasi.`;
            details.push(detail);
          }
        }
        await tx.detailJawaban.createMany({ data: details });
        const required = questions.filter(question => question.wajibDefault && question.tipeJawaban !== 'FILE').reduce((sum, question) => sum + (question.dimensiWilayah ? districts.length : 1), 0);
        await tx.progresPengisian.upsert({ where: { penugasanId: assignment.id }, create: { penugasanId: assignment.id, requiredCount: required, filledCount: required, percent: 100, lastActivityAt: new Date() }, update: { requiredCount: required, filledCount: required, percent: 100 } });
        await tx.riwayatStatusJawaban.create({ data: { jawabanId: answer.id, statusFrom: null, statusTo: status, reason: 'Data dummy demonstrasi visualisasi OPD; bukan data resmi.' } });
        return 'created';
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
      if (result === 'created') created++; else preserved++;
    }
    console.log(`${opd.singkatan}: 2 indikator, akun ${email} (role OPD, cakupan ${opd.singkatan}).`);
  }
  console.log(`Selesai: ${created} jawaban demo ditambahkan, ${preserved} jawaban yang sudah ada dipertahankan. Periode ${periodCode}; ${districts.length} kecamatan. Data tidak dipublikasikan.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
