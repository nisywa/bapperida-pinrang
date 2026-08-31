import { DataDashboardSection } from "@/components/public/data-dashboard";
import { db } from "@/lib/db";
import { ShieldCheck } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Data & Statistik" };

export default async function DataPublikPage() {
  const datasets = await db.datasetPublik.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 1,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Data &amp; Statistik</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
          Dashboard publik menyajikan dataset yang telah melalui proses verifikasi Bapperida dan
          ditetapkan sebagai data publik melalui mekanisme snapshot — sehingga angka yang tampil
          stabil dan terkendali sesuai prinsip <em>public by approval</em>.
        </p>
        {datasets[0]?.publishedAt && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Snapshot terakhir dipublikasikan: {formatTanggal(datasets[0].publishedAt)}
          </p>
        )}
      </header>

      <DataDashboardSection />
    </div>
  );
}
