import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoroplethMap } from "@/components/public/choropleth-map";
import { RankingBar } from "@/components/public/ranking-bar";
import { formatNumber } from "@/lib/constants";
import { computeKpis, type MapPolygon } from "@/lib/public-data";
import { FileBarChart, AlertCircle, Database, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visualisasi Data OPD" };

export default async function OpdAnalitikPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OPD") {
    return <p className="text-sm text-slate-600">Menu ini khusus untuk pengguna OPD.</p>;
  }
  if (!session.opdId) {
    return <p className="text-sm text-rose-600">Akun OPD belum dikaitkan dengan master OPD.</p>;
  }
  const { q } = await searchParams;

  // Hanya data milik OPD ini (scope server-side)
  const verified = await db.jawabanOpd.findFirst({
    where: { status: "TERVERIFIKASI", penugasan: { opdId: session.opdId } },
    include: { penugasan: { include: { indikator: true } } },
  });
  const dikirim = await db.jawabanOpd.findFirst({
    where: { status: { in: ["DIKIRIM", "DRAFT"] }, penugasan: { opdId: session.opdId } },
    include: { penugasan: { include: { indikator: true } } },
  });

  const hasData = verified || dikirim;
  if (!hasData) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 font-semibold text-slate-900">Belum Ada Data untuk Divisualisasikan</h2>
        <p className="mt-1 text-sm text-slate-500">Isi indikator yang ditugaskan terlebih dahulu.</p>
        <Link href="/backoffice/pengisian" className="mt-4 inline-block text-sm font-medium text-emerald-700">
          Buka Pengisian Data →
        </Link>
      </div>
    );
  }

  // Pertanyaan dimensi wilayah yang memiliki nilai milik OPD ini
  const jawabanId = (verified ?? dikirim!).id;
  const details = await db.detailJawaban.findMany({
    where: { jawabanId, wilayahId: { not: null } },
    include: { pertanyaan: true },
  });
  const questions = Array.from(new Map(details.map((d) => [d.pertanyaan.id, d.pertanyaan])).values());
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-3 font-semibold text-slate-900">Belum Ada Data Berdimensi Wilayah</h2>
        <p className="mt-1 text-sm text-slate-500">Visualisasi peta tersedia untuk indikator dengan nilai per kecamatan.</p>
      </div>
    );
  }

  const activeQuestion = questions.find((x) => x.kode === q) ?? questions[0];
  const wilayahList = await db.wilayah.findMany({ where: { isActive: true }, orderBy: { kodeBps: "asc" } });
  const valueMap = new Map<string, number>();
  for (const d of details) {
    if (d.pertanyaanId === activeQuestion.id && d.wilayahId && d.valueNumber !== null) {
      valueMap.set(d.wilayahId, d.valueNumber);
    }
  }
  const polygons: MapPolygon[] = wilayahList.map((w) => ({
    id: w.id,
    nama: w.nama,
    geometry: w.geometry ?? "[]",
    value: valueMap.get(w.id) ?? null,
  }));
  const kpis = computeKpis(polygons);
  const ranking = polygons.filter((p) => p.value !== null).map((p) => ({ nama: p.nama, nilai: p.value as number }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FileBarChart className="h-6 w-6 text-emerald-600" /> Visualisasi Data
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Grafik dan peta {session.opdNama} — hanya data milik OPD Anda sesuai kebijakan scope.
        </p>
      </div>

      {questions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {questions.map((qq) => (
            <Link
              key={qq.id}
              href={`/backoffice/opd-analitik?q=${qq.kode}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                qq.id === activeQuestion.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {qq.pertanyaan}
            </Link>
          ))}
        </div>
      )}

      {kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[
            { icon: Database, label: "Total", value: formatNumber(kpis.total, 0), sub: activeQuestion.satuan ?? "" },
            { icon: TrendingUp, label: "Rata-rata", value: formatNumber(kpis.avg, 1), sub: "per kecamatan" },
            { icon: Award, label: "Tertinggi", value: formatNumber(kpis.max, 1), sub: kpis.maxNama ?? "" },
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
            <CardTitle className="text-base">Peta Kecamatan — {activeQuestion.pertanyaan}</CardTitle>
            <p className="text-xs text-slate-500">Satuan: {activeQuestion.satuan ?? "-"}</p>
          </CardHeader>
          <CardContent>
            <ChoroplethMap polygons={polygons} paletteKey="emerald" satuan={activeQuestion.satuan ?? ""} />
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peringkat Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingBar data={ranking} paletteKey="emerald" satuan={activeQuestion.satuan ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
