import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { PenugasanForm } from "@/components/backoffice/penugasan-form";
import { PenugasanList } from "@/components/backoffice/penugasan-list";
import { PeriodManager } from "@/components/backoffice/period-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Penugasan Indikator" };

export default async function PenugasanPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [periodeList, indikatorList, opdList] = await Promise.all([
    db.periodePengisian.findMany({ orderBy: { startDate: "desc" } }),
    db.indikator.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { aspek: { orderBy: { sortOrder: "asc" }, include: { pertanyaan: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, pertanyaan: true, tipeJawaban: true } } } } } }),
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
        <Link href="/backoffice/indikator" className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline">Kelola Indikator → Aspek → Pertanyaan →</Link>
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
              jumlahPertanyaan: i.aspek.reduce((a, asp) => a + asp.pertanyaan.length, 0),
              aspek: i.aspek.map(a => ({ nama: a.nama, pertanyaan: a.pertanyaan.map(q => ({ teks: q.pertanyaan, tipe: q.tipeJawaban })) })),
            }))}
            opdList={opdList.map((o) => ({ id: o.id, nama: o.nama, singkatan: o.singkatan }))}
          />

          <PeriodManager periods={periodeList.map(p => ({ id: p.id, kode: p.kode, nama: p.nama, startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString(), status: p.status }))} />
        </div>

        {/* Daftar penugasan */}
        <div className="min-w-0 xl:relative">
        <Card className="overflow-hidden border shadow-sm xl:absolute xl:inset-0">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-base">Daftar Penugasan ({penugasanList.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[70vh] min-h-0 overflow-y-auto xl:max-h-none xl:flex-1">
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
                accessStatus: p.status,
                periodStart: p.periode.startDate.toISOString(),
                periodEnd: p.periode.endDate.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
