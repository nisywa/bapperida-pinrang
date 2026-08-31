import Link from "next/link";
import { db } from "@/lib/db";
import {
  ArrowRight, BarChart3, Building2, FileDown, MapPinned,
  Newspaper, ShieldCheck, Database, Users, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const [settings, opdList, artikelFeatured, artikelTerbaru, publikasiList, kecamatanCount, datasetCount] =
    await Promise.all([
      db.siteSetting.findMany(),
      db.opd.findMany({ where: { status: "AKTIF" }, orderBy: { sortOrder: "asc" }, include: { profil: true } }),
      db.artikel.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { publishedAt: "desc" },
        take: 1,
        include: { opd: true },
      }),
      db.artikel.findMany({
        where: { status: "PUBLISHED", showOnMainPortal: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
        include: { opd: true },
      }),
      db.publikasi.findMany({
        where: { status: "PUBLISHED", visibility: "PUBLIC" },
        orderBy: { publishedAt: "desc" },
        take: 4,
        include: { opd: true },
      }),
      db.wilayah.count({ where: { isActive: true } }),
      db.datasetPublik.count({ where: { status: "PUBLISHED" } }),
    ]);

  const s = (key: string, fallback = "") => settings.find((x) => x.key === key)?.value ?? fallback;
  const heroArtikel = artikelFeatured[0];
  const beritaLain = artikelTerbaru.filter((a) => a.id !== heroArtikel?.id).slice(0, 3);
  const opdCount = opdList.length;

  const stats = [
    { label: "Perangkat Daerah", value: opdCount, icon: Building2 },
    { label: "Kecamatan", value: kecamatanCount, icon: MapPinned },
    { label: "Dataset Publik", value: datasetCount, icon: Database },
    { label: "Publikasi Terbuka", value: publikasiList.length >= 4 ? "4+" : publikasiList.length, icon: FileDown },
  ];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="white" strokeWidth="1.5">
              <polygon points="60,80 220,60 260,180 120,220" />
              <polygon points="220,60 380,90 400,200 260,180" />
              <polygon points="380,90 540,70 580,170 400,200" />
              <polygon points="120,220 260,180 280,320 140,340" />
              <polygon points="260,180 400,200 420,330 280,320" />
              <polygon points="400,200 580,170 620,300 420,330" />
              <polygon points="540,70 700,110 720,220 580,170" />
              <polygon points="580,170 720,220 660,340 620,300" />
            </g>
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <Badge className="bg-emerald-700/60 text-emerald-100 border-emerald-500/30 backdrop-blur">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Data Terverifikasi · Public by Approval
          </Badge>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-tight">
            {s("hero_title", "Sistem Pelayanan Digital Terpadu")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-100/90 md:text-lg">
            {s("hero_subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50">
              <Link href="/data">
                <BarChart3 className="mr-2 h-5 w-5" /> Dashboard Data Publik
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-300/40 bg-transparent text-white hover:bg-emerald-800/50 hover:text-white">
              <Link href="/opd">
                <Building2 className="mr-2 h-5 w-5" /> Direktori OPD
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-emerald-700/40 bg-emerald-950/40 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-emerald-700/30 md:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="flex items-center gap-4 px-4 py-6 md:px-8">
                <st.icon className="h-8 w-8 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold leading-none md:text-3xl">{st.value}</p>
                  <p className="mt-1 text-xs text-emerald-200/80 md:text-sm">{st.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FITUR ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Pengumpulan Terpadu",
              desc: "Seluruh OPD mengisi indikator data pada satu aplikasi dengan penugasan per periode dan tenggat yang jelas.",
            },
            {
              icon: ShieldCheck,
              title: "Terverifikasi Bapperida",
              desc: "Data yang dikirim OPD melalui proses verifikasi sebelum ditetapkan sebagai dataset publik yang sah.",
            },
            {
              icon: TrendingUp,
              title: "Visualisasi Wilayah",
              desc: "Peta choropleth kecamatan dan grafik analitik yang membantu memahami data pembangunan secara spasial.",
            },
          ].map((f) => (
            <Card key={f.title} className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <f.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ BERITA ============ */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Berita &amp; Artikel</h2>
              <p className="mt-1 text-sm text-slate-600">Informasi dari Bapperida dan Perangkat Daerah</p>
            </div>
            <Button asChild variant="ghost" className="text-emerald-700 hover:text-emerald-800">
              <Link href="/berita">
                Semua Berita <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {heroArtikel && (
              <Link href={`/berita/${heroArtikel.slug}`} className="group lg:row-span-2">
                <div className="flex h-full min-h-72 flex-col rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white shadow-md transition-shadow group-hover:shadow-xl">
                  <span className="text-5xl">{heroArtikel.thumbnailEmoji}</span>
                  <Badge className="mt-auto w-fit bg-white/15 text-white border-white/20 backdrop-blur">
                    <Newspaper className="mr-1 h-3 w-3" /> Utama
                  </Badge>
                  <h3 className="mt-3 text-xl font-bold leading-snug">{heroArtikel.judul}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-emerald-100/90">{heroArtikel.ringkasan}</p>
                  <p className="mt-4 text-xs text-emerald-200/80">
                    {heroArtikel.opd ? heroArtikel.opd.nama : "Bapperida Kabupaten Pinrang"}
                  </p>
                </div>
              </Link>
            )}
            {beritaLain.map((a) => (
              <Link key={a.id} href={`/berita/${a.slug}`} className="group">
                <Card className="h-full border shadow-sm transition-all group-hover:shadow-md group-hover:border-emerald-200">
                  <CardContent className="flex h-full gap-4 p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-3xl">
                      {a.thumbnailEmoji}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-700 font-medium">
                        {a.opd ? a.opd.singkatan : "Bapperida"} · {a.publishedAt?.toLocaleDateString("id-ID")}
                      </p>
                      <h3 className="mt-1 font-semibold leading-snug text-slate-900 group-hover:text-emerald-700 line-clamp-2">
                        {a.judul}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{a.ringkasan}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OPD ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Direktori OPD</h2>
            <p className="mt-1 text-sm text-slate-600">Halaman resmi tiap Perangkat Daerah dalam satu template terpadu</p>
          </div>
          <Button asChild variant="ghost" className="text-emerald-700">
            <Link href="/opd">
              Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {opdList.slice(0, 8).map((opd) => (
            <Link key={opd.id} href={`/opd/${opd.slug}`} className="group">
              <Card className="h-full border shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:shadow-md">
                <CardContent className="p-5 text-center">
                  <span className="text-4xl">{opd.profil?.logoEmoji ?? "🏛️"}</span>
                  <h3 className="mt-3 text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                    {opd.nama}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{opd.singkatan}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ PUBLIKASI ============ */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Publikasi &amp; Download</h2>
              <p className="mt-1 text-sm text-slate-600">Dokumen resmi yang dapat diunduh masyarakat</p>
            </div>
            <Button asChild variant="ghost" className="text-emerald-700">
              <Link href="/publikasi">
                Semua Publikasi <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {publikasiList.map((p) => (
              <Card key={p.id} className="border shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                    {p.jenisFile}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{p.judul}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.opd ? p.opd.nama : "Bapperida"} · {p.tahun ?? "-"}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Link href={`/publikasi`}>
                      <FileDown className="mr-1 h-4 w-4" /> Unduh
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA INTERNAL ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 px-8 py-10 text-white shadow-lg md:px-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold">Anda Perangkat Daerah?</h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
                Masuk ke backoffice untuk mengisi indikator yang ditugaskan, memantau progres,
                serta mengelola profil, artikel, dan publikasi OPD Anda.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-white text-emerald-800 hover:bg-emerald-50">
              <Link href="/login">
                <Users className="mr-2 h-5 w-5" /> Login Internal
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
