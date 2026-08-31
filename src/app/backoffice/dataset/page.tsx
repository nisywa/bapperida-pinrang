import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTanggal } from "@/lib/constants";
import { Database, Rocket } from "lucide-react";
import { DatasetPublishList } from "@/components/backoffice/dataset-publish-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dataset Publik" };

export default async function DatasetPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const penugasanTerverifikasi = await db.penugasanOpd.findMany({
    include: {
      indikator: true,
      opd: true,
      periode: true,
      jawaban: { orderBy: { version: "desc" }, take: 1 },
      progres: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const datasets = await db.datasetPublik.findMany({
    include: { indikator: true, periode: true, _count: { select: { detail: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Database className="h-6 w-6 text-emerald-600" /> Dataset Publik
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Data terverifikasi tidak otomatis menjadi publik. Terbitkan snapshot dataset agar tampil pada
          dashboard publik — data internal dapat terus diperbarui tanpa mengubah angka publik.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4.5 w-4.5 text-emerald-600" /> Siap Dipublikasikan
            </CardTitle>
            <p className="text-xs text-slate-500">Hanya penugasan dengan data TERVERIFIKASI yang dapat diterbitkan.</p>
          </CardHeader>
          <CardContent>
            <DatasetPublishList
              items={penugasanTerverifikasi
                .filter((p) => p.jawaban[0]?.status === "TERVERIFIKASI")
                .map((p) => ({
                  penugasanId: p.id,
                  opdNama: p.opd.nama,
                  indikatorNama: p.indikator.nama,
                  periodeNama: p.periode.nama,
                  jawabanId: p.jawaban[0]?.id ?? "",
                }))}
            />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dataset Terbit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {datasets.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {d.indikator.nama} <span className="text-xs font-normal text-slate-500">v{d.version}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {d.periode.nama} · {d._count.detail} nilai wilayah · Terbit {formatTanggal(d.publishedAt)}
                  </p>
                </div>
                {d.status === "PUBLISHED" ? (
                  <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700">Publik</Badge>
                ) : (
                  <Badge className="shrink-0 border-slate-200 bg-slate-100 text-slate-600">Ditarik</Badge>
                )}
              </div>
            ))}
            {datasets.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Belum ada dataset yang dipublikasikan.</p>
            )}
            {datasets.some((d) => d.status === "PUBLISHED") && (
              <Button asChild variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <a href="/data" target="_blank" rel="noreferrer">
                  Lihat Dashboard Publik →
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
