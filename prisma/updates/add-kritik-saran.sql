BEGIN;
CREATE TABLE IF NOT EXISTS "KritikSaran" (
  "id" TEXT NOT NULL,
  "nama" TEXT NOT NULL,
  "email" TEXT,
  "telepon" TEXT,
  "jenis" TEXT NOT NULL,
  "pesan" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KritikSaran_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KritikSaran_jenis_check" CHECK ("jenis" IN ('KRITIK', 'SARAN'))
);
CREATE INDEX IF NOT EXISTS "KritikSaran_createdAt_idx" ON "KritikSaran"("createdAt");
ALTER TABLE "KritikSaran" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "KritikSaran" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "KritikSaran" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "KritikSaran" FROM authenticated;
  END IF;
END $$;
COMMIT;
