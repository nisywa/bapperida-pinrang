import { db } from "@/lib/db";

export type MonitoringRow = {
  penugasanId: string;
  opdId: string;
  opdNama: string;
  opdSingkatan: string;
  indikatorNama: string;
  indikatorKode: string;
  deadline: Date | null;
  status: string; // jawaban status atau BELUM
  percent: number;
  requiredCount: number;
  filledCount: number;
  lastActivityAt: Date | null;
  jawabanId: string | null;
  periodeStatus: string;
  periodeNama: string;
};

export type MonitoringFilters = {
  opdId?: string;
  indikatorKode?: string;
  status?: string;
};

export function filterMonitoringRows(rows: MonitoringRow[], filters: MonitoringFilters) {
  return rows.filter((row) => {
    if (filters.opdId && row.opdId !== filters.opdId) return false;
    if (filters.indikatorKode && row.indikatorKode !== filters.indikatorKode) return false;
    if (filters.status && row.status !== filters.status) return false;
    return true;
  });
}

/** Semua penugasan pada periode aktif + status jawaban + progres */
export async function getMonitoringRows(periodeId?: string): Promise<MonitoringRow[]> {
  const periode =
    periodeId
      ? await db.periodePengisian.findUnique({ where: { id: periodeId } })
      : await db.periodePengisian.findFirst({ where: { status: "AKTIF" } });
  if (!periode) return [];

  const penugasanList = await db.penugasanOpd.findMany({
    where: { periodeId: periode.id },
    include: {
      opd: true,
      indikator: true,
      periode: true,
      progres: true,
      jawaban: { orderBy: { version: "desc" } },
    },
  });

  return penugasanList.map((p) => {
    const jawaban = p.jawaban[0];
    return {
      penugasanId: p.id,
      opdId: p.opdId,
      opdNama: p.opd.nama,
      opdSingkatan: p.opd.singkatan,
      indikatorNama: p.indikator.nama,
      indikatorKode: p.indikator.kode,
      deadline: p.deadline,
      status: jawaban?.status ?? "BELUM",
      percent: p.progres?.percent ?? (jawaban ? (jawaban.status === "TERVERIFIKASI" ? 100 : 50) : 0),
      requiredCount: p.progres?.requiredCount ?? 0,
      filledCount: p.progres?.filledCount ?? 0,
      lastActivityAt: p.progres?.lastActivityAt ?? null,
      jawabanId: jawaban?.id ?? null,
      periodeStatus: p.periode.status,
      periodeNama: p.periode.nama,
    };
  });
}

export function summarize(rows: MonitoringRow[]) {
  const total = rows.length;
  const terkirim = rows.filter((r) => r.status === "DIKIRIM").length;
  const terverifikasi = rows.filter((r) => r.status === "TERVERIFIKASI").length;
  const perluPerbaikan = rows.filter((r) => r.status === "PERLU_PERBAIKAN").length;
  const draft = rows.filter((r) => r.status === "DRAFT").length;
  const belum = rows.filter((r) => r.status === "BELUM").length;
  const now = new Date();
  const overdue = rows.filter(
    (r) => r.deadline && new Date(r.deadline) < now && !["TERVERIFIKASI", "DIKIRIM"].includes(r.status)
  ).length;
  const avgProgress = total ? rows.reduce((a, r) => a + r.percent, 0) / total : 0;
  return { total, terkirim, terverifikasi, perluPerbaikan, draft, belum, overdue, avgProgress };
}

/** Distribusi status untuk donut chart */
export function statusDistribution(rows: MonitoringRow[]) {
  const dist = summarize(rows);
  return [
    { name: "Belum Diisi", value: dist.belum, key: "BELUM" },
    { name: "Draft", value: dist.draft, key: "DRAFT" },
    { name: "Dikirim", value: dist.terkirim, key: "DIKIRIM" },
    { name: "Perlu Perbaikan", value: dist.perluPerbaikan, key: "PERLU_PERBAIKAN" },
    { name: "Terverifikasi", value: dist.terverifikasi, key: "TERVERIFIKASI" },
  ].filter((d) => d.value > 0);
}
