import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { generateCsv, safeFileName } from "@/lib/file-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dataset = await db.datasetPublik.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      indikator: true,
      periode: true,
      detail: {
        include: { opd: true, wilayah: true },
        orderBy: [{ metricKey: "asc" }, { wilayahId: "asc" }],
      },
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: "Dataset publik tidak ditemukan" }, { status: 404 });
  }

  const rows = [
    ["Kode Indikator", "Indikator", "Periode", "OPD", "Wilayah", "Kode Metric", "Nilai Angka", "Nilai Teks"],
    ...dataset.detail.map((detail) => [
      dataset.indikator.kode,
      dataset.indikator.nama,
      dataset.periode.nama,
      detail.opd?.nama ?? "",
      detail.wilayah?.nama ?? "",
      detail.metricKey,
      detail.metricValue === null ? "" : String(detail.metricValue),
      detail.metricText ?? "",
    ]),
  ];
  const csv = `\uFEFF${generateCsv(`${dataset.indikator.nama} - ${dataset.periode.nama}`, rows)}`;

  await logActivity({
    actor: null,
    publicActor: true,
    action: "DOWNLOAD",
    entityType: "DatasetPublik",
    entityId: dataset.id,
    detail: `Mengunduh dataset publik ${dataset.indikator.nama} v${dataset.version}`,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName(`${dataset.indikator.kode}-${dataset.periode.kode}`, "csv")}"`,
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
