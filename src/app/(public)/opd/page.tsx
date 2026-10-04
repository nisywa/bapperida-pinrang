import Link from "next/link";
import { publicDb as db } from "@/lib/public-db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileDown, Newspaper } from "lucide-react";
import { OpdIcon } from "@/components/public/opd-icon";

export const revalidate = 60;

export const metadata = { title: "Direktori OPD" };

export default async function DirektoriOpdPage() {
  const [opdList, artikelCounts, publikasiCounts] = await Promise.all([
    db.opd.findMany({
    where: { status: "AKTIF" },
    orderBy: { sortOrder: "asc" },
    include: { profil: true },
    }),
    db.artikel.groupBy({ by: ["opdId"], where: { status: "PUBLISHED" }, _count: true }),
    db.publikasi.groupBy({ by: ["opdId"], where: { status: "PUBLISHED" }, _count: true }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Direktori Perangkat Daerah</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
          Seluruh OPD Kabupaten Pinrang memiliki halaman publik sendiri pada template yang sama
          melalui alamat <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-emerald-700">/opd/&#123;slug&#125;</code>.
          Pilih OPD untuk melihat profil, berita, data, dan publikasinya.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opdList.map((opd) => {
          const artCount = artikelCounts.find((x) => x.opdId === opd.id)?._count ?? 0;
          const pubCount = publikasiCounts.find((x) => x.opdId === opd.id)?._count ?? 0;
          return (
            <Card key={opd.id} className="group border shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start gap-4">
                  <OpdIcon name={opd.nama} />
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                      {opd.nama}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {opd.kode} · {opd.singkatan}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {opd.profil?.deskripsi}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Newspaper className="mr-1 h-3 w-3" /> {artCount} berita
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <FileDown className="mr-1 h-3 w-3" /> {pubCount} publikasi
                  </Badge>
                </div>
                <Link
                  href={`/opd/${opd.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Buka Halaman OPD <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
