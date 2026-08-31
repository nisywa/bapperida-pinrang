import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTanggal } from "@/lib/constants";
import { ClipboardList, PlusCircle } from "lucide-react";
import { PenugasanForm } from "@/components/backoffice/penugasan-form";
import { PenugasanList } from "@/components/backoffice/penugasan-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Penugasan Indikator" };

export default async function PenugasanPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [periodeList, indikatorList, opdList] = await Promise.all([
    db.periodePengisian.findMany({ orderBy: { startDate: "desc" } }),
    db.indikator.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { aspek: { include: { _count: { select: { pertanyaan: true } } } } } }),
    db.opd.findMany({ where: { status: "AKTIF" }, orderBy: { sortOrder: "asc" } }),
  ]);

  const penugasanList = await db.penugasanOpd.findMany({
    include: {
      indikator: true,
      opd: true,
      periode: true,
      progres: true,
      jawaban: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ClipboardList className="h-6 w-6 text-emerald-600" /> Penugasan Indikator
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tetapkan periode pengumpulan data dan tentukan OPD yang wajib mengisi tiap indikator beserta tenggatnya.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className="space-y-5">
          <PenugasanForm
            periodeList={periodeList.map((p) => ({
              id: p.id,
              nama: p.nama,
              kode: p.kode,
              status: p.status,
              startDate: p.startDate.toISOString(),
              endDate: p.endDate.toISOString(),
            }))}
            indikatorList={indikatorList.map((i) => ({
              id: i.id,
              nama: i.nama,
              kode: i.kode,
              jumlahPertanyaan: i.aspek.reduce((a, asp) => a + asp._count.pertanyaan, 0),
            }))}
            opdList={opdList.map((o) => ({ id: o.id, nama: o.nama, singkatan: o.singkatan }))}
          />

          {/* Daftar periode */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Periode Pengisian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {periodeList.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{p.nama}</p>
                    <p className="text-xs text-slate-500">
                      {formatTanggal(p.startDate)} – {formatTanggal(p.endDate)}
                    </p>
                  </div>
                  <Badge
                    className={
                      p.status === "AKTIF"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }
                  >
                    {p.status === "AKTIF" ? "Aktif" : "Ditutup"}
                  </Badge>
                </div>
              ))}
              {periodeList.length === 0 && (
                <p className="p-3 text-center text-xs text-slate-500">Belum ada periode.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daftar penugasan */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Penugasan ({penugasanList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <PenugasanList
              items={penugasanList.map((p) => ({
                id: p.id,
                opdNama: p.opd.nama,
                indikatorNama: p.indikator.nama,
                periodeNama: p.periode.nama,
                deadline: p.deadline?.toISOString() ?? null,
                status: p.jawaban[0]?.status ?? "BELUM",
                percent: p.progres?.percent ?? 0,
                periodeStatus: p.periode.status,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
