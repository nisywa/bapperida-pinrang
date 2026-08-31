import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Building2 } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publikasi" };

export default async function PublikasiPage() {
  const publikasiList = await db.publikasi.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { publishedAt: "desc" },
    include: { opd: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Publikasi &amp; Download</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
          Dokumen dan data resmi yang telah disetujui untuk diakses masyarakat. Setiap unduhan tercatat
          pada sistem untuk keperluan audit dan pemantauan pemakaian.
        </p>
      </header>

      <div className="space-y-3">
        {publikasiList.map((p) => (
          <Card key={p.id} className="border shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-700 shadow-inner">
                {p.jenisFile}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{p.judul}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    <Building2 className="mr-1 h-2.5 w-2.5" />
                    {p.opd ? p.opd.nama : "Bapperida"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.deskripsi}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  Tahun {p.tahun ?? "-"} · Diterbitkan {formatTanggal(p.publishedAt)} · {p.downloadCount} unduhan
                </p>
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
            Belum ada publikasi yang dipublikasikan.
          </p>
        )}
      </div>
    </div>
  );
}
