import { db } from "@/lib/db";
import { getPinrangGeometry } from "@/lib/pinrang-boundaries";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoroplethMap } from "@/components/public/choropleth-map";
import { RankingBar } from "@/components/public/ranking-bar";
import { formatNumber } from "@/lib/constants";
import { computeKpis, type MapPolygon } from "@/lib/public-data";
import { FileBarChart, Database, TrendingUp, Award, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Analitik" };

export default async function AnalitikPage({
  searchParams,
}: {
  searchParams: Promise<{ ind?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }
  const { ind, q } = await searchParams;

  // Indikator yang memiliki data (terverifikasi = sah untuk analitik internal)
  const verifiedJawaban = await db.jawabanOpd.findMany({
    where: { status: "TERVERIFIKASI" },
    include: { penugasan: { include: { indikator: true, opd: true } } },
  });
  const indikatorMap = new Map<string, { id: string; nama: string; kode: string }>();
  for (const j of verifiedJawaban) {
    indikatorMap.set(j.penugasan.indikatorId, {
      id: j.penugasan.indikatorId,
      nama: j.penugasan.indikator.nama,
      kode: j.penugasan.indikator.kode,
    });
  }
  const indikatorTersedia = Array.from(indikatorMap.values());

  if (indikatorTersedia.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 font-semibold text-slate-900">Belum Ada Data Terverifikasi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Analitik menampilkan data yang telah lolos verifikasi. Verifikasi data OPD terlebih dahulu.
        </p>
        <Link href="/backoffice/verifikasi" className="mt-4 inline-block text-sm font-medium text-emerald-700">
          Buka menu Verifikasi →
        </Link>
      </div>
    );
  }

  const activeIndikator = indikatorTersedia.find((i) => i.id === ind) ?? indikatorTersedia[0];

  // Pertanyaan dimensi wilayah pada indikator aktif
  const questions = await db.pertanyaanIndikator.findMany({
    where: { dimensiWilayah: true, isActive: true, aspek: { indikatorId: activeIndikator.id } },
    orderBy: { sortOrder: "asc" },
  });
  const activeQuestion = questions.find((x) => x.kode === q) ?? questions[0];

  const wilayahList = await db.wilayah.findMany({ where: { isActive: true }, orderBy: { kodeBps: "asc" } });
  const polygons: MapPolygon[] = [];
  if (activeQuestion) {
    const details = await db.detailJawaban.findMany({
      where: { pertanyaanId: activeQuestion.id, jawaban: { status: "TERVERIFIKASI" } },
      include: { jawaban: true },
    });
    const valueMap = new Map<string, number>();
    for (const d of details) {
      if (d.wilayahId && d.valueNumber !== null && d.valueNumber !== undefined) {
        valueMap.set(d.wilayahId, d.valueNumber);
      }
    }
    for (const w of wilayahList) {
      polygons.push({ id: w.id, nama: w.nama, geometry: getPinrangGeometry(w.nama, w.geometry), value: valueMap.get(w.id) ?? null });
    }
  }

  const kpis = computeKpis(polygons);
  const ranking = polygons.filter((p) => p.value !== null).map((p) => ({ nama: p.nama, nilai: p.value as number }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FileBarChart className="h-6 w-6 text-emerald-600" /> Dashboard Analitik
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Analisis data lintas OPD berdasarkan indikator, kecamatan, dan periode — hanya dari data terverifikasi.
        </p>
      </div>

      {/* Pemilih indikator */}
      <div className="flex flex-wrap gap-2">
        {indikatorTersedia.map((i) => (
          <Link
            key={i.id}
            href={`/backoffice/analitik?ind=${i.id}${activeQuestion ? `&q=${activeQuestion.kode}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              i.id === activeIndikator.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "border bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            {i.nama}
          </Link>
        ))}
      </div>

      {/* Pemilih metric */}
      {questions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {questions.map((q) => (
            <Link
              key={q.kode}
              href={`/backoffice/analitik?ind=${activeIndikator.id}&q=${q.kode}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                q.kode === activeQuestion?.kode
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {q.pertanyaan}
            </Link>
          ))}
        </div>
      )}

      {/* KPI */}
      {kpis && activeQuestion && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Database, label: "Total", value: formatNumber(kpis.total, activeQuestion.satuan === "%" ? 1 : 0), sub: activeQuestion.satuan ?? "" },
            { icon: TrendingUp, label: "Rata-rata", value: formatNumber(kpis.avg, 1), sub: activeQuestion.satuan ?? "" },
            { icon: Award, label: "Tertinggi", value: formatNumber(kpis.max, 1), sub: kpis.maxNama ?? "" },
            { icon: TrendingUp, label: "Terendah", value: formatNumber(kpis.min, 1), sub: kpis.minNama ?? "" },
          ].map((k) => (
            <Card key={k.label} className="border shadow-sm">
              <CardContent className="p-5">
                <k.icon className="h-5 w-5 text-emerald-600" />
                <p className="mt-2.5 text-2xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className="mt-0.5 truncate text-xs text-emerald-700">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Peta Choropleth — {activeQuestion?.pertanyaan ?? "Data"}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Sumber: data terverifikasi internal · satuan: {activeQuestion?.satuan ?? "-"} · kecamatan tanpa data tampil abu-abu
            </p>
          </CardHeader>
          <CardContent>
            <ChoroplethMap polygons={polygons} paletteKey="emerald" satuan={activeQuestion?.satuan ?? ""} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peringkat Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingBar data={ranking} paletteKey="emerald" satuan={activeQuestion?.satuan ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
