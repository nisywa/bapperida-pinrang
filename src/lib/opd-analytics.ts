import { db } from "@/lib/db";

export async function getOpdAnalyticsAssignments(opdId: string) {
  return db.penugasanOpd.findMany({
    where: { opdId, jawaban: { some: {} } },
    select: {
      id: true, indikator: { select: { id: true, kode: true, nama: true } },
      periode: { select: { id: true, kode: true, nama: true, startDate: true, endDate: true } },
      jawaban: { orderBy: { version: "desc" }, take: 1, select: { id: true, status: true, updatedAt: true } },
    },
    orderBy: [{ periode: { startDate: "desc" } }, { createdAt: "desc" }],
  });
}

export async function getOpdAnalyticsDetails(opdId: string, jawabanId: string) {
  return db.detailJawaban.findMany({
    where: { jawabanId, jawaban: { penugasan: { opdId } }, wilayahId: { not: null }, valueNumber: { not: null }, pertanyaan: { dimensiWilayah: true, tipeJawaban: "NUMBER" } },
    include: { pertanyaan: true },
    orderBy: [{ pertanyaan: { sortOrder: "asc" } }, { pertanyaanId: "asc" }],
  });
}

export type OpdAnalyticsAssignment = Awaited<ReturnType<typeof getOpdAnalyticsAssignments>>[number];
export function selectOpdAnalyticsAssignment(assignments: OpdAnalyticsAssignment[], indicator?: string, period?: string) {
  const matching = assignments.filter(item => (!indicator || item.indikator.kode === indicator) && (!period || item.periode.id === period));
  return [...matching].sort((a, b) => b.jawaban[0].updatedAt.getTime() - a.jawaban[0].updatedAt.getTime())[0] ?? null;
}
