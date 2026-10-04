import Link from "next/link";
import { publicDb as db } from "@/lib/public-db";
import {
  ArrowRight, BarChart3, Building2, FileDown, MapPinned,
  Newspaper, ShieldCheck, Database, Users, TrendingUp, Sparkles, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleIcon } from "@/components/public/article-icon";
import { OpdIcon } from "@/components/public/opd-icon";

export const revalidate = 60;

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
      <section className="relative overflow-hidden bg-[#dcecdf] text-[#24483a]">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-white/70 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-[#f1ead4]/60 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.09]" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#416856" strokeWidth="1.5">
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
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <Badge className="border-white/80 bg-white/55 text-[#416856] backdrop-blur">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Portal data pembangunan Pinrang
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.12] tracking-[-0.035em] md:text-6xl">
              {s("hero_title", "Sistem Pelayanan Digital Terpadu")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#527062] md:text-lg">
              {s("hero_subtitle")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#4f8068] text-white hover:bg-[#426f5a]">
                <Link href="/data">
                  <BarChart3 className="mr-1 h-5 w-5" /> Jelajahi Data Publik
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/80 bg-white/45 text-[#315a49] hover:border-white hover:bg-white/75 hover:text-[#24483a]">
                <Link href="/opd">
                  <Building2 className="mr-1 h-5 w-5" /> Direktori OPD
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden rounded-3xl border border-white/80 bg-white/40 p-6 shadow-[0_22px_55px_-38px_rgba(49,90,73,0.55)] backdrop-blur-sm lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#56816c]">Alur data terpercaya</p>
            <div className="mt-5 space-y-3">
              {[
                [Building2, "Data dihimpun oleh OPD"],
                [ShieldCheck, "Ditinjau dan diverifikasi Bapperida"],
                [CheckCircle2, "Disajikan transparan untuk masyarakat"],
              ].map(([Icon, label], index) => {
                const FlowIcon = Icon as typeof Building2;
                return (
                  <div key={label as string} className="flex items-center gap-4 rounded-2xl border border-white/75 bg-white/45 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4ddcb] text-[#416856]"><FlowIcon className="h-5 w-5" /></span>
                    <div><p className="text-[10px] font-semibold text-[#67927a]">0{index + 1}</p><p className="mt-0.5 text-sm font-medium text-[#294f40]">{label as string}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/70 bg-white/30 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/70 md:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="flex items-center gap-4 px-4 py-6 md:px-8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/55 text-[#56816c]"><st.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-bold leading-none md:text-3xl">{st.value}</p>
                  <p className="mt-1 text-xs text-[#668676] md:text-sm">{st.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FITUR ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
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
          ].map((f, index) => (
            <Card key={f.title} className="group border-white bg-white/80 transition-all hover:-translate-y-1 hover:border-[#d4e2d8] hover:shadow-[0_22px_48px_-30px_rgba(31,75,60,0.5)]">
              <CardContent className="p-7">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? "bg-[#eef0e8] text-[#687057]" : index === 2 ? "bg-[#edf1f3] text-[#516b75]" : "bg-[#e9f0eb] text-[#356451]"}`}>
                  <f.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="mt-5 font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ BERITA ============ */}
      <section className="border-y border-slate-200/60 bg-white/75 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4f7665]">Wawasan terkini</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Berita &amp; Artikel</h2>
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
                <div className="relative flex h-full min-h-80 flex-col overflow-hidden rounded-3xl bg-[#d0e5d5] p-8 text-[#24483a] shadow-[0_20px_45px_-30px_rgba(53,91,73,0.45)] transition-all group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/55 blur-2xl" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 text-[#4f8068] ring-1 ring-white/80"><ArticleIcon title={heroArtikel.judul} photoUrl={heroArtikel.thumbnailUrl} className="h-8 w-8" /></span>
                  <Badge className="mt-auto w-fit border-white/70 bg-white/50 text-[#416856] backdrop-blur">
                    <Newspaper className="mr-1 h-3 w-3" /> Utama
                  </Badge>
                  <h3 className="mt-3 text-xl font-bold leading-snug">{heroArtikel.judul}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#527062]">{heroArtikel.ringkasan}</p>
                  <p className="mt-4 text-xs text-[#668676]">
                    {heroArtikel.opd ? heroArtikel.opd.nama : "Bapperida Kabupaten Pinrang"}
                  </p>
                </div>
              </Link>
            )}
            {beritaLain.map((a) => (
              <Link key={a.id} href={`/berita/${a.slug}`} className="group">
                <Card className="h-full border shadow-sm transition-all group-hover:shadow-md group-hover:border-emerald-200">
                  <CardContent className="flex h-full gap-4 p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf2ee] text-[#56816c] ring-1 ring-[#dbe6dd]">
                      <ArticleIcon title={a.judul} photoUrl={a.thumbnailUrl} className="h-6 w-6" />
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
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4f7665]">Terhubung lintas instansi</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Direktori OPD</h2>
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
              <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:border-[#bdcfC2] group-hover:shadow-lg">
                <CardContent className="p-5">
                  <OpdIcon name={opd.nama} />
                  <h3 className="mt-4 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#315f4e]">
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
      <section className="border-y border-slate-200/60 bg-white/75 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#4f7665]">Pusat dokumen</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Publikasi &amp; Download</h2>
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1eee5] text-[#766b4d] text-xs font-bold ring-1 ring-[#e6e0d1]">
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
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-white bg-[#d3e7d8] px-8 py-10 text-[#24483a] shadow-[0_26px_60px_-38px_rgba(53,91,73,0.55)] md:px-12">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/65 blur-2xl" aria-hidden="true" />
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold">Anda Perangkat Daerah?</h2>
              <p className="mt-2 text-sm leading-7 text-[#527062]">
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
