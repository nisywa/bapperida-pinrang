import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PengisianForm } from "@/components/backoffice/pengisian-form";
import { Badge } from "@/components/ui/badge";
import { formatTanggal, JAWABAN_STATUS, TIPE_JAWABAN } from "@/lib/constants";
import { ChevronLeft, MessageSquareWarning } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Form Pengisian" };

export default async function PengisianDetailPage({
  params,
}: {
  params: Promise<{ penugasanId: string }>;
}) {
  const { penugasanId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const penugasan = await db.penugasanOpd.findUnique({
    where: { id: penugasanId },
    include: {
      indikator: {
        include: {
          aspek: {
            orderBy: { sortOrder: "asc" },
            include: {
              pertanyaan: {
                orderBy: { sortOrder: "asc" },
                include: { opsi: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
      periode: true,
      opd: true,
      progres: true,
    },
  });
  if (!penugasan) notFound();
  // SCOPE CHECK: OPD hanya boleh membuka penugasan miliknya (horizontal privilege)
  if (session.role === "OPD" && penugasan.opdId !== session.opdId) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Akses ditolak: penugasan ini bukan milik OPD Anda.
      </div>
    );
  }

  const jawaban = await db.jawabanOpd.findFirst({
    where: { penugasanId },
    orderBy: { version: "desc" },
  });
  const details = jawaban ? await db.detailJawaban.findMany({ where: { jawabanId: jawaban.id } }) : [];
  const wilayahList = await db.wilayah.findMany({ where: { isActive: true }, orderBy: { kodeBps: "asc" } });

  const verifikasiTerakhir =
    jawaban?.status === "PERLU_PERBAIKAN"
      ? await db.verifikasi.findFirst({ where: { jawabanId: jawaban.id }, orderBy: { verifiedAt: "desc" } })
      : null;

  const readOnly = jawaban?.status === "DIKIRIM" || jawaban?.status === "TERVERIFIKASI";
  const st = JAWABAN_STATUS[(jawaban?.status ?? "BELUM") as keyof typeof JAWABAN_STATUS];

  // detail map: key = pertanyaanId + ":" + (wilayahId ?? "-")
  const detailMap = new Map<string, { valueText: string | null; valueNumber: number | null; valueBoolean: boolean | null; valueDate: string | null }>();
  for (const d of details) {
    detailMap.set(`${d.pertanyaanId}:${d.wilayahId ?? "-"}`, {
      valueText: d.valueText,
      valueNumber: d.valueNumber,
      valueBoolean: d.valueBoolean,
      valueDate: d.valueDate ? d.valueDate.toISOString().slice(0, 10) : null,
    });
  }

  return (
    <div className="space-y-5">
      <Link href="/backoffice/pengisian" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
        <ChevronLeft className="h-4 w-4" /> Kembali ke Pengisian
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-800 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{penugasan.indikator.nama}</h1>
            <p className="mt-1 text-sm text-emerald-100/90">
              {penugasan.indikator.kode} · {penugasan.periode.nama} · Deadline {formatTanggal(penugasan.deadline)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st?.dot}`} />
            {jawaban ? st?.label ?? jawaban.status : "Belum Diisi"}
          </span>
        </div>
        {penugasan.indikator.deskripsi && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-100/80">
            {penugasan.indikator.deskripsi}
          </p>
        )}
      </div>

      {verifikasiTerakhir?.catatan && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <MessageSquareWarning className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Catatan Verifikator</p>
            <p className="mt-0.5">{verifikasiTerakhir.catatan}</p>
            <p className="mt-1 text-xs text-rose-600">
              Perbaiki bagian terkait lalu kirim ulang untuk diverifikasi kembali.
            </p>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Data dalam status <strong>{jawaban?.status === "DIKIRIM" ? "Dikirim" : "Terverifikasi"}</strong> dan
          terkunci dari pengeditan normal. Perubahan hanya melalui mekanisme workflow (penarikan oleh verifikator).
        </div>
      )}

      {/* Form */}
      <PengisianForm
        penugasanId={penugasan.id}
        readOnly={readOnly}
        periodeAktif={penugasan.periode.status === "AKTIF"}
        aspekList={penugasan.indikator.aspek.map((asp) => ({
          id: asp.id,
          nama: asp.nama,
          pertanyaan: asp.pertanyaan.map((q) => ({
            id: q.id,
            kode: q.kode,
            pertanyaan: q.pertanyaan,
            tipe: q.tipeJawaban,
            tipeLabel: TIPE_JAWABAN[q.tipeJawaban as keyof typeof TIPE_JAWABAN] ?? q.tipeJawaban,
            satuan: q.satuan,
            helpText: q.helpText,
            dimensiWilayah: q.dimensiWilayah,
            opsi: q.opsi.map((o) => o.label),
          })),
        }))}
        wilayahList={wilayahList.map((w) => ({ id: w.id, nama: w.nama }))}
        initialValues={Array.from(detailMap.entries()).map(([key, v]) => ({
          key,
          pertanyaanId: key.split(":")[0],
          wilayahId: key.split(":")[1] === "-" ? null : key.split(":")[1],
          ...v,
        }))}
      />
    </div>
  );
}
