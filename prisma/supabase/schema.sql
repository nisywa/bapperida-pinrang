-- Struktur kosong saja. Untuk memindahkan data lama gunakan backups/supabase-full.sql.
-- Jangan jalankan kedua file pada target yang sama.
BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "opdId" TEXT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opd" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "singkatan" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpdProfile" (
    "id" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "logoEmoji" TEXT NOT NULL DEFAULT '🏛️',
    "warnaTema" TEXT NOT NULL DEFAULT 'teal',
    "deskripsi" TEXT,
    "visi" TEXT,
    "misi" TEXT,
    "alamat" TEXT,
    "telepon" TEXT,
    "emailPublic" TEXT,
    "heroRingkasan" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpdProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wilayah" (
    "id" TEXT NOT NULL,
    "kodeBps" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'KECAMATAN',
    "geometry" TEXT,
    "centroidLat" DOUBLE PRECISION NOT NULL,
    "centroidLng" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indikator" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "satuanDefault" TEXT,
    "warna" TEXT NOT NULL DEFAULT 'teal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indikator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AspekIndikator" (
    "id" TEXT NOT NULL,
    "indikatorId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AspekIndikator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PertanyaanIndikator" (
    "id" TEXT NOT NULL,
    "aspekId" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "tipeJawaban" TEXT NOT NULL DEFAULT 'NUMBER',
    "wajibDefault" BOOLEAN NOT NULL DEFAULT true,
    "dimensiWilayah" BOOLEAN NOT NULL DEFAULT false,
    "satuan" TEXT,
    "helpText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PertanyaanIndikator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsiPertanyaan" (
    "id" TEXT NOT NULL,
    "pertanyaanId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OpsiPertanyaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodePengisian" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "lockAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodePengisian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenugasanOpd" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "indikatorId" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenugasanOpd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenugasanPertanyaan" (
    "id" TEXT NOT NULL,
    "penugasanId" TEXT NOT NULL,
    "pertanyaanId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PenugasanPertanyaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JawabanOpd" (
    "id" TEXT NOT NULL,
    "penugasanId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JawabanOpd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailJawaban" (
    "id" TEXT NOT NULL,
    "jawabanId" TEXT NOT NULL,
    "pertanyaanId" TEXT NOT NULL,
    "wilayahId" TEXT,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "valueBoolean" BOOLEAN,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetailJawaban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "opdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verifikasi" (
    "id" TEXT NOT NULL,
    "jawabanId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "catatan" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatStatusJawaban" (
    "id" TEXT NOT NULL,
    "jawabanId" TEXT NOT NULL,
    "statusFrom" TEXT,
    "statusTo" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatStatusJawaban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgresPengisian" (
    "id" TEXT NOT NULL,
    "penugasanId" TEXT NOT NULL,
    "requiredCount" INTEGER NOT NULL DEFAULT 0,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgresPengisian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KategoriArtikel" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KategoriArtikel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artikel" (
    "id" TEXT NOT NULL,
    "opdId" TEXT,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ringkasan" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "thumbnailEmoji" TEXT NOT NULL DEFAULT '📰',
    "thumbnailUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "showOnMainPortal" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artikel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtikelKategori" (
    "id" TEXT NOT NULL,
    "artikelId" TEXT NOT NULL,
    "kategoriId" TEXT NOT NULL,

    CONSTRAINT "ArtikelKategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publikasi" (
    "id" TEXT NOT NULL,
    "opdId" TEXT,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tahun" INTEGER,
    "jenisFile" TEXT NOT NULL DEFAULT 'PDF',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PENGINGAT',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "opdId" TEXT,
    "periodeId" TEXT,
    "penugasanId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifikasiPenerima" (
    "id" TEXT NOT NULL,
    "notifikasiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'TERKIRIM',

    CONSTRAINT "NotifikasiPenerima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonfigurasiVisualisasi" (
    "id" TEXT NOT NULL,
    "indikatorId" TEXT NOT NULL,
    "chartType" TEXT NOT NULL DEFAULT 'CHOROPLETH',
    "aggregation" TEXT NOT NULL DEFAULT 'SUM',
    "satuan" TEXT,
    "paletteKey" TEXT NOT NULL DEFAULT 'teal',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "configJson" TEXT,

    CONSTRAINT "KonfigurasiVisualisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetPublik" (
    "id" TEXT NOT NULL,
    "indikatorId" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DatasetPublik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetPublikDetail" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "opdId" TEXT,
    "wilayahId" TEXT,
    "metricKey" TEXT NOT NULL DEFAULT 'nilai',
    "metricValue" DOUBLE PRECISION,
    "metricText" TEXT,

    CONSTRAINT "DatasetPublikDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorNama" TEXT,
    "actingRole" TEXT,
    "opdScopeNama" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Opd_kode_key" ON "Opd"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Opd_slug_key" ON "Opd"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OpdProfile_opdId_key" ON "OpdProfile"("opdId");

-- CreateIndex
CREATE UNIQUE INDEX "Wilayah_kodeBps_key" ON "Wilayah"("kodeBps");

-- CreateIndex
CREATE UNIQUE INDEX "Indikator_kode_key" ON "Indikator"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "PertanyaanIndikator_kode_key" ON "PertanyaanIndikator"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodePengisian_kode_key" ON "PeriodePengisian"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "PenugasanOpd_periodeId_indikatorId_opdId_key" ON "PenugasanOpd"("periodeId", "indikatorId", "opdId");

-- CreateIndex
CREATE UNIQUE INDEX "PenugasanPertanyaan_penugasanId_pertanyaanId_key" ON "PenugasanPertanyaan"("penugasanId", "pertanyaanId");

-- CreateIndex
CREATE UNIQUE INDEX "JawabanOpd_penugasanId_version_key" ON "JawabanOpd"("penugasanId", "version");

-- CreateIndex
CREATE INDEX "DetailJawaban_jawabanId_pertanyaanId_idx" ON "DetailJawaban"("jawabanId", "pertanyaanId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedFile_storageName_key" ON "UploadedFile"("storageName");

-- CreateIndex
CREATE INDEX "UploadedFile_opdId_createdAt_idx" ON "UploadedFile"("opdId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProgresPengisian_penugasanId_key" ON "ProgresPengisian"("penugasanId");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriArtikel_slug_key" ON "KategoriArtikel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Artikel_slug_key" ON "Artikel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ArtikelKategori_artikelId_kategoriId_key" ON "ArtikelKategori"("artikelId", "kategoriId");

-- CreateIndex
CREATE UNIQUE INDEX "Publikasi_slug_key" ON "Publikasi"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NotifikasiPenerima_notifikasiId_userId_key" ON "NotifikasiPenerima"("notifikasiId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "KonfigurasiVisualisasi_indikatorId_key" ON "KonfigurasiVisualisasi"("indikatorId");

-- CreateIndex
CREATE INDEX "DatasetPublikDetail_datasetId_wilayahId_idx" ON "DatasetPublikDetail"("datasetId", "wilayahId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpdProfile" ADD CONSTRAINT "OpdProfile_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspekIndikator" ADD CONSTRAINT "AspekIndikator_indikatorId_fkey" FOREIGN KEY ("indikatorId") REFERENCES "Indikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PertanyaanIndikator" ADD CONSTRAINT "PertanyaanIndikator_aspekId_fkey" FOREIGN KEY ("aspekId") REFERENCES "AspekIndikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsiPertanyaan" ADD CONSTRAINT "OpsiPertanyaan_pertanyaanId_fkey" FOREIGN KEY ("pertanyaanId") REFERENCES "PertanyaanIndikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodePengisian" ADD CONSTRAINT "PeriodePengisian_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenugasanOpd" ADD CONSTRAINT "PenugasanOpd_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodePengisian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenugasanOpd" ADD CONSTRAINT "PenugasanOpd_indikatorId_fkey" FOREIGN KEY ("indikatorId") REFERENCES "Indikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenugasanOpd" ADD CONSTRAINT "PenugasanOpd_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenugasanPertanyaan" ADD CONSTRAINT "PenugasanPertanyaan_penugasanId_fkey" FOREIGN KEY ("penugasanId") REFERENCES "PenugasanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenugasanPertanyaan" ADD CONSTRAINT "PenugasanPertanyaan_pertanyaanId_fkey" FOREIGN KEY ("pertanyaanId") REFERENCES "PertanyaanIndikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanOpd" ADD CONSTRAINT "JawabanOpd_penugasanId_fkey" FOREIGN KEY ("penugasanId") REFERENCES "PenugasanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJawaban" ADD CONSTRAINT "DetailJawaban_jawabanId_fkey" FOREIGN KEY ("jawabanId") REFERENCES "JawabanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJawaban" ADD CONSTRAINT "DetailJawaban_pertanyaanId_fkey" FOREIGN KEY ("pertanyaanId") REFERENCES "PertanyaanIndikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJawaban" ADD CONSTRAINT "DetailJawaban_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "Wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifikasi" ADD CONSTRAINT "Verifikasi_jawabanId_fkey" FOREIGN KEY ("jawabanId") REFERENCES "JawabanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifikasi" ADD CONSTRAINT "Verifikasi_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatStatusJawaban" ADD CONSTRAINT "RiwayatStatusJawaban_jawabanId_fkey" FOREIGN KEY ("jawabanId") REFERENCES "JawabanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgresPengisian" ADD CONSTRAINT "ProgresPengisian_penugasanId_fkey" FOREIGN KEY ("penugasanId") REFERENCES "PenugasanOpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artikel" ADD CONSTRAINT "Artikel_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artikel" ADD CONSTRAINT "Artikel_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtikelKategori" ADD CONSTRAINT "ArtikelKategori_artikelId_fkey" FOREIGN KEY ("artikelId") REFERENCES "Artikel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtikelKategori" ADD CONSTRAINT "ArtikelKategori_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriArtikel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publikasi" ADD CONSTRAINT "Publikasi_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publikasi" ADD CONSTRAINT "Publikasi_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodePengisian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_penugasanId_fkey" FOREIGN KEY ("penugasanId") REFERENCES "PenugasanOpd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotifikasiPenerima" ADD CONSTRAINT "NotifikasiPenerima_notifikasiId_fkey" FOREIGN KEY ("notifikasiId") REFERENCES "Notifikasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotifikasiPenerima" ADD CONSTRAINT "NotifikasiPenerima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonfigurasiVisualisasi" ADD CONSTRAINT "KonfigurasiVisualisasi_indikatorId_fkey" FOREIGN KEY ("indikatorId") REFERENCES "Indikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetPublik" ADD CONSTRAINT "DatasetPublik_indikatorId_fkey" FOREIGN KEY ("indikatorId") REFERENCES "Indikator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetPublik" ADD CONSTRAINT "DatasetPublik_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodePengisian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetPublikDetail" ADD CONSTRAINT "DatasetPublikDetail_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "DatasetPublik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetPublikDetail" ADD CONSTRAINT "DatasetPublikDetail_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetPublikDetail" ADD CONSTRAINT "DatasetPublikDetail_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "Wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."User" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."User" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Opd" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Opd" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Opd" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."OpdProfile" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."OpdProfile" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."OpdProfile" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Wilayah" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Wilayah" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Wilayah" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Indikator" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Indikator" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Indikator" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."AspekIndikator" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."AspekIndikator" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."AspekIndikator" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."PertanyaanIndikator" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."PertanyaanIndikator" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."PertanyaanIndikator" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."OpsiPertanyaan" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."OpsiPertanyaan" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."OpsiPertanyaan" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."PeriodePengisian" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."PeriodePengisian" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."PeriodePengisian" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."PenugasanOpd" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."PenugasanOpd" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."PenugasanOpd" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."PenugasanPertanyaan" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."PenugasanPertanyaan" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."PenugasanPertanyaan" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."JawabanOpd" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."JawabanOpd" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."JawabanOpd" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."DetailJawaban" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."DetailJawaban" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."DetailJawaban" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."UploadedFile" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."UploadedFile" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."UploadedFile" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Verifikasi" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Verifikasi" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Verifikasi" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."RiwayatStatusJawaban" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."RiwayatStatusJawaban" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."RiwayatStatusJawaban" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."ProgresPengisian" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."ProgresPengisian" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."ProgresPengisian" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."KategoriArtikel" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."KategoriArtikel" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."KategoriArtikel" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Artikel" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Artikel" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Artikel" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."ArtikelKategori" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."ArtikelKategori" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."ArtikelKategori" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Publikasi" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Publikasi" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Publikasi" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."Notifikasi" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."Notifikasi" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."Notifikasi" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."NotifikasiPenerima" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."NotifikasiPenerima" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."NotifikasiPenerima" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."KonfigurasiVisualisasi" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."KonfigurasiVisualisasi" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."KonfigurasiVisualisasi" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."DatasetPublik" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."DatasetPublik" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."DatasetPublik" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."DatasetPublikDetail" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."DatasetPublikDetail" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."DatasetPublikDetail" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."SiteSetting" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."SiteSetting" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."SiteSetting" FROM authenticated;
  END IF;
END $$;

ALTER TABLE public."ActivityLog" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public."ActivityLog" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public."ActivityLog" FROM authenticated;
  END IF;
END $$;
COMMIT;
