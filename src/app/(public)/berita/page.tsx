import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatTanggal } from "@/lib/constants";
import { ArticleIcon } from "@/components/public/article-icon";

export const revalidate = 60;

export const metadata = { title: "Berita & Artikel" };

export default async function BeritaPage() {
  const artikelList = await db.artikel.findMany({
    where: { status: "PUBLISHED", showOnMainPortal: true },
    orderBy: { publishedAt: "desc" },
    include: { opd: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Berita &amp; Artikel</h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Kabar dari Bapperida dan Perangkat Daerah yang ditampilkan pada portal utama.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {artikelList.map((a) => (
          <Link key={a.id} href={`/berita/${a.slug}`} className="group">
            <Card className="h-full border shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-200 group-hover:shadow-md">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f0e9] text-[#56816c] ring-1 ring-[#d4e4d8]"><ArticleIcon title={a.judul} photoUrl={a.thumbnailUrl} className="h-6 w-6" /></span>
                  <Badge variant="secondary" className="text-xs">
                    {a.opd ? a.opd.singkatan : "Bapperida"}
                  </Badge>
                </div>
                <h2 className="mt-4 font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                  {a.judul}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {a.ringkasan}
                </p>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-slate-500">
                  <span>{formatTanggal(a.publishedAt)}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    Baca <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {artikelList.length === 0 && (
          <p className="col-span-full rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Belum ada berita yang dipublikasikan.
          </p>
        )}
      </div>
    </div>
  );
}
