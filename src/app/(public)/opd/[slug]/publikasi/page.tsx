import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publikasi OPD" };

export default async function OpdPublikasiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opd = await db.opd.findUnique({ where: { slug } });
  if (!opd || opd.status !== "AKTIF") notFound();

  const publikasiList = await db.publikasi.findMany({
    where: { opdId: opd.id, status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
          Publikasi {opd.singkatan}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Dokumen resmi {opd.nama} yang dapat diunduh masyarakat.
        </p>
      </header>

      <div className="space-y-3">
        {publikasiList.map((p) => (
          <Card key={p.id} className="border shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-700">
                {p.jenisFile}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900">{p.judul}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.deskripsi}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant="secondary" className="text-[10px]">Tahun {p.tahun ?? "-"}</Badge>
                  <span>{formatTanggal(p.publishedAt)}</span>
                </div>
              </div>
              <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                <a href={`/api/public/publikasi/${p.id}/download`}>
                  <FileDown className="mr-1.5 h-4 w-4" /> Unduh
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
        {publikasiList.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Belum ada publikasi dari OPD ini.
          </p>
        )}
      </div>
    </div>
  );
}
