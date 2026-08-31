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
      const current = process.env.DATABASE_URL;
      // Only fill the gap when nothing valid is set (e.g. sandbox injects a
      // stale SQLite file: URL). NEVER override a proper external DATABASE_URL
      // such as the one configured in Vercel Environment Variables.
      if (!current || current.startsWith("file:")) {
        process.env.DATABASE_URL = match[1];
        console.log(
          "[next.config] DATABASE_URL resolved from .env:",
          match[1].replace(/:[^:@/]*@/, ":****@")
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
