import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DataDashboardSection } from "@/components/public/data-dashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Data OPD" };

export default async function OpdDataPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opd = await db.opd.findUnique({ where: { slug } });
  if (!opd || opd.status !== "AKTIF") notFound();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
          Data Publik {opd.singkatan}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Hanya dataset dari {opd.nama} yang telah diverifikasi dan dipublikasikan yang tampil di sini.
        </p>
      </header>
      <DataDashboardSection opdId={opd.id} />
    </div>
  );
}
