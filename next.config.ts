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
    let current = process.env.DATABASE_URL;

    // 1) Fill the gap when nothing valid is set (e.g. sandbox injects a stale
    //    SQLite file: URL). NEVER override a proper external DATABASE_URL such
    //    as the one configured in Vercel Environment Variables.
    if (!current || current.startsWith("file:")) {
      const envPath = path.join(process.cwd(), ".env");
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^DATABASE_URL="?([^"\r\n]+)"?\s*$/m);
      if (match) {
        current = match[1];
        console.log(
          "[next.config] DATABASE_URL resolved from .env:",
          current.replace(/:[^:@/]*@/, ":****@")
        );
      }
    }

    // 2) Supabase pooler tuning: build-time prerendering renders many ISR
    //    pages in parallel and starves a connection_limit=1 pool (pool
    //    timeout during `next build` on Vercel). Give the build phase a
    //    larger pool; keep the serverless runtime frugal (1 per instance).
    if (current && current.includes("pooler.supabase.com")) {
      const isBuildPhase =
        process.env.NEXT_PHASE === "phase-production-build";
      const url = new URL(current);
      if (isBuildPhase) {
        url.searchParams.set("connection_limit", "8");
        url.searchParams.set("pool_timeout", "20");
        console.log(
          "[next.config] BUILD phase: Prisma pool connection_limit=8, pool_timeout=20"
        );
      } else {
        if (!url.searchParams.get("connection_limit")) {
          url.searchParams.set("connection_limit", "1");
        }
      }
      process.env.DATABASE_URL = url.toString();
    }
  } catch {
    // .env missing / URL parse failure -> keep whatever is set
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
