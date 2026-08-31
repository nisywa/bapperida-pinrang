import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMonitoringRows, summarize } from "@/lib/monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDonut, OpdProgressBar } from "@/components/backoffice/dashboard-charts";
import { formatTanggal, formatNumber, JAWABAN_STATUS } from "@/lib/constants";
import {
  Building2, CheckCircle2, Clock, Percent, Send, ShieldCheck,
  TrendingUp, AlertTriangle, Users, Database, MapPinned, ScrollText, Activity, ClipboardList,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Backoffice" };

export default async function BackofficeDashboard() {
  const session = await getSession();
  if (!session) return null;

  if (session.role === "ADMIN") return <AdminDashboard />;
  if (session.role === "BAPPERIDA") return <BapperidaDashboard />;
  return <OpdDashboard session={session} />;
}

// ==================== ADMIN ====================
async function AdminDashboard() {
  const [userCount, opdCount, indikatorCount, wilayahCount, periodeAktif, datasetCount, logs, artikelCount] =
    await Promise.all([
      db.user.count(),
      db.opd.count({ where: { status: "AKTIF" } }),
      db.indikator.count({ where: { isActive: true } }),
      db.wilayah.count({ where: { isActive: true } }),
      db.periodePengisian.findFirst({ where: { status: "AKTIF" } }),
      db.datasetPublik.count({ where: { status: "PUBLISHED" } }),
      db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      db.artikel.count({ where: { status: "PUBLISHED" } }),
    ]);

  const kpis = [
    { icon: Users, label: "Total Pengguna", value: userCount, color: "text-emerald-600 bg-emerald-50" },
    { icon: Building2, label: "OPD Terdaftar", value: opdCount, color: "text-teal-600 bg-teal-50" },
    { icon: Database, label: "Indikator Aktif", value: indikatorCount, color: "text-cyan-600 bg-cyan-50" },
    { icon: MapPinned, label: "Kecamatan", value: wilayahCount, color: "text-amber-600 bg-amber-50" },
    { icon: ShieldCheck, label: "Dataset Publik", value: datasetCount, color: "text-lime-600 bg-lime-50" },
    { icon: ScrollText, label: "Artikel Terbit", value: artikelCount, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Administrator</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan kesehatan sistem dan aktivitas terbaru. Periode aktif:{" "}
          <span className="font-medium text-emerald-700">{periodeAktif?.nama ?? "Tidak ada"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="border shadow-sm">
            <CardContent className="p-4">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.color}`}>
                <k.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4.5 w-4.5 text-emerald-600" /> Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                <span className="mt-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  {l.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{l.detail}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {l.actorNama} · {l.actingRole} · {l.createdAt.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
            <Link href="/backoffice/admin/audit-log" className="block pt-1 text-center text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Lihat semua audit log →
            </Link>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tautan Cepat Administrasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/backoffice/admin/pengguna", label: "Kelola Pengguna", desc: "Admin, Bapperida & OPD accounts" },
              { href: "/backoffice/admin/master", label: "Master Data", desc: "OPD, indikator, wilayah, periode" },
              { href: "/backoffice/monitoring", label: "Monitoring Data", desc: "Progres pengisian seluruh OPD" },
              { href: "/backoffice/konten", label: "Konten Portal", desc: "Artikel & publikasi utama" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-xl border p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <p className="font-semibold text-slate-900">{x.label}</p>
                <p className="mt-1 text-xs text-slate-500">{x.desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== BAPPERIDA ====================
async function BapperidaDashboard() {
  const rows = await getMonitoringRows();
  const dist = summarize(rows);
  const periodeAktif = await db.periodePengisian.findFirst({ where: { status: "AKTIF" } });

  // progres per OPD
  const byOpd = new Map<string, { nama: string; sum: number; count: number }>();
  for (const r of rows) {
    const cur = byOpd.get(r.opdId) ?? { nama: r.opdSingkatan, sum: 0, count: 0 };
    cur.sum += r.percent;
    cur.count += 1;
    byOpd.set(r.opdId, cur);
  }
  const opdProgress = Array.from(byOpd.values()).map((v) => ({
    nama: v.nama,
    percent: Math.round((v.sum / v.count) * 10) / 10,
  }));

  const kpis = [
    { icon: Building2, label: "Total Penugasan OPD", value: dist.total, color: "text-emerald-600 bg-emerald-50" },
    { icon: Send, label: "Sudah Mengirim", value: dist.terkirim + dist.terverifikasi, color: "text-teal-600 bg-teal-50" },
    { icon: Clock, label: "Belum Lengkap", value: dist.belum + dist.draft, color: "text-amber-600 bg-amber-50" },
    { icon: CheckCircle2, label: "Terverifikasi", value: dist.terverifikasi, color: "text-lime-600 bg-lime-50" },
    { icon: AlertTriangle, label: "Overdue", value: dist.overdue, color: "text-rose-600 bg-rose-50" },
    { icon: Percent, label: "Progres Keseluruhan", value: `${formatNumber(dist.avgProgress, 1)}%`, color: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">
          Progres pengumpulan data lintas OPD — periode{" "}
          <span className="font-medium text-emerald-700">{periodeAktif?.nama ?? "-"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="border shadow-sm">
            <CardContent className="p-4">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.color}`}>
                <k.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={statusDist(rows)} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progres per OPD</CardTitle>
          </CardHeader>
          <CardContent>
            <OpdProgressBar data={opdProgress} />
          </CardContent>
        </Card>
      </div>

      {/* Tabel monitoring ringkas */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status Penugasan Terkini</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">OPD</th>
                <th className="pb-2 pr-4">Indikator</th>
                <th className="pb-2 pr-4">Progres</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = JAWABAN_STATUS[r.status as keyof typeof JAWABAN_STATUS];
                return (
                  <tr key={r.penugasanId} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-900">{r.opdSingkatan}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.indikatorNama}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, r.percent)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{formatNumber(r.percent, 0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st?.color ?? ""}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st?.dot ?? "bg-slate-300"}`} />
                        {r.status === "BELUM" ? "Belum Diisi" : st?.label ?? r.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{formatTanggal(r.deadline)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Belum ada penugasan pada periode aktif.
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

function statusDist(rows: Awaited<ReturnType<typeof getMonitoringRows>>) {
  const dist = summarize(rows);
  return [
    { name: "Belum Diisi", value: dist.belum },
    { name: "Draft", value: dist.draft },
    { name: "Dikirim", value: dist.terkirim },
    { name: "Perlu Perbaikan", value: dist.perluPerbaikan },
    { name: "Terverifikasi", value: dist.terverifikasi },
  ].filter((d) => d.value > 0);
}

// ==================== OPD ====================
async function OpdDashboard({ session }: { session: NonNullable<Awaited<ReturnType<typeof getSession>>> }) {
  const rows = (await getMonitoringRows()).filter((r) => r.opdId === session.opdId);
  const dist = summarize(rows);
  const notifikasiList = await db.notifikasiPenerima.findMany({
    where: { userId: session.id },
    include: { notifikasi: true },
    orderBy: { sentAt: "desc" },
    take: 5,
  });

  const kpis = [
    { icon: ClipboardList, label: "Indikator Ditugaskan", value: dist.total },
    { icon: CheckCircle2, label: "Terverifikasi", value: dist.terverifikasi },
    { icon: Clock, label: "Menunggu / Draft", value: dist.terkirim + dist.draft },
    { icon: AlertTriangle, label: "Perlu Perbaikan", value: dist.perluPerbaikan },
    { icon: Percent, label: "Progres Keseluruhan", value: `${formatNumber(dist.avgProgress, 1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard OPD</h1>
        <p className="mt-1 text-sm text-slate-600">
          {session.opdNama} — kewajiban dan progres pengisian data Anda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="border shadow-sm">
            <CardContent className="p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <k.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Kewajiban</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r) => {
              const st = JAWABAN_STATUS[r.status as keyof typeof JAWABAN_STATUS];
              return (
                <Link
                  key={r.penugasanId}
                  href="/backoffice/pengisian"
                  className="block rounded-xl border p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{r.indikatorNama}</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st?.color ?? ""}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${st?.dot ?? "bg-slate-300"}`} />
                      {r.status === "BELUM" ? "Belum Diisi" : st?.label ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Deadline: {formatTanggal(r.deadline)} · Progres {formatNumber(r.percent, 0)}%
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, r.percent)}%` }} />
                  </div>
                </Link>
              );
            })}
            {rows.length === 0 && (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                Tidak ada penugasan indikator untuk OPD Anda pada periode aktif.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifikasi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifikasiList.map((n) => (
              <div key={n.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">{n.notifikasi.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.notifikasi.message}</p>
                <p className="mt-1 text-[10px] text-slate-400">{n.sentAt.toLocaleString("id-ID")}</p>
              </div>
            ))}
            {notifikasiList.length === 0 && (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada notifikasi.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
