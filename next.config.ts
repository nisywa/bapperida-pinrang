import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// ------------------------------------------------------------
// DATABASE_URL resolution guard
// The sandbox injects a global env var DATABASE_URL=file:... (SQLite)
// which takes precedence over .env. Since the app now uses Supabase
// PostgreSQL, we read .env manually and override the stale value
// BEFORE any app code (Prisma Client) loads.
// ------------------------------------------------------------
(function resolveDatabaseUrl() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/^DATABASE_URL="?([^"\r\n]+)"?\s*$/m);
    if (match) {
      const fromEnvFile = match[1];
      const current = process.env.DATABASE_URL;
      if (!current || current.startsWith("file:") || current !== fromEnvFile) {
        process.env.DATABASE_URL = fromEnvFile;
        console.log(
          "[next.config] DATABASE_URL overridden from .env:",
          fromEnvFile.replace(/:[^:@/]*@/, ":****@")
        );
      }
    }
  } catch {
    // .env missing -> keep whatever is set
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
