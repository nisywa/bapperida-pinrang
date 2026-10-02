"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { verifikasiJawaban } from "@/lib/actions/bapperida";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, RotateCcw, Loader2, MapPin, MessageSquareWarning, FileDown } from "lucide-react";
import { JAWABAN_STATUS } from "@/lib/constants";

type DetailItem = { wilayahNama: string | null; nilai: string };
type PertanyaanItem = {
  id: string;
  kode: string;
  pertanyaan: string;
  tipe: string;
  dimensiWilayah: boolean;
  satuan: string | null;
  jawaban: DetailItem[];
};
type AspekItem = { id: string; nama: string; pertanyaan: PertanyaanItem[] };

export function VerifikasiPanel({
  jawabanId,
  status,
  opdNama,
  indikatorNama,
  periodeNama,
  submittedAt,
  catatanSebelumnya,
  aspekList,
}: {
  jawabanId: string;
  status: string;
  opdNama: string;
  indikatorNama: string;
  periodeNama: string;
  submittedAt: string | null;
  catatanSebelumnya: string | null;
  aspekList: AspekItem[];
}) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState<"SETUJUI" | "KEMBALIKAN" | null>(null);
  const st = JAWABAN_STATUS[status as keyof typeof JAWABAN_STATUS];

  async function act(decision: "TERVERIFIKASI" | "PERLU_PERBAIKAN") {
    if (decision === "PERLU_PERBAIKAN" && catatan.trim().length < 5) {
      toast.error("Catatan perbaikan wajib diisi (min. 5 karakter).");
      return;
    }
    setLoading(decision === "TERVERIFIKASI" ? "SETUJUI" : "KEMBALIKAN");
    const res = await verifikasiJawaban(jawabanId, decision, catatan.trim());
    setLoading(null);
    if (res.ok) {
      toast.success(res.message ?? "Berhasil.");
      setCatatan("");
      router.push("/backoffice/verifikasi");
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal.");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{indikatorNama}</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {opdNama} · {periodeNama} · Dikirim {submittedAt ? new Date(submittedAt).toLocaleDateString("id-ID") : "-"}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${st?.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st?.dot}`} /> {st?.label ?? status}
            </span>
          </div>
          {catatanSebelumnya && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Catatan verifikator terakhir:</strong> {catatanSebelumnya}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {aspekList.map((asp) => (
        <Card key={asp.id} className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wide text-emerald-700">{asp.nama}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {asp.pertanyaan.map((q) => (
              <div key={q.id} className="rounded-xl border bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{q.pertanyaan}</p>
                  <Badge variant="secondary" className="text-[10px]">{q.tipe}</Badge>
                  {q.satuan && <Badge variant="outline" className="text-[10px]">satuan: {q.satuan}</Badge>}
                </div>
                {q.dimensiWilayah ? (
                  <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border bg-white">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-100">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Kecamatan</span>
                          </th>
                          <th className="px-3 py-1.5 text-right font-medium text-slate-500">Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.jawaban.map((d, i) => (
                          <tr key={i} className="border-t first:border-0">
                            <td className="px-3 py-1.5 text-slate-700">{d.wilayahNama}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-slate-900">{d.nilai}</td>
                          </tr>
                        ))}
                        {q.jawaban.length === 0 && (
                          <tr><td colSpan={2} className="px-3 py-2 text-center text-slate-400">Belum diisi</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : q.tipe === "FILE" && q.jawaban[0]?.nilai ? (
                  <a
                    href={`/api/backoffice/uploads/${encodeURIComponent(q.jawaban[0].nilai)}`}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    <FileDown className="h-4 w-4" /> Unduh dokumen pendukung
                  </a>
                ) : (
                  <p className="mt-2 text-lg font-bold text-emerald-700">
                    {q.jawaban[0]?.nilai ?? "-"}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Aksi verifikasi */}
      {status === "DIKIRIM" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Keputusan Verifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Catatan untuk OPD (wajib bila mengembalikan) — contoh: nilai kecamatan X tidak konsisten dengan periode lalu"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => act("TERVERIFIKASI")}
                disabled={loading !== null}
              >
                {loading === "SETUJUI" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Setujui (Terverifikasi)
              </Button>
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => act("PERLU_PERBAIKAN")}
                disabled={loading !== null}
              >
                {loading === "KEMBALIKAN" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Kembalikan dengan Catatan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {status === "PERLU_PERBAIKAN" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Data sedang menunggu perbaikan OPD. OPD telah diberi akses edit dan akan mengirim ulang setelah memperbaiki data.
        </div>
      )}
    </div>
  );
}
