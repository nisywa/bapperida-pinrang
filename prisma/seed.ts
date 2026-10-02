// ============================================================
// Seed data - Sistem Pelayanan Digital BAPPERIDA Kabupaten Pinrang
// Jalankan: bun prisma/seed.ts
// ============================================================
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

// ---------- util ----------
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  console.log("🌱 Seeding database...");

  // Hapus semua data (urutan menghormati FK)
  await db.activityLog.deleteMany();
  await db.uploadedFile.deleteMany();
  await db.siteSetting.deleteMany();
  await db.datasetPublikDetail.deleteMany();
  await db.datasetPublik.deleteMany();
  await db.konfigurasiVisualisasi.deleteMany();
  await db.notifikasiPenerima.deleteMany();
  await db.notifikasi.deleteMany();
  await db.publikasi.deleteMany();
  await db.artikelKategori.deleteMany();
  await db.artikel.deleteMany();
  await db.kategoriArtikel.deleteMany();
  await db.progresPengisian.deleteMany();
  await db.riwayatStatusJawaban.deleteMany();
  await db.verifikasi.deleteMany();
  await db.detailJawaban.deleteMany();
  await db.jawabanOpd.deleteMany();
  await db.penugasanPertanyaan.deleteMany();
  await db.penugasanOpd.deleteMany();
  await db.periodePengisian.deleteMany();
  await db.opsiPertanyaan.deleteMany();
  await db.pertanyaanIndikator.deleteMany();
  await db.aspekIndikator.deleteMany();
  await db.indikator.deleteMany();
  await db.wilayah.deleteMany();
  await db.opdProfile.deleteMany();
  await db.opd.deleteMany();
  await db.user.deleteMany();

  // ============ 1. SITE SETTINGS ============
  const settings: Array<[string, string]> = [
    ["site_title", "Bapperida Kabupaten Pinrang"],
    ["site_tagline", "Badan Perencanaan Pembangunan, Riset dan Pengembangan Daerah"],
    [
      "hero_title",
      "Sistem Pelayanan Digital Terpadu",
      ],
    [
      "hero_subtitle",
      "Platform terpadu pengelolaan data lintas OPD Kabupaten Pinrang — pengumpulan indikator, verifikasi, visualisasi wilayah, dan publikasi informasi untuk masyarakat.",
    ],
    ["contact_address", "Jalan Bintang No. 1, Macorawalie, Kecamatan Watang Sawitto, Kabupaten Pinrang, Sulawesi Selatan 91212"],
    ["contact_email", "bapperida@pinrang.go.id"],
    ["contact_phone", "(0421) 91251"],
    ["vision", "Terwujudnya Kabupaten Pinrang yang maju, mandiri, dan berdaya saing melalui perencanaan pembangunan berbasis data."],
  ];
  for (const [key, value] of settings) {
    await db.siteSetting.create({ data: { key, value } });
  }

  // ============ 2. OPD ============
  const opdDefs = [
    { kode: "7307.01", nama: "Dinas Kesehatan", singkatan: "Dinkes", slug: "dinas-kesehatan", emoji: "🏥", warna: "emerald", deskripsi: "Dinas Kesehatan Kabupaten Pinrang bertanggung jawab atas penyelenggaraan urusan pemerintahan bidang kesehatan, termasuk upaya kesehatan masyarakat, upaya kesehatan individu, dan pengelolaan sarana kesehatan daerah.", visi: "Masyarakat Pinrang yang sehat, mandiri, dan berkeadilan dalam pelayanan kesehatan.", misi: ["Menurunkan angka kematian ibu dan bayi", "Meningkatkan akses pelayanan kesehatan primer", "Mengendalikan penyakit menular dan tidak menular", "Memperkuat sistem informasi kesehatan"] },
    { kode: "7307.02", nama: "Dinas Pendidikan dan Kebudayaan", singkatan: "Disdikbud", slug: "dinas-pendidikan-dan-kebudayaan", emoji: "🎓", warna: "amber", deskripsi: "Dinas Pendidikan dan Kebudayaan mengelola urusan pendidikan dasar dan menengah, pendidikan nonformal, kebudayaan, serta kepermusaan daerah.", visi: "Pendidikan berkualitas dan budaya Pinrang yang hidup dan berdaya saing.", misi: ["Memperluas akses pendidikan berkualitas", "Meningkatkan kompetensi pendidik dan tenaga kependidikan", "Melestarikan budaya Pinrang", "Digitalisasi layanan pendidikan"] },
    { kode: "7307.03", nama: "Dinas Pekerjaan Umum dan Penataan Ruang", singkatan: "DPUPR", slug: "dinas-pekerjaan-umum-dan-penataan-ruang", emoji: "🛣️", warna: "slate", deskripsi: "DPUPR Kabupaten Pinrang menangani jalan, jembatan, irigasi, air baku, serta penataan ruang dan bangunan gedung daerah.", visi: "Infrastruktur daerah yang andal dan ruang kawasan yang tertata.", misi: ["Meningkatkan kondisi jalan kabupaten", "Memperluas akses air bersih", "Penataan ruang berbasis data", "Penguatan tata kelola bangunan"] },
    { kode: "7307.04", nama: "Dinas Perindustrian, Perdagangan, Koperasi dan UKM", singkatan: "Disperindag", slug: "dinas-perindustrian-perdagangan-koperasi-dan-ukm", emoji: "🏭", warna: "teal", deskripsi: "Disperindag memfasilitasi industri, perdagangan, koperasi, dan usaha mikro kecil menengah di Kabupaten Pinrang.", visi: "Ekonomi daerah yang tumbuh inklusif berbasis industri dan UMKM.", misi: ["Pengembangan sentra UMKM", "Fasilitasi pasar rakyat", "Peningkatan iklim investasi", "Penguatan koperasi daerah"] },
    { kode: "7307.05", nama: "Dinas Sosial", singkatan: "Dinsos", slug: "dinas-sosial", emoji: "🤝", warna: "rose", deskripsi: "Dinas Sosial Kabupaten Pinrang melaksanakan urusan pemerintahan bidang sosial, pemberdayaan masyarakat, dan perlindungan sosial.", visi: "Masyarakat sosial yang adaptif dan sejahtera.", misi: ["Peningkatan kesejahteraan sosial", "Pemberdayaan penyandang masalah sosial", "Penguatan jaring pengaman sosial", "Tanggap bencana sosial"] },
    { kode: "7307.06", nama: "Dinas Ketahanan Pangan", singkatan: "DKP", slug: "dinas-ketahanan-pangan", emoji: "🌾", warna: "lime", deskripsi: "Dinas Ketahanan Pangan mengelola ketersediaan, akses, dan pemanfaatan pangan serta pertanian daerah.", visi: "Ketahanan pangan daerah yang stabil dan berkelanjutan.", misi: ["Peningkatan produksi pangan lokal", "Pengembangan lahan pertanian", "Stabilisasi harga pangan", "Diversifikasi pangan"] },
    { kode: "7307.07", nama: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo", slug: "dinas-komunikasi-dan-informatika", emoji: "📡", warna: "cyan", deskripsi: "Diskominfo Kabupaten Pinrang mengelola informatika, statistik daerah, persandian, dan hubungan masyarakat.", visi: "Pinrang digital: pemerintahan cerdas dan masyarakat literat.", misi: ["Digitalisasi layanan publik", "Perluasan jaringan internet daerah", "Peningkatan literasi digital", "Penguatan egovernance"] },
    { kode: "7307.08", nama: "Dinas Pemberdayaan Masyarakat dan Desa", singkatan: "DPMD", slug: "dinas-pemberdayaan-masyarakat-dan-desa", emoji: "🏘️", warna: "orange", deskripsi: "DPMD memfasilitasi pemberdayaan masyarakat, kapasitas aparat desa, dan pemerintahan desa di Kabupaten Pinrang.", visi: "Desa yang mandiri dan masyarakat yang berdaya.", misi: ["Penguatan tata kelola desa", "Peningkatan kapasitas perangkat desa", "Pengembangan BUMDes", "Pemberdayaan masyarakat"] },
  ];

  const opdMap: Record<string, string> = {};
  for (let i = 0; i < opdDefs.length; i++) {
    const d = opdDefs[i];
    const opd = await db.opd.create({
      data: {
        kode: d.kode,
        nama: d.nama,
        singkatan: d.singkatan,
        slug: d.slug,
        sortOrder: i + 1,
      },
    });
    opdMap[d.singkatan] = opd.id;
    await db.opdProfile.create({
      data: {
        opdId: opd.id,
        logoEmoji: d.emoji,
        warnaTema: d.warna,
        deskripsi: d.deskripsi,
        visi: d.visi,
        misi: JSON.stringify(d.misi),
        alamat: "Jl. Jend. Sudirman No. 1, Pangkajene, Pinrang",
        telepon: `(0421) 91${100 + i}`,
        emailPublic: `${d.slug}@pinrang.go.id`,
        heroRingkasan: `${d.nama} Kabupaten Pinrang — melayani masyarakat dengan berbasis data dan teknologi.`,
      },
    });
  }

  // ============ 3. USERS ============
  const pwd = hashPassword("Opd#123");
  await db.user.create({ data: { nama: "Administrator Sistem", email: "admin@pinrang.go.id", passwordHash: hashPassword("Admin#123"), role: "ADMIN" } });
  const bapperidaUser = await db.user.create({ data: { nama: "Sekretaris Bapperida", email: "bapperida@pinrang.go.id", passwordHash: hashPassword("Bapperida#123"), role: "BAPPERIDA" } });

  const userNames: Record<string, string> = {
    Dinkes: "dr. Hj. Nurhayati, M.Kes",
    Disdikbud: "Dr. Ahmad Fauzi, M.Pd",
    DPUPR: "Ir. H. Bakri Sampara",
    Disperindag: "Hj. Andi Tenri, S.E",
    Dinsos: "H. Sulaiman Lamaddukka",
    DKP: "Ir. Wahyuddin, M.Si",
    Diskominfo: "Rahmat Hidayat, S.Kom",
    DPMD: "H. Muh. Arif, S.Sos",
  };
  const userIdMap: Record<string, string> = {};
  for (const [singk, nama] of Object.entries(userNames)) {
    const slug = opdDefs.find((o) => o.singkatan === singk)!.slug;
    const u = await db.user.create({
      data: { nama, email: `${slug.replace(/-/g, "")}@pinrang.go.id`, passwordHash: pwd, role: "OPD", opdId: opdMap[singk] },
    });
    userIdMap[singk] = u.id;
  }

  // ============ 4. WILAYAH (12 Kecamatan Pinrang) ============
  // Layout skematik grid 4x4 (12 sel terisi) dengan jitter deterministik
  const rng = mulberry32(42);
  const LNG0 = 119.46, LNG1 = 119.86, LAT0 = -3.46, LAT1 = -3.98;
  const COLS = 4, ROWS = 4;
  const latStep = (LAT1 - LAT0) / ROWS;
  const lngStep = (LNG1 - LNG0) / COLS;

  // vertex lattice [r][c] = [lat,lng]
  const verts: [number, number][][] = [];
  for (let r = 0; r <= ROWS; r++) {
    const row: [number, number][] = [];
    for (let c = 0; c <= COLS; c++) {
      let lat = LAT0 + r * latStep;
      let lng = LNG0 + c * lngStep;
      const isEdge = r === 0 || r === ROWS || c === 0 || c === COLS;
      if (!isEdge) {
        lat += (rng() - 0.5) * latStep * 0.45;
        lng += (rng() - 0.5) * lngStep * 0.45;
      }
      row.push([lat, lng]);
    }
    verts.push(row);
  }

  const kecamatanDefs: Array<{ kode: string; nama: string; r: number; c: number; base: number }> = [
    { kode: "7307010", nama: "Watang Sawitto", r: 0, c: 1, base: 0.62 },
    { kode: "7307020", nama: "Suppa", r: 0, c: 0, base: 0.55 },
    { kode: "7307030", nama: "Duampanua", r: 0, c: 2, base: 0.70 },
    { kode: "7307040", nama: "Tiroang", r: 1, c: 3, base: 0.48 },
    { kode: "7307050", nama: "Patampanua", r: 1, c: 2, base: 0.66 },
    { kode: "7307060", nama: "Paleteang", r: 1, c: 1, base: 0.74 },
    { kode: "7307070", nama: "Mattiro Sompe", r: 1, c: 0, base: 0.58 },
    { kode: "7307080", nama: "Lanrisang", r: 2, c: 3, base: 0.52 },
    { kode: "7307090", nama: "Cempa", r: 2, c: 2, base: 0.60 },
    { kode: "7307100", nama: "Lembang", r: 2, c: 1, base: 0.78 },
    { kode: "7307110", nama: "Mattiro Bulu", r: 2, c: 0, base: 0.44 },
    { kode: "7307120", nama: "Batu Lappa", r: 3, c: 1, base: 0.50 },
  ];

  const wilayahMap: Record<string, string> = {}; // nama -> id
  for (const k of kecamatanDefs) {
    const ring: [number, number][] = [
      verts[k.r][k.c],
      verts[k.r][k.c + 1],
      verts[k.r + 1][k.c + 1],
      verts[k.r + 1][k.c],
    ];
    const geometry = JSON.stringify({
      type: "Polygon",
      coordinates: [[...ring, ring[0]].map(([lat, lng]) => [Math.round(lng * 10000) / 10000, Math.round(lat * 10000) / 10000])],
    });
    const centerLat = (ring[0][0] + ring[2][0]) / 2;
    const centerLng = (ring[0][1] + ring[2][1]) / 2;
    const w = await db.wilayah.create({
      data: {
        kodeBps: k.kode,
        nama: k.nama,
        jenis: "KECAMATAN",
        geometry,
        centroidLat: centerLat,
        centroidLng: centerLng,
      },
    });
    wilayahMap[k.nama] = w.id;
    (k as any).id = w.id;
    (k as any).centerLat = centerLat;
  }

  // ============ 5. INDIKATOR ============
  type SeedQuestion = {
    kode: string;
    pertanyaan: string;
    tipe: string;
    satuan?: string;
    dimensiWilayah: boolean;
    help?: string;
    opsi?: string[];
  };
  type SeedIndicator = {
    kode: string;
    nama: string;
    deskripsi: string;
    satuan: string;
    warna: string;
    aspek: Array<{ nama: string; pertanyaan: SeedQuestion[] }>;
  };

  const indikatorDefs: SeedIndicator[] = [
    {
      kode: "IND-01",
      nama: "Kesehatan Masyarakat",
      deskripsi: "Indikator utama kesehatan masyarakat Kabupaten Pinrang mencakup fasilitas kesehatan, kualitas gizi, dan kesehatan reproduksi.",
      satuan: "unit",
      warna: "emerald",
      aspek: [
        {
          nama: "Fasilitas Kesehatan",
          pertanyaan: [
            { kode: "IND01-FK-01", pertanyaan: "Jumlah Puskesmas", tipe: "NUMBER", satuan: "unit", dimensiWilayah: false, help: "Masukkan total jumlah Puskesmas di wilayah kerja." },
            { kode: "IND01-FK-02", pertanyaan: "Jumlah Posyandu per Kecamatan", tipe: "NUMBER", satuan: "unit", dimensiWilayah: true, help: "Isi jumlah posyandu untuk setiap kecamatan." },
          ],
        },
        {
          nama: "Kualitas Kesehatan",
          pertanyaan: [
            { kode: "IND01-KK-01", pertanyaan: "Persentase Balita Gizi Baik", tipe: "NUMBER", satuan: "%", dimensiWilayah: true, help: "Persentase balita dengan status gizi baik per kecamatan." },
            { kode: "IND01-KK-02", pertanyaan: "Persentase Peserta KB Aktif", tipe: "NUMBER", satuan: "%", dimensiWilayah: true },
          ],
        },
      ],
    },
    {
      kode: "IND-02",
      nama: "Pendidikan dan Kebudayaan",
      deskripsi: "Sarana dan partisipasi pendidikan di Kabupaten Pinrang.",
      satuan: "unit",
      warna: "amber",
      aspek: [
        {
          nama: "Sarana Pendidikan",
          pertanyaan: [
            { kode: "IND02-SP-01", pertanyaan: "Jumlah SD Negeri per Kecamatan", tipe: "NUMBER", satuan: "unit", dimensiWilayah: true },
            { kode: "IND02-SP-02", pertanyaan: "Jumlah SMP Sederajat per Kecamatan", tipe: "NUMBER", satuan: "unit", dimensiWilayah: true },
          ],
        },
        {
          nama: "Partisipasi Pendidikan",
          pertanyaan: [
            { kode: "IND02-PP-01", pertanyaan: "Persentase Angka Partisipasi Sekolah Usia SMP", tipe: "NUMBER", satuan: "%", dimensiWilayah: false },
          ],
        },
      ],
    },
    {
      kode: "IND-03",
      nama: "Infrastruktur Dasar",
      deskripsi: "Kondisi infrastruktur jalan dan akses layanan dasar.",
      satuan: "km",
      warna: "cyan",
      aspek: [
        {
          nama: "Jalan dan Jaringan",
          pertanyaan: [
            { kode: "IND03-JJ-01", pertanyaan: "Kondisi Jalan Baik per Kecamatan", tipe: "NUMBER", satuan: "km", dimensiWilayah: true },
            { kode: "IND03-JJ-02", pertanyaan: "Persentase Rumah Tangga Akses Air Bersih", tipe: "NUMBER", satuan: "%", dimensiWilayah: true },
          ],
        },
      ],
    },
    {
      kode: "IND-04",
      nama: "Perekonomian Daerah",
      deskripsi: "Pasar rakyat, industri, dan pertanian daerah.",
      satuan: "unit",
      warna: "teal",
      aspek: [
        {
          nama: "Pasar dan Perdagangan",
          pertanyaan: [
            { kode: "IND04-PP-01", pertanyaan: "Jumlah Pasar Rakyat Aktif per Kecamatan", tipe: "NUMBER", satuan: "unit", dimensiWilayah: true },
          ],
        },
        {
          nama: "Ketahanan Pangan",
          pertanyaan: [
            { kode: "IND04-KP-01", pertanyaan: "Luas Lahan Pertanian per Kecamatan", tipe: "NUMBER", satuan: "Ha", dimensiWilayah: true },
          ],
        },
      ],
    },
    {
      kode: "IND-05",
      nama: "Kualitas Sosial",
      deskripsi: "Perlindungan sosial dan indikator sosial lainnya.",
      satuan: "jiwa",
      warna: "rose",
      aspek: [
        {
          nama: "Perlindungan Sosial",
          pertanyaan: [
            { kode: "IND05-PS-01", pertanyaan: "Jumlah Penerima Bantuan Sosial per Kecamatan", tipe: "NUMBER", satuan: "jiwa", dimensiWilayah: true },
            { kode: "IND05-PS-02", pertanyaan: "Status Penanganan Stunting", tipe: "OPTIONS", dimensiWilayah: false, opsi: ["Baik", "Cukup", "Perlu Perhatian"] },
            { kode: "IND05-PS-03", pertanyaan: "Terdapat Rumah Singgah Sosial?", tipe: "BOOLEAN", dimensiWilayah: false },
            { kode: "IND05-PS-04", pertanyaan: "Program Unggulan Perlindungan Sosial", tipe: "TEXT", dimensiWilayah: false },
          ],
        },
      ],
    },
  ];

  const pertanyaanMap: Record<string, string> = {}; // kode -> id
  const indikatorMap: Record<string, string> = {}; // kode -> id
  for (let i = 0; i < indikatorDefs.length; i++) {
    const d = indikatorDefs[i];
    const ind = await db.indikator.create({
      data: {
        kode: d.kode,
        nama: d.nama,
        deskripsi: d.deskripsi,
        satuanDefault: d.satuan,
        warna: d.warna,
        sortOrder: i + 1,
      },
    });
    indikatorMap[d.kode] = ind.id;
    for (let j = 0; j < d.aspek.length; j++) {
      const a = d.aspek[j];
      const aspek = await db.aspekIndikator.create({
        data: { indikatorId: ind.id, nama: a.nama, sortOrder: j + 1 },
      });
      for (let k = 0; k < a.pertanyaan.length; k++) {
        const q = a.pertanyaan[k];
        const pq = await db.pertanyaanIndikator.create({
          data: {
            aspekId: aspek.id,
            kode: q.kode,
            pertanyaan: q.pertanyaan,
            tipeJawaban: q.tipe,
            dimensiWilayah: !!q.dimensiWilayah,
            satuan: q.satuan,
            helpText: q.help,
            sortOrder: k + 1,
          },
        });
        pertanyaanMap[q.kode] = pq.id;
        if (q.opsi) {
          for (let o = 0; o < q.opsi.length; o++) {
            await db.opsiPertanyaan.create({ data: { pertanyaanId: pq.id, label: q.opsi[o], nilai: q.opsi[o].toUpperCase().replace(/ /g, "_"), sortOrder: o } });
          }
        }
      }
    }
    await db.konfigurasiVisualisasi.create({
      data: {
        indikatorId: ind.id,
        chartType: "CHOROPLETH",
        aggregation: d.kode === "IND-01" && d.nama === "Kesehatan Masyarakat" ? "AVG" : "SUM",
        satuan: d.satuan,
        paletteKey: d.warna,
        visibility: "PUBLIC",
      },
    });
  }

  // ============ 6. PERIODE ============
  const periode2025 = await db.periodePengisian.create({
    data: {
      kode: "PERIODE-2025",
      nama: "Pengumpulan Data Tahun 2025",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: "DITUTUP",
      createdBy: bapperidaUser.id,
    },
  });
  const periode2026 = await db.periodePengisian.create({
    data: {
      kode: "SEM-1-2026",
      nama: "Tahun 2026 - Semester 1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      status: "AKTIF",
      createdBy: bapperidaUser.id,
    },
  });

  // ============ 7. PENUGASAN ============
  const assignmentDefs: Array<{ opd: string; indikator: string; deadline: string; targetStatus: string; fillRatio: number }> = [
    { opd: "Dinkes", indikator: "IND-01", deadline: "2026-09-15", targetStatus: "TERVERIFIKASI", fillRatio: 1 },
    { opd: "DPUPR", indikator: "IND-03", deadline: "2026-09-30", targetStatus: "TERVERIFIKASI", fillRatio: 1 },
    { opd: "Disdikbud", indikator: "IND-02", deadline: "2026-09-20", targetStatus: "DIKIRIM", fillRatio: 1 },
    { opd: "Disperindag", indikator: "IND-04", deadline: "2026-09-25", targetStatus: "DRAFT", fillRatio: 0.6 },
    { opd: "DKP", indikator: "IND-04", deadline: "2026-09-25", targetStatus: "DRAFT", fillRatio: 0.4 },
    { opd: "Dinsos", indikator: "IND-05", deadline: "2026-09-28", targetStatus: "PERLU_PERBAIKAN", fillRatio: 1 },
  ];

  const wilayahList = await db.wilayah.findMany({ orderBy: { kodeBps: "asc" } });
  const rngVal = mulberry32(7);

  for (const a of assignmentDefs) {
    const opdId = opdMap[a.opd];
    const indikatorId = indikatorMap[a.indikator];
    const penugasan = await db.penugasanOpd.create({
      data: {
        periodeId: periode2026.id,
        indikatorId,
        opdId,
        deadline: new Date(a.deadline),
        status: "AKTIF",
      },
    });

    // target pertanyaan: semua pertanyaan milik indikator
    const aspeks = await db.aspekIndikator.findMany({ where: { indikatorId }, include: { pertanyaan: true } });
    const allQs = aspeks.flatMap((as) => as.pertanyaan);
    for (const q of allQs) {
      await db.penugasanPertanyaan.create({
        data: { penugasanId: penugasan.id, pertanyaanId: q.id, required: true },
      });
    }

    const isDraft = a.targetStatus === "DRAFT";
    const jawaban = await db.jawabanOpd.create({
      data: {
        penugasanId: penugasan.id,
        version: 1,
        status: a.targetStatus,
        submittedAt: isDraft ? null : new Date("2026-07-15"),
        lockedAt: isDraft ? null : new Date("2026-07-15"),
      },
    });

    let filled = 0;
    for (const q of allQs) {
      const fillWilayah = isDraft
        ? wilayahList.slice(0, Math.floor(wilayahList.length * a.fillRatio))
        : wilayahList;
      if (q.dimensiWilayah) {
        for (let wi = 0; wi < fillWilayah.length; wi++) {
          const w = fillWilayah[wi];
          const base = (wi * 37 + q.kode.length * 13) % 30;
          const jitter = rngVal() * 0.4 + 0.8;
          let val: number;
          if (q.kode === "IND01-FK-02") val = Math.round(4 + base / 6 * jitter);
          else if (q.kode === "IND01-KK-01") val = Math.round((62 + base * jitter) * 10) / 10;
          else if (q.kode === "IND01-KK-02") val = Math.round((45 + base * 1.2 * jitter) * 10) / 10;
          else if (q.kode === "IND02-SP-01") val = Math.round(10 + base * jitter);
          else if (q.kode === "IND02-SP-02") val = Math.round(4 + base / 4 * jitter);
          else if (q.kode === "IND03-JJ-01") val = Math.round((8 + base * 0.5 * jitter) * 10) / 10;
          else if (q.kode === "IND03-JJ-02") val = Math.round((55 + base * 1.3 * jitter) * 10) / 10;
          else if (q.kode === "IND04-PP-01") val = Math.round(1 + base / 9 * jitter);
          else if (q.kode === "IND04-KP-01") val = Math.round(120 + base * 18 * jitter);
          else val = Math.round(150 + base * 25 * jitter);
          await db.detailJawaban.create({
            data: { jawabanId: jawaban.id, pertanyaanId: q.id, wilayahId: w.id, valueNumber: val },
          });
          filled++;
        }
      } else {
        let textVal: string | null = null;
        let numVal: number | null = null;
        let boolVal: boolean | null = null;
        if (q.tipeJawaban === "NUMBER") numVal = q.kode === "IND01-FK-01" ? 14 : q.kode === "IND02-PP-01" ? 87.5 : 0;
        else if (q.tipeJawaban === "OPTIONS") textVal = "Cukup";
        else if (q.tipeJawaban === "BOOLEAN") boolVal = true;
        else textVal = "Gerakan Masyarakat Peduli Perlindungan Sosial (GEMASOSIAL)";
        await db.detailJawaban.create({
          data: {
            jawabanId: jawaban.id,
            pertanyaanId: q.id,
            valueText: textVal,
            valueNumber: numVal,
            valueBoolean: boolVal,
          },
        });
        filled++;
      }
    }

    if (!isDraft) {
      await db.riwayatStatusJawaban.create({
        data: { jawabanId: jawaban.id, statusFrom: "DRAFT", statusTo: "DIKIRIM", changedBy: userIdMap[a.opd], reason: "Pengiriman data oleh OPD", changedAt: new Date("2026-07-15") },
      });
    }
    if (a.targetStatus === "TERVERIFIKASI") {
      await db.verifikasi.create({
        data: { jawabanId: jawaban.id, verifierId: bapperidaUser.id, status: "TERVERIFIKASI", catatan: "Data lengkap dan valid. Terima kasih.", verifiedAt: new Date("2026-07-28") },
      });
      await db.riwayatStatusJawaban.create({
        data: { jawabanId: jawaban.id, statusFrom: "DIKIRIM", statusTo: "TERVERIFIKASI", changedBy: bapperidaUser.id, reason: "Verifikasi disetujui", changedAt: new Date("2026-07-28") },
      });
    }
    if (a.targetStatus === "PERLU_PERBAIKAN") {
      await db.verifikasi.create({
        data: { jawabanId: jawaban.id, verifierId: bapperidaUser.id, status: "PERLU_PERBAIKAN", catatan: "Nilai bantuan sosial untuk Kecamatan Batu Lappa dan Mattiro Bulu tampak tidak konsisten dengan periode sebelumnya. Mohon dicek ulang.", verifiedAt: new Date("2026-08-02") },
      });
      await db.riwayatStatusJawaban.create({
        data: { jawabanId: jawaban.id, statusFrom: "DIKIRIM", statusTo: "PERLU_PERBAIKAN", changedBy: bapperidaUser.id, reason: "Perlu verifikasi ulang nilai tertentu", changedAt: new Date("2026-08-02") },
      });
    }

    const requiredCount = allQs.reduce((acc, q) => acc + (q.dimensiWilayah ? wilayahList.length : 1), 0);
    const percent = Math.min(100, Math.round((filled / requiredCount) * 1000) / 10);
    await db.progresPengisian.create({
      data: { penugasanId: penugasan.id, requiredCount, filledCount: filled, percent, lastActivityAt: new Date("2026-08-10"), calculatedAt: new Date() },
    });

    // Penugasan periode 2025 (semua terverifikasi, tanpa detail - hanya untuk riwayat)
    await db.penugasanOpd.create({
      data: { periodeId: periode2025.id, indikatorId, opdId, deadline: new Date("2025-12-31"), status: "SELESAI" },
    });
  }

  // ============ 8. DATASET PUBLIK (snapshot terverifikasi) ============
  for (const indKode of ["IND-01", "IND-03"]) {
    const indikatorId = indikatorMap[indKode];
    const penugasan = await db.penugasanOpd.findFirst({
      where: { indikatorId, periodeId: periode2026.id },
      include: { jawaban: { include: { detail: true } } },
    });
    if (!penugasan || !penugasan.jawaban.length) continue;
    const jawaban = penugasan.jawaban[0];
    const dataset = await db.datasetPublik.create({
      data: { indikatorId, periodeId: periode2026.id, version: 1, status: "PUBLISHED", publishedAt: new Date("2026-08-01"), notes: "Snapshot resmi data terverifikasi Semester 1 2026" },
    });
    for (const d of jawaban.detail) {
      if (d.wilayahId && d.valueNumber !== null) {
        const q = await db.pertanyaanIndikator.findUnique({ where: { id: d.pertanyaanId } });
        if (q) {
          await db.datasetPublikDetail.create({
            data: { datasetId: dataset.id, opdId: penugasan.opdId, wilayahId: d.wilayahId, metricKey: q.kode, metricValue: d.valueNumber },
          });
        }
      }
    }
  }

  // ============ 9. KATEGORI + ARTIKEL ============
  const kategoriDefs = [
    { nama: "Berita", slug: "berita" },
    { nama: "Pengumuman", slug: "pengumuman" },
    { nama: "Kegiatan", slug: "kegiatan" },
    { nama: "Prestasi", slug: "prestasi" },
  ];
  const kategoriMap: Record<string, string> = {};
  for (const k of kategoriDefs) {
    const kat = await db.kategoriArtikel.create({ data: { nama: k.nama, slug: k.slug } });
    kategoriMap[k.slug] = kat.id;
  }

  const artikelDefs = [
    { opd: null, judul: "Bapperida Pinrang Luncurkan Sistem Pelayanan Digital Terpadu", slug: "bapperida-pinrang-luncurkan-sistem-pelayanan-digital-terpadu", ringkasan: "Kabupaten Pinrang resmi meluncurkan Sistem Pelayanan Digital terpadu untuk mengelola data lintas Perangkat Daerah, dari pengumpulan indikator hingga publikasi informasi masyarakat.", isi: "Badan Perencanaan Pembangunan, Riset dan Pengembangan Daerah (Bapperida) Kabupaten Pinrang resmi meluncurkan Sistem Pelayanan Digital Terpadu pada hari ini. Sistem ini dirancang sebagai satu platform untuk mengelola kebutuhan data lintas Organisasi Perangkat Daerah (OPD), memantau progres pengisian indikator, memfasilitasi verifikasi data, menyajikan dashboard dan visualisasi berbasis wilayah, serta menyediakan kanal publikasi informasi kepada masyarakat.\n\nDengan sistem ini, seluruh OPD memperoleh ruang kerja dan halaman publik masing-masing yang berjalan pada satu aplikasi dan satu basis data yang sama. Pemisahan data dilakukan melalui mekanisme otorisasi berbasis peran dan cakupan OPD sehingga pengelolaan tetap terpusat dan efisien.\n\n\"Kami berharap sistem ini mempercepat pengumpulan data yang selama ini tersebar, meningkatkan kualitas data melalui verifikasi, dan membuka transparansi kepada masyarakat,\" ujar kepala Bapperida Kabupaten Pinrang.", thumbnailEmoji: "🚀", status: "PUBLISHED", featured: true, showOnMain: true, kategori: "berita" },
    { opd: null, judul: "Monitoring Progres Pengisian Indikator Semester 1 2026 Capai 78%", slug: "monitoring-progres-pengisian-indikator-semester-1-2026", ringkasan: "Progres pengisian indikator lintas OPD pada periode Semester 1 2026 mencapai 78 persen dengan enam OPD telah menyelesaikan penugasan datanya.", isi: "Bapperida Kabupaten Pinrang melaporkan bahwa progres pengisian indikator data pada periode Tahun 2026 Semester 1 telah mencapai 78 persen. Dari enam penugasan indikator kepada OPD, dua penugasan telah terverifikasi penuh, satu penugasan dalam proses verifikasi, dan sisanya masih dalam tahap pengisian maupun perbaikan.\n\nSistem Pelayanan Digital yang baru diluncurkan memungkinkan pemantauan kelengkapan secara real time. Bapperida mengingatkan seluruh OPD untuk menuntaskan pengisian sebelum tenggat yang telah ditetapkan pada masing-masing penugasan.\n\nPengingat otomatis dikirimkan oleh sistem pada H-7, H-3, dan H-1 sebelum tenggat melalui pusat notifikasi backoffice masing-masing OPD.", thumbnailEmoji: "📊", status: "PUBLISHED", featured: true, showOnMain: true, kategori: "pengumuman" },
    { opd: "Dinkes", judul: "Dinas Kesehatan Perkuat Pendataan Posyandu di 12 Kecamatan", slug: "dinas-kesehatan-perkuat-pendataan-posyandu", ringkasan: "Dinas Kesehatan Kabupaten Pinrang melakukan pemutakhiran data posyandu di seluruh kecamatan sebagai bagian dari kewajiban pengisian indikator kesehatan masyarakat.", isi: "Dinas Kesehatan Kabupaten Pinrang melaksanakan pendataan menyeluruh terhadap posyandu di 12 kecamatan. Kegiatan ini merupakan bagian dari pengisian indikator Kesehatan Masyarakat pada Sistem Pelayanan Digital Bapperida.\n\nData yang dikumpulkan mencakup jumlah posyandu aktif, persentase balita dengan status gizi baik, serta persentase peserta KB aktif per kecamatan. Seluruh nilai dimasukkan per kecamatan sesuai fitur dimensi wilayah pada sistem.\n\n\"Dengan data per kecamatan, kita bisa melihat peta ketimpangan dan menentukan intervensi yang tepat sasaran,\" kata Kepala Dinas Kesehatan.", thumbnailEmoji: "🏥", status: "PUBLISHED", featured: false, showOnMain: true, kategori: "kegiatan" },
    { opd: "DPUPR", judul: "DPUPR Selesaikan Pendataan Kondisi Jalan Kabupaten", slug: "dpupr-selesaikan-pendataan-kondisi-jalan", ringkasan: "Dinas PUPR menuntaskan pendataan kondisi jalan kabupaten per kecamatan dengan tingkat kelengkapan 100 persen dan telah diverifikasi Bapperida.", isi: "Dinas Pekerjaan Umum dan Penataan Ruang (DPUPR) Kabupaten Pinrang menyelesaikan pendataan kondisi jalan kabupaten per kecamatan. Data meliputi panjang jalan dalam kondisi baik serta persentase rumah tangga yang mengakses air bersih.\n\nSeluruh data telah dikirim melalui sistem dan memperoleh status Terverifikasi dari Bapperida. Data ini kini tersedia pada dashboard publik sebagai bagian dari transparansi informasi infrastruktur.\n\nHasil pendataan akan menjadi dasar perencanaan penanganan jalan pada Tahun Anggaran 2027.", thumbnailEmoji: "🛣️", status: "PUBLISHED", featured: false, showOnMain: true, kategori: "berita" },
    { opd: "Diskominfo", judul: "Literasi Digital untuk Perangkat Daerah Digelar Bulan Ini", slug: "literasi-digital-untuk-perangkat-daerah", ringkasan: "Diskominfo menggelar pelatihan literasi digital bagi perangkat daerah sebagai persiapan pemanfaatan sistem pelayanan digital terpadu.", isi: "Dinas Komunikasi dan Informatika Kabupaten Pinrang menggelar pelatihan literasi digital bagi perangkat daerah. Pelatihan mencakup penggunaan sistem pelayanan digital terpadu, keamanan data, dan praktik terbaik pengelolaan konten portal OPD.\n\nPeserta terdiri dari operator data dan pengelola konten dari seluruh OPD. Materi disampaikan secara praktis dengan sesi hands-on langsung pada sistem.", thumbnailEmoji: "📡", status: "PUBLISHED", featured: false, showOnMain: false, kategori: "kegiatan" },
    { opd: "Disdikbud", judul: "Sekolah Siap Data: Pendataan Sarana Pendidikan Dimulai", slug: "sekolah-siap-data-pendataan-sarana-pendidikan", ringkasan: "Disdikbud memulai pendataan jumlah sekolah dan partisipasi belajar per kecamatan pada periode Semester 1 2026.", isi: "Dinas Pendidikan dan Kebudayaan memulai pendataan sarana pendidikan per kecamatan melalui Sistem Pelayanan Digital Bapperida. Data yang dikumpulkan meliputi jumlah SD Negeri, jumlah SMP sederajat, serta angka partisipasi sekolah usia SMP.\n\nSaat ini pendataan telah selesai dan menunggu proses verifikasi oleh Bapperida sebelum data dipublikasikan ke masyarakat.", thumbnailEmoji: "🎓", status: "PUBLISHED", featured: false, showOnMain: false, kategori: "berita" },
    { opd: "Dinsos", judul: "Pendataan Bantuan Sosial Dalam Proses Perbaikan Data", slug: "pendataan-bantuan-sosial-dalam-proses-perbaikan", ringkasan: "Dinsos sedang memperbaiki data bantuan sosial per kecamatan sesuai catatan verifikasi Bapperida.", isi: "Dinas Sosial tengah melakukan perbaikan data penerima bantuan sosial per kecamatan. Perbaikan dilakukan sesuai catatan dari verifikator Bapperida terkait konsistensi nilai pada beberapa kecamatan.\n\nSetelah diperbaiki, data akan dikirim ulang untuk diverifikasi kembali sebelum dipublikasikan.", thumbnailEmoji: "🤝", status: "PUBLISHED", featured: false, showOnMain: false, kategori: "pengumuman" },
  ];

  for (const a of artikelDefs) {
    await db.artikel.create({
      data: {
        opdId: a.opd ? opdMap[a.opd] : null,
        judul: a.judul,
        slug: a.slug,
        ringkasan: a.ringkasan,
        isi: a.isi,
        thumbnailEmoji: a.thumbnailEmoji,
        status: a.status,
        featured: a.featured,
        showOnMainPortal: a.showOnMain,
        publishedAt: a.status === "PUBLISHED" ? new Date("2026-08-05") : null,
        createdBy: a.opd ? userIdMap[a.opd] : bapperidaUser.id,
      },
    });
  }

  // ============ 10. PUBLIKASI ============
  const publikasiDefs = [
    { opd: null, judul: "Laporan Kinerja Bapperida Kabupaten Pinrang 2025", slug: "laporan-kinerja-bapperida-2025", deskripsi: "Laporan kinerja tahunan Bapperida Kabupaten Pinrang yang memuat capaian target perencanaan, riset daerah, dan pengembangan data.", tahun: 2025, jenisFile: "PDF" },
    { opd: "Dinkes", judul: "Data Indikator Kesehatan Kabupaten Pinrang 2026", slug: "data-indikator-kesehatan-pinrang-2026", deskripsi: "Rangkuman data indikator kesehatan masyarakat per kecamatan, mencakup posyandu, gizi balita, dan peserta KB aktif.", tahun: 2026, jenisFile: "XLSX" },
    { opd: "DPUPR", judul: "Data Infrastruktur Jalan Kabupaten Pinrang", slug: "data-infrastruktur-jalan-pinrang", deskripsi: "Data panjang jalan baik per kecamatan dan akses air bersih rumah tangga hasil pendataan Semester 1 2026.", tahun: 2026, jenisFile: "CSV" },
    { opd: "Disdikbud", judul: "Statistik Pendidikan Kabupaten Pinrang", slug: "statistik-pendidikan-pinrang", deskripsi: "Statistik sarana pendidikan dan partisipasi belajar di Kabupaten Pinrang.", tahun: 2025, jenisFile: "PDF" },
    { opd: null, judul: "Ringkasan Eksekutif RPJMD Pinrang (Draf)", slug: "ringkasan-eksekutif-rpjmd-pinrang", deskripsi: "Ringkasan eksekutif draf RPJMD Kabupaten Pinrang (belum dipublikasikan).", tahun: 2026, jenisFile: "PDF", status: "DRAFT" },
  ];
  for (const p of publikasiDefs) {
    await db.publikasi.create({
      data: {
        opdId: p.opd ? opdMap[p.opd] : null,
        judul: p.judul,
        slug: p.slug,
        deskripsi: p.deskripsi,
        tahun: p.tahun,
        jenisFile: p.jenisFile,
        status: p.status || "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt: p.status === "DRAFT" ? null : new Date("2026-08-01"),
        createdBy: p.opd ? userIdMap[p.opd] : bapperidaUser.id,
      },
    });
  }

  // ============ 11. NOTIFIKASI ============
  const penugasanList = await db.penugasanOpd.findMany({ where: { periodeId: periode2026.id }, include: { indikator: true, opd: true } });
  for (const p of penugasanList) {
    const opdUser = await db.user.findFirst({ where: { opdId: p.opdId } });
    if (!opdUser) continue;
    const notif = await db.notifikasi.create({
      data: {
        type: "PENGINGAT",
        title: `Pengingat Pengisian Indikator ${p.indikator.nama}`,
        message: `Batas akhir pengisian indikator "${p.indikator.nama}" adalah ${p.deadline?.toLocaleDateString("id-ID")}. Mohon lengkapi data pada backoffice OPD Anda.`,
        opdId: p.opdId,
        periodeId: periode2026.id,
        penugasanId: p.id,
        createdBy: bapperidaUser.id,
      },
    });
    await db.notifikasiPenerima.create({
      data: { notifikasiId: notif.id, userId: opdUser.id, deliveryStatus: "TERKIRIM" },
    });
  }
  // Notifikasi perlu perbaikan untuk Dinsos
  const dinsosUser = await db.user.findFirst({ where: { opdId: opdMap["Dinsos"] } });
  if (dinsosUser) {
    const n2 = await db.notifikasi.create({
      data: {
        type: "VERIFIKASI",
        title: "Data Bantuan Sosial Perlu Perbaikan",
        message: "Verifikator memberikan catatan pada data bantuan sosial Anda. Silakan buka menu Pengisian Data > Perlu Perbaikan untuk melihat detail.",
        opdId: opdMap["Dinsos"],
        createdBy: bapperidaUser.id,
      },
    });
    await db.notifikasiPenerima.create({ data: { notifikasiId: n2.id, userId: dinsosUser.id, deliveryStatus: "TERKIRIM" } });
  }

  // ============ 12. ACTIVITY LOGS ============
  const logs = [
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: null, action: "CREATE", entity: "PeriodePengisian", entityId: periode2026.id, detail: "Membuat periode Tahun 2026 - Semester 1" },
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: null, action: "CREATE", entity: "PenugasanOpd", entityId: "-", detail: "Membuat 6 penugasan indikator kepada OPD" },
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: "Dinkes", action: "VERIFY", entity: "JawabanOpd", entityId: "-", detail: "Verifikasi data kesehatan: TERVERIFIKASI" },
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: "DPUPR", action: "VERIFY", entity: "JawabanOpd", entityId: "-", detail: "Verifikasi data infrastruktur: TERVERIFIKASI" },
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: "Dinsos", action: "VERIFY", entity: "JawabanOpd", entityId: "-", detail: "Verifikasi data sosial: PERLU_PERBAIKAN" },
    { actor: bapperidaUser.id, nama: "Sekretaris Bapperida", role: "BAPPERIDA", opd: null, action: "PUBLISH", entity: "DatasetPublik", entityId: "-", detail: "Publikasi snapshot dataset Kesehatan Masyarakat & Infrastruktur Dasar" },
  ];
  for (const l of logs) {
    await db.activityLog.create({
      data: {
        actorUserId: l.actor,
        actorNama: l.nama,
        actingRole: l.role,
        opdScopeNama: l.opd,
        action: l.action,
        entityType: l.entity,
        entityId: l.entityId,
        detail: l.detail,
        ipAddress: "10.10.1.10",
        userAgent: "Seed",
      },
    });
  }

  console.log("✅ Seed selesai!");
  console.log("   Login Admin    : admin@pinrang.go.id / Admin#123");
  console.log("   Login Bapperida: bapperida@pinrang.go.id / Bapperida#123");
  console.log("   Login OPD      : dinaskesehatan@pinrang.go.id / Opd#123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
