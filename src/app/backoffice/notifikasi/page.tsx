import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellRing, Send } from "lucide-react";
import { PengingatForm } from "@/components/backoffice/pengingat-form";
import { formatTanggal } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pusat Notifikasi" };

export default async function NotifikasiPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [opdList, notifikasiList] = await Promise.all([
    db.opd.findMany({ where: { status: "AKTIF" }, orderBy: { sortOrder: "asc" } }),
    db.notifikasi.findMany({
      include: { opd: true, penerima: true, periode: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BellRing className="h-6 w-6 text-emerald-600" /> Pusat Notifikasi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kirim pengingat manual kepada OPD dan pantau status terkirim/dibaca. Pengingat otomatis
          terjadwal (H-7, H-3, H-1, setelah tenggat) dihasilkan oleh sistem pada menu ini juga.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <PengingatForm opdList={opdList.map((o) => ({ id: o.id, nama: o.nama }))} />

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Riwayat Notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-3 overflow-y-auto">
            {notifikasiList.map((n) => {
              const dibaca = n.penerima.filter((p) => p.readAt).length;
              return (
                <div key={n.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <Badge
                      variant="secondary"
                      className={
                        n.type === "VERIFIKASI"
                          ? "bg-emerald-50 text-emerald-700"
                          : n.type === "SISTEM"
                            ? "bg-cyan-50 text-cyan-700"
                            : "bg-amber-50 text-amber-700"
                      }
                    >
                      {n.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {n.opd ? n.opd.nama : "Semua OPD"} · {n.penerima.length} penerima ({dibaca} dibaca) ·{" "}
                    {formatTanggal(n.createdAt)}
                  </p>
                </div>
              );
            })}
            {notifikasiList.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada notifikasi terkirim.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
