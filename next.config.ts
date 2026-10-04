import type { NextConfig } from "next";

// Next.js loads .env files and preserves variables configured in Vercel.
// A local PostgreSQL server is only available during local development.
if (process.env.VERCEL === "1") {
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  } catch {
    throw new Error(
      "DATABASE_URL belum valid. Atur URL PostgreSQL online di Vercel > Settings > Environment Variables, lalu redeploy."
    );
  }

  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL di Vercel harus menggunakan PostgreSQL (postgresql:// atau postgres://).");
  }

  const host = databaseUrl.hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" || host.endsWith(".localhost") ||
    host === "[::1]" || host === "[::]" || host === "0.0.0.0" ||
    host.startsWith("127.")
  ) {
    throw new Error(
      "DATABASE_URL di Vercel masih menunjuk database lokal. Ganti dengan URL PostgreSQL online untuk environment deployment ini, lalu redeploy."
    );
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  // NOTE: "standalone" output removed — it is meant for self-hosting (Docker/
  // VPS) and causes ENOENT next-server.js.nft.json build failures with
  // Turbopack builds on Vercel. For self-hosting use: bun run build:selfhost
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
