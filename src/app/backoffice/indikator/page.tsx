import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { IndicatorManager } from "@/components/backoffice/indicator-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Indikator & Pertanyaan" };

export default async function IndicatorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["BAPPERIDA", "ADMIN"].includes(session.role)) return <p>Akses ditolak.</p>;
  const indicators = await db.indikator.findMany({ orderBy: [{ sortOrder: "asc" }, { kode: "asc" }], include: {
    aspek: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: {
      pertanyaan: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { kode: "asc" }], include: { opsi: { orderBy: { sortOrder: "asc" } }, _count: { select: { detailJawaban: true } } } },
    } },
  } });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div>
      <h1 className="text-2xl font-bold text-slate-900">Indikator & Pertanyaan</h1>
      <p className="mt-2 text-sm text-slate-600">Susun Indikator → Aspek → Pertanyaan → Jawaban. Pertanyaan yang disimpan langsung terlihat di sini.</p>
    </div><Link href="/backoffice/penugasan" className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-emerald-700">Atur periode & OPD →</Link></div>
    <IndicatorManager indicators={indicators.map(i => ({ id: i.id, kode: i.kode, nama: i.nama, deskripsi: i.deskripsi ?? "", satuan: i.satuanDefault ?? "", isActive: i.isActive, aspek: i.aspek.map(a => ({ id: a.id, nama: a.nama, deskripsi: a.deskripsi ?? "", pertanyaan: a.pertanyaan.map(q => ({ id: q.id, kode: q.kode, pertanyaan: q.pertanyaan, tipeJawaban: q.tipeJawaban, wajibDefault: q.wajibDefault, dimensiWilayah: q.dimensiWilayah, satuan: q.satuan ?? "", helpText: q.helpText ?? "", opsi: q.opsi.map(o => o.label), hasAnswers: q._count.detailJawaban > 0 })) })) }))} />
  </div>;
}
