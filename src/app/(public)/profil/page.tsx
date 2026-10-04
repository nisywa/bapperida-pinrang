import { publicDb as db } from "@/lib/public-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Target, Eye, Building2, MapPinned, ShieldCheck } from "lucide-react";

export const revalidate = 60;

export const metadata = { title: "Profil Bapperida" };

export default async function ProfilPage() {
  const [settings, opdCount, kecamatanCount, indikatorCount] = await Promise.all([
    db.siteSetting.findMany(),
    db.opd.count({ where: { status: "AKTIF" } }),
    db.wilayah.count({ where: { isActive: true } }),
    db.indikator.count({ where: { isActive: true } }),
  ]);
  const s = (key: string, fallback = "") => settings.find((x) => x.key === key)?.value ?? fallback;
  const vision = s("vision", "Terwujudnya Kabupaten Pinrang yang maju dan mandiri.");

  const tugas = [
    {
      icon: Building2,
      title: "Koordinasi Data Lintas OPD",
      desc: "Mengelola kebutuhan data seluruh Perangkat Daerah melalui penugasan indikator per periode pengisian, lengkap dengan tenggat dan pengingat otomatis.",
    },
    {
      icon: ShieldCheck,
      title: "Verifikasi &amp; Kualitas Data",
      desc: "Memverifikasi data yang dikirim OPD, memberikan catatan perbaikan, dan menetapkan status keabsahan data sebelum dipublikasikan.",
    },
    {
      icon: Eye,
      title: "Publikasi Informasi Publik",
      desc: "Menetapkan dataset terverifikasi menjadi data publik melalui mekanisme snapshot agar informasi yang tampil selalu konsisten dan terkendali.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-800 px-8 py-12 text-white shadow-lg">
        <div className="flex items-start gap-5">
          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur sm:flex">
            <Landmark className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Profil Bapperida Kabupaten Pinrang</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-100/90 md:text-base">
              Badan Perencanaan Pembangunan, Riset dan Pengembangan Daerah (Bapperida) adalah perangkat daerah
              yang membantu pimpinan daerah menyusun dokumen perencanaan, mengelola data pembangunan lintas OPD,
              serta mengembangkan riset dan inovasi daerah.
            </p>
          </div>
        </div>
      </div>

      {/* Visi */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card className="border shadow-sm md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
              <Target className="h-5 w-5" /> Visi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed text-slate-700">{vision}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
              <Landmark className="h-5 w-5" /> Lingkup Layanan Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed text-slate-700">
              Sistem Pelayanan Digital Bapperida mengintegrasikan portal informasi publik dengan backoffice
              pengelolaan data. Prinsip perancangannya: satu aplikasi terpadu untuk banyak OPD, satu basis data
              logis, pemisahan akses berbasis peran (Admin, Bapperida, OPD) dan cakupan OPD, publikasi berbasis
              persetujuan, serta audit trail atas seluruh aksi penting.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{opdCount}</p>
                <p className="mt-0.5 text-xs text-emerald-700/80">OPD Terintegrasi</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{kecamatanCount}</p>
                <p className="mt-0.5 text-xs text-emerald-700/80">Kecamatan</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{indikatorCount}</p>
                <p className="mt-0.5 text-xs text-emerald-700/80">Indikator Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tugas utama */}
      <h2 className="mt-12 text-xl font-bold text-slate-900">Fungsi Utama dalam Sistem</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {tugas.map((t) => (
          <Card key={t.title} className="border shadow-sm">
            <CardContent className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <t.icon className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: t.title }} />
              <p className="mt-2 text-sm leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: t.desc }} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alur kerja */}
      <h2 className="mt-12 text-xl font-bold text-slate-900">Siklus Pengelolaan Data</h2>
      <div className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <ol className="grid gap-0 md:grid-cols-5">
          {[
            { step: "1", title: "Penetapan Kebutuhan", desc: "Bapperida menetapkan periode dan penugasan indikator kepada OPD." },
            { step: "2", title: "Pengisian OPD", desc: "OPD mengisi data, menyimpan draft, dan mengirim sebelum tenggat." },
            { step: "3", title: "Monitoring", desc: "Progres kelengkapan dipantau real-time dengan pengingat otomatis." },
            { step: "4", title: "Verifikasi", desc: "Bapperida menilai data: disetujui atau dikembalikan dengan catatan." },
            { step: "5", title: "Publikasi", desc: "Data terverifikasi ditetapkan sebagai dataset publik untuk masyarakat." },
          ].map((x, i) => (
            <li key={x.step} className={`relative p-6 ${i > 0 ? "border-t md:border-t-0 md:border-l" : ""} border-slate-100`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {x.step}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{x.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{x.desc}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800">
        <MapPinned className="h-4 w-4 shrink-0" />
        Alamat: {s("contact_address", "Jalan Bintang No. 1, Macorawalie, Kecamatan Watang Sawitto, Kabupaten Pinrang, Sulawesi Selatan 91212")}
      </div>
    </div>
  );
}
