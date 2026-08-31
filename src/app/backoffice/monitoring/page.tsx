import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMonitoringRows } from "@/lib/monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTanggal, formatNumber, JAWABAN_STATUS } from "@/lib/constants";
import { MonitorCheck, AlertTriangle, Send, FileSearch, CalendarClock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Monitoring Progres" };

export default async function MonitoringPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [rows, periodeList] = await Promise.all([
    getMonitoringRows(),
    db.periodePengisian.findMany({ orderBy: { startDate: "desc" } }),
  ]);
  const now = new Date();
  const overdue = rows.filter(
    (r) => r.deadline && new Date(r.deadline) < now && !["TERVERIFIKASI", "DIKIRIM"].includes(r.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <MonitorCheck className="h-6 w-6 text-emerald-600" /> Monitoring Progres
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelengkapan pengisian indikator per penugasan OPD. Progres dihitung dari pertanyaan wajib
            yang telah diisi dibanding total wajib.
          </p>
        </div>
        {overdue.length > 0 && (
          <Badge className="border-rose-200 bg-rose-50 text-rose-700">
            <AlertTriangle className="mr-1 h-3.5 w-3.5" /> {overdue.length} penugasan overdue
          </Badge>
        )}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tabel Monitoring ({rows.length} penugasan)</CardTitle>
          <p className="text-xs text-slate-500">
            Periode aktif: {periodeList.find((p) => p.status === "AKTIF")?.nama ?? "-"} · Total periode terdaftar: {periodeList.length}
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">OPD</th>
                <th className="px-4 py-3">Indikator</th>
                <th className="px-4 py-3">Progres</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Aktivitas Terakhir</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = JAWABAN_STATUS[r.status as keyof typeof JAWABAN_STATUS];
                const isOverdue =
                  r.deadline && new Date(r.deadline) < now && !["TERVERIFIKASI", "DIKIRIM"].includes(r.status);
                return (
                  <tr key={r.penugasanId} className="border-b last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.opdNama}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{r.indikatorNama}</p>
                      <p className="text-xs text-slate-400">{r.indikatorKode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${r.percent >= 100 ? "bg-emerald-500" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, r.percent)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {formatNumber(r.percent, 0)}% ({r.filledCount}/{r.requiredCount})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${st?.color ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st?.dot ?? "bg-slate-300"}`} />
                        {r.status === "BELUM" ? "Belum Diisi" : st?.label ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap ${isOverdue ? "font-medium text-rose-600" : "text-slate-600"}`}>
                        {formatTanggal(r.deadline)}
                        {isOverdue && " ⚠"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.lastActivityAt ? r.lastActivityAt.toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-8 border-slate-200 text-xs">
                          <Link href={`/backoffice/verifikasi${r.jawabanId ? `?jawaban=${r.jawabanId}` : ""}`}>
                            <FileSearch className="mr-1 h-3.5 w-3.5" /> Detail
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-8 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50">
                          <Link href="/backoffice/notifikasi">
                            <Send className="mr-1 h-3.5 w-3.5" /> Ingatkan
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Belum ada penugasan. Buat penugasan pada menu Penugasan Indikator.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
