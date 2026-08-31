import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

export const revalidate = 60;

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artikel = await db.artikel.findUnique({
    where: { slug },
    include: { opd: { include: { profil: true } } },
  });
  if (!artikel || artikel.status !== "PUBLISHED") notFound();

  const terkait = await db.artikel.findMany({
    where: { status: "PUBLISHED", showOnMainPortal: true, id: { not: artikel.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 text-emerald-700">
        <Link href="/berita">
          <ArrowLeft className="mr-1 h-4 w-4" /> Kembali ke Berita
        </Link>
      </Button>

      <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <header className="bg-gradient-to-br from-emerald-800 to-teal-800 px-8 py-10 text-white">
          <span className="text-5xl">{artikel.thumbnailEmoji}</span>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <Badge className="bg-white/15 text-white border-white/20 backdrop-blur">
              <Building2 className="mr-1 h-3 w-3" />
              {artikel.opd ? artikel.opd.nama : "Bapperida Kabupaten Pinrang"}
            </Badge>
            <span className="text-emerald-200">{formatTanggal(artikel.publishedAt)}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{artikel.judul}</h1>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">{artikel.ringkasan}</p>
        </header>

        <div className="px-8 py-8">
          {artikel.isi.split("\n\n").map((par, i) => (
            <p key={i} className="mb-4 text-[15px] leading-relaxed text-slate-700">
              {par}
            </p>
          ))}
          {artikel.opd && (
            <div className="mt-8 rounded-xl bg-emerald-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Tentang {artikel.opd.singkatan}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700">
                {artikel.opd.profil?.deskripsi}
              </p>
              <Link
                href={`/opd/${artikel.opd.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Kunjungi halaman {artikel.opd.nama} →
              </Link>
            </div>
          )}
        </div>
      </article>

      {terkait.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Berita Terkait</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {terkait.map((t) => (
              <Link key={t.id} href={`/berita/${t.slug}`} className="group">
                <div className="h-full rounded-xl border bg-white p-4 shadow-sm transition-all group-hover:border-emerald-200 group-hover:shadow-md">
                  <span className="text-2xl">{t.thumbnailEmoji}</span>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                    {t.judul}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500">{formatTanggal(t.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
