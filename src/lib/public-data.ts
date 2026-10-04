import { publicDb as db } from "@/lib/public-db";
import type { MapPolygon as ChoroplethMapPolygon } from "@/components/public/choropleth-map";

export type MapPolygon = ChoroplethMapPolygon;

export type PublishedDataset = {
  id: string;
  indikatorId: string;
  indikatorKode: string;
  indikatorNama: string;
  paletteKey: string;
  periodeNama: string;
  periodeKode: string;
  publishedAt: Date;
};

/** Daftar dataset publik berstatus PUBLISHED (scope opd opsional via detail.opdId) */
export async function getPublishedDatasets(opdId?: string): Promise<PublishedDataset[]> {
  const datasets = await db.datasetPublik.findMany({
    where: {
      status: "PUBLISHED",
      ...(opdId ? { detail: { some: { opdId } } } : {}),
    },
    include: {
      indikator: { include: { visualisasi: true } },
      periode: true,
    },
    orderBy: { publishedAt: "desc" },
  });
  return datasets.map((d) => ({
    id: d.id,
    indikatorId: d.indikatorId,
    indikatorKode: d.indikator.kode,
    indikatorNama: d.indikator.nama,
    paletteKey: d.indikator.visualisasi?.paletteKey ?? "emerald",
    periodeNama: d.periode.nama,
    periodeKode: d.periode.kode,
    publishedAt: d.publishedAt,
  }));
}

export type MetricInfo = {
  kode: string;
  nama: string;
  satuan: string | null;
};

/** Metric (pertanyaan dimensi wilayah) yang tersedia pada sebuah dataset */
export async function getDatasetMetrics(datasetId: string): Promise<MetricInfo[]> {
  const details = await db.datasetPublikDetail.findMany({
    where: { datasetId },
    select: { metricKey: true },
    distinct: ["metricKey"],
  });
  if (details.length === 0) return [];
  const questions = await db.pertanyaanIndikator.findMany({
    where: { kode: { in: details.map((d) => d.metricKey) } },
  });
  const map = new Map(questions.map((q) => [q.kode, q]));
  return details
    .map((d) => map.get(d.metricKey))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map((q) => ({ kode: q.kode, nama: q.pertanyaan, satuan: q.satuan }));
}

/** Nilai per kecamatan untuk satu metric dataset */
export async function getDatasetPolygons(
  datasetId: string,
  metricKey: string,
  opdId?: string
): Promise<MapPolygon[]> {
  const [wilayah, details] = await Promise.all([
    db.wilayah.findMany({ where: { isActive: true }, orderBy: { kodeBps: "asc" } }),
    db.datasetPublikDetail.findMany({
    where: { datasetId, metricKey, ...(opdId ? { opdId } : {}) },
    }),
  ]);
  const valueMap = new Map(details.map((d) => [d.wilayahId, d.metricValue]));
  return wilayah.map((w) => ({
    id: w.id,
    nama: w.nama,
    geometry: w.geometry ?? "[]",
    value: valueMap.get(w.id) ?? null,
  }));
}

/** KPI agregat sederhana dari nilai dataset */
export function computeKpis(polygons: MapPolygon[]) {
  const vals = polygons.filter((p) => p.value !== null).map((p) => p.value as number);
  if (vals.length === 0) return null;
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = total / vals.length;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const maxP = polygons.find((p) => p.value === max);
  const minP = polygons.find((p) => p.value === min);
  return { count: vals.length, total, avg, max, min, maxNama: maxP?.nama, minNama: minP?.nama };
}
