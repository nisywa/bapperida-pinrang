import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";
import { MasterManager } from "@/components/backoffice/master-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Master Data" };

export default async function MasterPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [opdList, indikatorList, wilayahList, periodeList] = await Promise.all([
    db.opd.findMany({ orderBy: { sortOrder: "asc" }, include: { profil: true, _count: { select: { users: true } } } }),
    db.indikator.findMany({
      orderBy: { sortOrder: "asc" },
      include: { aspek: { include: { pertanyaan: { where: { isActive: true } } } } },
    }),
    db.wilayah.findMany({ orderBy: { kodeBps: "asc" } }),
    db.periodePengisian.findMany({ orderBy: { startDate: "desc" }, include: { _count: { select: { penugasan: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Database className="h-6 w-6 text-emerald-600" /> Master Data
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Referensi utama sistem: OPD, indikator (aspek &amp; pertanyaan), wilayah kecamatan, dan periode pengisian.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <MasterManager
            canManage={session.role === "ADMIN" || session.role === "BAPPERIDA"}
            opdList={opdList.map((o) => ({
              id: o.id, kode: o.kode, nama: o.nama, singkatan: o.singkatan, slug: o.slug,
              status: o.status, users: o._count.users, logoUrl: o.profil?.logoUrl ?? null,
            }))}
            indikatorList={indikatorList.map((i) => ({
              id: i.id, kode: i.kode, nama: i.nama, satuan: i.satuanDefault, isActive: i.isActive,
              aspek: i.aspek.map((a) => ({ nama: a.nama, jumlahPertanyaan: a.pertanyaan.length })),
            }))}
            wilayahList={wilayahList.map((w) => ({ id: w.id, kode: w.kodeBps, nama: w.nama, lat: w.centroidLat, lng: w.centroidLng }))}
            periodeList={periodeList.map((p) => ({
              id: p.id, kode: p.kode, nama: p.nama, status: p.status,
              startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString(), penugasan: p._count.penugasan,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
