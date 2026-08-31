import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMonitoringRows } from "@/lib/monitoring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTanggal, formatNumber, JAWABAN_STATUS } from "@/lib/constants";
import { FormInput, ArrowRight, AlertTriangle, CheckCircle2, FileEdit, Clock, History } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengisian Data" };

export default async function PengisianPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OPD") {
    return <p className="text-sm text-slate-600">Menu ini khusus untuk pengguna OPD.</p>;
  }

  const rows = (await getMonitoringRows()).filter((r) => r.opdId === session.opdId);
  const notifikasiList = await db.notifikasiPenerima.findMany({
    where: { userId: session.id },
    include: { notifikasi: true },
    orderBy: { sentAt: "desc" },
    take: 6,
  });

  const kategori = {
    aksi: rows.filter((r) => ["BELUM", "DRAFT", "PERLU_PERBAIKAN"].includes(r.status)),
    menunggu: rows.filter((r) => r.status === "DIKIRIM"),
    selesai: rows.filter((r) => r.status === "TERVERIFIKASI"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FormInput className="h-6 w-6 text-emerald-600" /> Pengisian Data
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Hanya indikator yang ditugaskan kepada {session.opdNama} pada periode aktif yang tampil di sini.
        </p>
      </div>

      {/* Aksi diperlukan */}
      {kategori.aksi.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
            <AlertTriangle className="h-4 w-4" /> Perlu Tindakan ({kategori.aksi.length})
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {kategori.aksi.map((r) => {
              const st = JAWABAN_STATUS[r.status as keyof typeof JAWABAN_STATUS];
              const isPerbaikan = r.status === "PERLU_PERBAIKAN";
              return (
                <Card key={r.penugasanId} className={`border shadow-sm ${isPerbaikan ? "border-rose-200" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{r.indikatorNama}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {r.indikatorKode} · Deadline {formatTanggal(r.deadline)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st?.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st?.dot}`} /> {st?.label ?? "Belum Diisi"}
                      </span>
                    </div>
                    {isPerbaikan && (
                      <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                        Verifikator menemukan data yang perlu diperbaiki. Buka form untuk melihat catatan dan
                        kirim ulang.
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, r.percent)}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{formatNumber(r.percent, 0)}%</span>
                    </div>
                    <Button asChild className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/backoffice/pengisian/${r.penugasanId}`}>
                        <FileEdit className="mr-2 h-4 w-4" />
                        {r.status === "BELUM" ? "Mulai Mengisi" : r.status === "PERLU_PERBAIKAN" ? "Perbaiki Data" : "Lanjutkan Mengisi"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Menunggu verifikasi & selesai */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4" /> Menunggu Verifikasi ({kategori.menunggu.length})
          </h2>
          {kategori.menunggu.map((r) => (
            <Card key={r.penugasanId} className="border shadow-sm">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.indikatorNama}</p>
                  <p className="text-xs text-slate-500">Dikirim · terkunci untuk pengeditan</p>
                </div>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700">Dikirim</Badge>
              </CardContent>
            </Card>
          ))}
          {kategori.menunggu.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Tidak ada data menunggu verifikasi.</p>
          )}

          <h2 className="flex items-center gap-2 pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <CheckCircle2 className="h-4 w-4" /> Terverifikasi ({kategori.selesai.length})
          </h2>
          {kategori.selesai.map((r) => (
            <Card key={r.penugasanId} className="border shadow-sm">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.indikatorNama}</p>
                  <p className="text-xs text-slate-500">Read-only · dapat dipublikasikan Bapperida</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Terverifikasi</Badge>
              </CardContent>
            </Card>
          ))}
          {kategori.selesai.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada data terverifikasi.</p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <History className="h-4 w-4" /> Notifikasi Terbaru
          </h2>
          {notifikasiList.map((n) => (
            <Card key={n.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{n.notifikasi.title}</p>
                  {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Belum dibaca" />}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{n.notifikasi.message}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{n.sentAt.toLocaleString("id-ID")}</p>
              </CardContent>
            </Card>
          ))}
          {notifikasiList.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada notifikasi.</p>
          )}
        </div>
      </div>
    </div>
  );
}
