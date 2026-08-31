import Link from "next/link";
import { db } from "@/lib/db";
import {
  getPublishedDatasets,
  getDatasetMetrics,
  getDatasetPolygons,
  computeKpis,
} from "@/lib/public-data";
import { ChoroplethMap } from "@/components/public/choropleth-map";
import { RankingBar } from "@/components/public/ranking-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/constants";
import { Database, TrendingUp, Award, Users, Info } from "lucide-react";

/**
 * Section dashboard publik yang dipakai di portal utama (/data)
 * dan halaman OPD (/opd/[slug]/data) — scope OPD via dataset detail.
 */
export async function DataDashboardSection({ opdId }: { opdId?: string }) {
  const datasets = await getPublishedDatasets(opdId);

  if (datasets.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
        <Database className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 font-semibold text-slate-900">Belum Ada Dataset Publik</h3>
        <p className="mt-1 text-sm text-slate-500">
          Data yang tampil di sini hanya dataset yang telah diverifikasi dan dipublikasikan oleh Bapperida.
        </p>
      </div>
    );
  }

  const activeDataset = datasets[0];
  const metrics = await getDatasetMetrics(activeDataset.id);
  const activeMetric = metrics[0];
  const polygons = activeMetric ? await getDatasetPolygons(activeDataset.id, activeMetric.kode, opdId) : [];
  const kpis = computeKpis(polygons);
  const ranking = polygons
    .filter((p) => p.value !== null)
    .map((p) => ({ nama: p.nama, nilai: p.value as number }));

  return (
    <div className="space-y-6">
      {/* Pemilih indikator */}
      <div className="flex flex-wrap gap-2">
        {datasets.map((d) => (
          <span
            key={d.id}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
          >
            <Database className="h-3.5 w-3.5" />
            {d.indikatorNama}
            <span className="text-xs text-emerald-600">· {d.periodeNama}</span>
          </span>
        ))}
      </div>

      {/* Pemilih metric */}
      {metrics.length > 1 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Indikator/Metric Tersedia
          </p>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m, i) => (
              <span
                key={m.kode}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  i === 0
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.nama}
              </span>
            ))}
          </div>
          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Pemilihan metric interaktif tersedia pada dashboard analitik backoffice. Saat ini menampilkan metric utama dataset.
          </p>
        </div>
      )}

      {/* KPI */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Database, label: activeMetric?.satuan === "%" ? "Rata-rata" : "Total", value: formatNumber(activeMetric?.satuan === "%" ? kpis.avg : kpis.total, activeMetric?.satuan === "%" ? 1 : 0), sub: activeMetric?.satuan === "%" ? `dari ${kpis.count} kecamatan` : `${activeMetric?.satuan ?? ""}` },
            { icon: TrendingUp, label: "Rata-rata Kecamatan", value: formatNumber(kpis.avg, 1), sub: activeMetric?.satuan ?? "" },
            { icon: Award, label: "Tertinggi", value: formatNumber(kpis.max, 1), sub: kpis.maxNama ?? "" },
            { icon: Users, label: "Terendah", value: formatNumber(kpis.min, 1), sub: kpis.minNama ?? "" },
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

      {/* Peta + ranking */}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Peta Sebaran {activeMetric?.nama}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Choropleth 12 kecamatan Kabupaten Pinrang · satuan: {activeMetric?.satuan ?? "-"} ·
              sumber: dataset terverifikasi
            </p>
          </CardHeader>
          <CardContent>
            <ChoroplethMap
              polygons={polygons}
              paletteKey={activeDataset.paletteKey}
              satuan={activeMetric?.satuan ?? ""}
            />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peringkat Kecamatan</CardTitle>
            <p className="text-xs text-slate-500">Diurutkan dari nilai tertinggi</p>
          </CardHeader>
          <CardContent>
            <RankingBar data={ranking} paletteKey={activeDataset.paletteKey} satuan={activeMetric?.satuan ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
