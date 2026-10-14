BEGIN;
CREATE TABLE IF NOT EXISTS "WebsiteVisit" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "pathname" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebsiteVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WebsiteVisit_createdAt_visitorId_idx" ON "WebsiteVisit"("createdAt", "visitorId");
ALTER TABLE "WebsiteVisit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "WebsiteVisit" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "WebsiteVisit" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "WebsiteVisit" FROM authenticated;
  END IF;
END $$;
COMMIT;
