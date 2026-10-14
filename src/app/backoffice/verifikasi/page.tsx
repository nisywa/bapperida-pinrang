import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerifikasiPanel } from "@/components/backoffice/verifikasi-panel";
import { formatTanggal, formatNumber, JAWABAN_STATUS, TIPE_JAWABAN } from "@/lib/constants";
import { CheckSquare, ClipboardCheck, MapPinned } from "lucide-react";
import { displayAnswerText } from "@/lib/questionnaire";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Data" };

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ jawaban?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }
  const { jawaban: jawabanParam } = await searchParams;

  const antrian = await db.jawabanOpd.findMany({
    where: { status: { in: ["DIKIRIM", "PERLU_PERBAIKAN"] } },
    include: {
      penugasan: { include: { indikator: true, opd: true, periode: true } },
    },
    orderBy: { submittedAt: "asc" },
  });
  const riwayat = await db.jawabanOpd.findMany({
    where: { status: "TERVERIFIKASI" },
    include: { penugasan: { include: { indikator: true, opd: true } }, verifikasi: { orderBy: { verifiedAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const activeId = jawabanParam && antrian.some((a) => a.id === jawabanParam) ? jawabanParam : antrian[0]?.id;
  const active = activeId
    ? await db.jawabanOpd.findUnique({
        where: { id: activeId },
        include: {
          penugasan: {
            include: {
              indikator: { include: { aspek: { include: { pertanyaan: true } } } },
              opd: true,
              periode: true,
              pertanyaanTarget: true,
            },
          },
          verifikasi: { orderBy: { verifiedAt: "desc" } },
        },
      })
    : null;

  const details = active ? await db.detailJawaban.findMany({ where: { jawabanId: active.id } }) : [];
  const wilayahList = await db.wilayah.findMany({ orderBy: { kodeBps: "asc" } });
  const wilayahMap = new Map(wilayahList.map((w) => [w.id, w.nama]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <CheckSquare className="h-6 w-6 text-emerald-600" /> Verifikasi Data
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Nilai data yang dikirim OPD. Data disetujui menjadi Terverifikasi, atau dikembalikan dengan
          catatan perbaikan per prinsip workflow dokumen desain.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        {/* Antrian */}
        <div className="space-y-3">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                Menunggu Verifikasi ({antrian.filter((a) => a.status === "DIKIRIM").length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {antrian.map((a) => {
                const st = JAWABAN_STATUS[a.status as keyof typeof JAWABAN_STATUS];
                return (
                  <a
                    key={a.id}
                    href={`/backoffice/verifikasi?jawaban=${a.id}`}
                    className={`block rounded-xl border p-3 transition-colors ${
                      a.id === activeId
                        ? "border-emerald-400 bg-emerald-50/60"
                        : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{a.penugasan.opd.singkatan}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${st?.color}`}>
                        <span className={`h-1 w-1 rounded-full ${st?.dot}`} /> {st?.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">{a.penugasan.indikator.nama}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Dikirim: {a.submittedAt ? formatTanggal(a.submittedAt) : "-"}
                    </p>
                  </a>
                );
              })}
              {antrian.length === 0 && (
                <p className="p-4 text-center text-sm text-slate-500">Tidak ada data menunggu verifikasi.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Riwayat Terverifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {riwayat.map((a) => (
                <div key={a.id} className="rounded-lg bg-emerald-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-slate-800">
                    {a.penugasan.opd.singkatan} · {a.penugasan.indikator.nama}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {a.verifikasi[0]?.verifiedAt ? formatTanggal(a.verifikasi[0].verifiedAt) : "-"}
                  </p>
                </div>
              ))}
              {riwayat.length === 0 && <p className="p-3 text-center text-xs text-slate-500">Belum ada.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Detail jawaban */}
        {active ? (
          <VerifikasiPanel
            jawabanId={active.id}
            status={active.status}
            opdNama={active.penugasan.opd.nama}
            indikatorNama={active.penugasan.indikator.nama}
            periodeNama={active.penugasan.periode.nama}
            submittedAt={active.submittedAt?.toISOString() ?? null}
            catatanSebelumnya={active.verifikasi[0]?.catatan ?? null}
            aspekList={active.penugasan.indikator.aspek
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((asp) => ({
                id: asp.id,
                nama: asp.nama,
                pertanyaan: asp.pertanyaan.filter(q => active.penugasan.pertanyaanTarget.some(target => target.pertanyaanId === q.id))
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((q) => ({
                    id: q.id,
                    kode: q.kode,
                    pertanyaan: q.pertanyaan,
                    tipe: TIPE_JAWABAN[q.tipeJawaban as keyof typeof TIPE_JAWABAN] ?? q.tipeJawaban,
                    dimensiWilayah: q.dimensiWilayah,
                    satuan: q.satuan,
                    jawaban: details
                      .filter((d) => d.pertanyaanId === q.id)
                      .map((d) => ({
                        wilayahNama: d.wilayahId ? wilayahMap.get(d.wilayahId) ?? "-" : null,
                        nilai:
                          d.valueNumber !== null && d.valueNumber !== undefined
                            ? formatNumber(d.valueNumber, d.valueNumber % 1 === 0 ? 0 : 1)
                            : displayAnswerText(d.valueText, q.tipeJawaban) ??
                              (d.valueBoolean === true ? "Ya" : d.valueBoolean === false ? "Tidak" : null) ??
                              (d.valueDate ? formatTanggal(d.valueDate) : null) ??
                              "-",
                      })),
                  })),
              }))}
          />
        ) : (
          <Card className="flex items-center justify-center border shadow-sm">
            <CardContent className="py-16 text-center">
              <MapPinned className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Pilih data dari antrian untuk memulai verifikasi.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
