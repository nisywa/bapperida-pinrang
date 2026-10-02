import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { filterMonitoringRows, getMonitoringRows } from "@/lib/monitoring";
import { generateCsv } from "@/lib/file-generator";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["ADMIN", "BAPPERIDA"].includes(session.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const periodeId = params.get("periode") || undefined;
  const filters = {
    opdId: params.get("opd") || undefined,
    indikatorKode: params.get("indikator") || undefined,
    status: params.get("status") || undefined,
  };
  const rows = filterMonitoringRows(await getMonitoringRows(periodeId), filters);
  const table = [
    ["OPD", "Kode Indikator", "Indikator", "Periode", "Status", "Progres (%)", "Terisi", "Wajib", "Deadline", "Aktivitas Terakhir"],
    ...rows.map((row) => [
      row.opdNama,
      row.indikatorKode,
      row.indikatorNama,
      row.periodeNama,
      row.status === "BELUM" ? "BELUM DIISI" : row.status.replaceAll("_", " "),
      String(row.percent),
      String(row.filledCount),
      String(row.requiredCount),
      row.deadline?.toISOString().slice(0, 10) ?? "",
      row.lastActivityAt?.toISOString() ?? "",
    ]),
  ];
  const csv = `\uFEFF${generateCsv("Monitoring Pengisian Data", table)}`;

  await logActivity({
    actor: session,
    action: "EXPORT",
    entityType: "Monitoring",
    detail: `Mengekspor ${rows.length} baris monitoring ke CSV`,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monitoring-bapperida-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

