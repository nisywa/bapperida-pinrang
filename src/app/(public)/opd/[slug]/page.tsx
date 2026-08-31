import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileDown, Newspaper, Eye, Target, ListChecks } from "lucide-react";

export const revalidate = 60;

export default async function OpdBerandaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opd = await db.opd.findUnique({ where: { slug }, include: { profil: true } });
  if (!opd || opd.status !== "AKTIF") notFound();

  const [beritaList, publikasiList, datasetList] = await Promise.all([
    db.artikel.findMany({
      where: { opdId: opd.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.publikasi.findMany({
      where: { opdId: opd.id, status: "PUBLISHED", visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.datasetPublik.findMany({
      where: { status: "PUBLISHED", detail: { some: { opdId: opd.id } } },
      include: { indikator: true },
      take: 4,
    }),
  ]);

  let misi: string[] = [];
  try {
    misi = opd.profil?.misi ? JSON.parse(opd.profil.misi) : [];
  } catch {
    misi = [];
  }

  return (
    <div className="space-y-12">
      {/* Profil */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="border shadow-sm lg:col-span-2">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-900">Profil {opd.singkatan}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{opd.profil?.deskripsi}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50/70 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <Eye className="h-3.5 w-3.5" /> Visi
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{opd.profil?.visi}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <ListChecks className="h-3.5 w-3.5" /> Misi
                </p>
                <ul className="mt-2 space-y-1.5">
                  {misi.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data publik OPD */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Data Publik OPD</h2>
            <p className="mt-1 text-xs text-slate-500">Dataset terverifikasi yang telah dipublikasikan</p>
            <div className="mt-4 space-y-3">
              {datasetList.length === 0 && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  Belum ada dataset publik dari OPD ini.
                </p>
              )}
              {datasetList.map((d) => (
                <Link
                  key={d.id}
                  href={`/opd/${opd.slug}/data`}
                  className="block rounded-xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <p className="text-xs font-medium text-emerald-700">{d.indikator.nama}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {d.indikator.kode} · Periode {d.periodeId ? "" : ""}Tersedia
                  </p>
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Link href={`/opd/${opd.slug}/data`}>
                Lihat Dashboard Data <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Berita OPD */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-slate-900">Berita {opd.singkatan}</h2>
          <Link href={`/opd/${opd.slug}/berita`} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Semua Berita <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {beritaList.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Belum ada berita yang dipublikasikan.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {beritaList.map((a) => (
              <Link key={a.id} href={`/berita/${a.slug}`} className="group">
                <Card className="h-full border shadow-sm transition-all group-hover:border-emerald-200 group-hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="text-3xl">{a.thumbnailEmoji}</span>
                    <p className="mt-3 text-xs text-slate-500">
                      {a.publishedAt?.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h3 className="mt-1 font-semibold leading-snug text-slate-900 group-hover:text-emerald-700 line-clamp-2">
                      {a.judul}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{a.ringkasan}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Publikasi OPD */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-slate-900">Publikasi {opd.singkatan}</h2>
          <Link href={`/opd/${opd.slug}/publikasi`} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Semua Publikasi <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {publikasiList.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
            Belum ada publikasi yang dipublikasikan.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {publikasiList.map((p) => (
              <Card key={p.id} className="border shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                    {p.jenisFile}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{p.judul}</h3>
                    <p className="text-xs text-slate-500">{p.tahun}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    <FileDown className="mr-1 h-3 w-3" /> Unduh
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
