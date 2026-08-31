import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Berita OPD" };

export default async function OpdBeritaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opd = await db.opd.findUnique({ where: { slug } });
  if (!opd || opd.status !== "AKTIF") notFound();

  const beritaList = await db.artikel.findMany({
    where: { opdId: opd.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Berita {opd.singkatan}</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Seluruh artikel yang dipublikasikan oleh {opd.nama}.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {beritaList.map((a) => (
          <Link key={a.id} href={`/berita/${a.slug}`} className="group">
            <Card className="h-full border shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-200 group-hover:shadow-md">
              <CardContent className="flex h-full flex-col p-6">
                <span className="text-4xl">{a.thumbnailEmoji}</span>
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
        {beritaList.length === 0 && (
          <p className="col-span-full rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Belum ada berita dari OPD ini.
          </p>
        )}
      </div>
    </div>
  );
}
