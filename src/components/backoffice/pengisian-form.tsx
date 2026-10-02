"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { simpanDetailJawaban, kirimJawaban } from "@/lib/actions/opd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, MapPin, FileUp, FileText, X } from "lucide-react";

type Q = {
  id: string;
  kode: string;
  pertanyaan: string;
  tipe: string;
  tipeLabel: string;
  satuan: string | null;
  helpText: string | null;
  dimensiWilayah: boolean;
  opsi: string[];
};
type Aspek = { id: string; nama: string; pertanyaan: Q[] };
type Initial = { key: string; pertanyaanId: string; wilayahId: string | null; valueText: string | null; valueNumber: number | null; valueBoolean: boolean | null; valueDate: string | null };

type CellValue = { text?: string; number?: string; bool?: boolean; date?: string };

export function PengisianForm({
  penugasanId,
  readOnly,
  periodeAktif,
  aspekList,
  wilayahList,
  initialValues,
}: {
  penugasanId: string;
  readOnly: boolean;
  periodeAktif: boolean;
  aspekList: Aspek[];
  wilayahList: Array<{ id: string; nama: string }>;
  initialValues: Initial[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, CellValue>>(() => {
    const init: Record<string, CellValue> = {};
    for (const v of initialValues) {
      init[v.key] = {
        text: v.valueText ?? undefined,
        number: v.valueNumber !== null ? String(v.valueNumber) : undefined,
        bool: v.valueBoolean ?? undefined,
        date: v.valueDate ?? undefined,
      };
    }
    return init;
  });
  const [loading, setLoading] = useState<"draft" | "kirim" | null>(null);

  const keyOf = (q: Q, wilayahId?: string | null) => `${q.id}:${wilayahId ?? "-"}`;
  const allQuestions = useMemo(() => aspekList.flatMap((a) => a.pertanyaan), [aspekList]);
  const filledCount = Object.values(values).filter((v) => v.text || v.number || v.bool !== undefined || v.date).length;
  const totalCount = useMemo(
    () => allQuestions.reduce((acc, q) => acc + (q.dimensiWilayah ? wilayahList.length : 1), 0),
    [allQuestions, wilayahList.length]
  );

  function setValue(key: string, patch: CellValue) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function buildPayload() {
    const vals: Array<{
      pertanyaanId: string;
      wilayahId?: string | null;
      valueText?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueDate?: string | null;
    }> = [];
    for (const q of allQuestions) {
      if (q.dimensiWilayah) {
        for (const w of wilayahList) {
          const v = values[keyOf(q, w.id)];
          if (!v) continue;
          vals.push({
            pertanyaanId: q.id,
            wilayahId: w.id,
            valueText: v.text ?? null,
            valueNumber: v.number !== undefined && v.number !== "" ? parseFloat(v.number) : null,
            valueBoolean: v.bool ?? null,
            valueDate: v.date ?? null,
          });
        }
      } else {
        const v = values[keyOf(q)];
        if (!v) continue;
        vals.push({
          pertanyaanId: q.id,
          wilayahId: null,
          valueText: v.text ?? null,
          valueNumber: v.number !== undefined && v.number !== "" ? parseFloat(v.number) : null,
          valueBoolean: v.bool ?? null,
          valueDate: v.date ?? null,
        });
      }
    }
    return vals;
  }

  async function saveDraft() {
    setLoading("draft");
    const res = await simpanDetailJawaban({ penugasanId, values: buildPayload() });
    setLoading(null);
    if (res.ok) {
      toast.success(res.message ?? "Draft tersimpan.");
      router.refresh();
    } else toast.error(res.error ?? "Gagal menyimpan.");
  }

  async function submit() {
    setLoading("kirim");
    const res = await simpanDetailJawaban({ penugasanId, values: buildPayload() });
    if (!res.ok) {
      setLoading(null);
      toast.error(res.error ?? "Gagal menyimpan.");
      return;
    }
    const res2 = await kirimJawaban(penugasanId);
    setLoading(null);
    if (res2.ok) {
      toast.success(res2.message ?? "Data terkirim.");
      router.push("/backoffice/pengisian");
      router.refresh();
    } else toast.error(res2.error ?? "Gagal mengirim.");
  }

  const disabled = readOnly || !periodeAktif;

  return (
    <div className="space-y-5">
      {/* Progres strip */}
      <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${totalCount ? Math.min(100, (filledCount / totalCount) * 100) : 0}%` }} />
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-600">
          {filledCount}/{totalCount} nilai terisi
        </span>
      </div>

      {aspekList.map((asp) => (
        <Card key={asp.id} className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wide text-emerald-700">{asp.nama}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {asp.pertanyaan.map((q) => (
              <div key={q.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{q.pertanyaan}</p>
                  <Badge variant="secondary" className="text-[10px]">{q.tipeLabel}</Badge>
                  {q.satuan && <Badge variant="outline" className="text-[10px]">{q.satuan}</Badge>}
                  {q.dimensiWilayah && <Badge variant="outline" className="text-[10px]"><MapPin className="mr-1 h-2.5 w-2.5" />per kecamatan</Badge>}
                </div>
                {q.helpText && <p className="mt-1 text-xs text-slate-500">{q.helpText}</p>}

                <div className="mt-3">
                  {q.dimensiWilayah ? <WilayahInputs q={q} wilayahList={wilayahList} values={values} setValue={setValue} disabled={disabled} /> : <SingleInput q={q} value={values[keyOf(q)]} setValue={setValue} disabled={disabled} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Aksi */}
      {!readOnly && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-lg">
          <p className="text-xs text-slate-500">
            {periodeAktif
              ? "Simpan draft berulang kali. Pengiriman hanya dapat dilakukan bila seluruh pertanyaan wajib lengkap."
              : "Periode pengisian telah ditutup — data tidak dapat diubah."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} disabled={loading !== null || !periodeAktif}>
              {loading === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Draft
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={submit} disabled={loading !== null || !periodeAktif}>
              {loading === "kirim" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Kirim untuk Verifikasi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WilayahInputs({
  q, wilayahList, values, setValue, disabled,
}: {
  q: Q;
  wilayahList: Array<{ id: string; nama: string }>;
  values: Record<string, CellValue>;
  setValue: (key: string, patch: CellValue) => void;
  disabled: boolean;
}) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border bg-slate-50/60">
      <table className="w-full text-sm">
        <tbody>
          {wilayahList.map((w) => {
            const key = `${q.id}:${w.id}`;
            const v = values[key];
            return (
              <tr key={w.id} className="border-b last:border-0">
                <td className="w-40 px-3 py-1.5 text-xs font-medium text-slate-600">{w.nama}</td>
                <td className="px-3 py-1.5">
                  {q.tipe === "NUMBER" ? (
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      className="h-8 max-w-32 bg-white text-right text-sm"
                      placeholder={`nilai ${q.satuan ?? ""}`}
                      value={v?.number ?? ""}
                      disabled={disabled}
                      onChange={(e) => setValue(key, { number: e.target.value })}
                    />
                  ) : (
                    <Input
                      className="h-8 max-w-full bg-white text-sm"
                      value={v?.text ?? ""}
                      disabled={disabled}
                      onChange={(e) => setValue(key, { text: e.target.value })}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SingleInput({
  q, value, setValue, disabled,
}: {
  q: Q;
  value?: CellValue;
  setValue: (key: string, patch: CellValue) => void;
  disabled: boolean;
}) {
  const key = `${q.id}:-`;
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file?: File) {
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/backoffice/uploads", { method: "POST", body });
      const result = (await response.json()) as { id?: string; name?: string; error?: string };
      if (!response.ok || !result.id) {
        toast.error(result.error ?? "Gagal mengunggah dokumen.");
        return;
      }
      setValue(key, { text: result.id });
      toast.success(`${result.name ?? "Dokumen"} berhasil diunggah. Simpan draft untuk menautkannya ke jawaban.`);
    } catch {
      toast.error("Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
    }
  }

  if (q.tipe === "NUMBER") {
    return (
      <Input
        type="number"
        step="any"
        inputMode="decimal"
        className="max-w-48"
        placeholder={`masukkan nilai${q.satuan ? ` (${q.satuan})` : ""}`}
        value={value?.number ?? ""}
        disabled={disabled}
        onChange={(e) => setValue(key, { number: e.target.value })}
      />
    );
  }
  if (q.tipe === "TEXT") {
    return (
      <Textarea
        rows={2}
        placeholder="Ketik jawaban..."
        value={value?.text ?? ""}
        disabled={disabled}
        onChange={(e) => setValue(key, { text: e.target.value })}
      />
    );
  }
  if (q.tipe === "BOOLEAN") {
    return (
      <div className="flex gap-2">
        {[true, false].map((b) => (
          <button
            key={String(b)}
            type="button"
            disabled={disabled}
            onClick={() => setValue(key, { bool: b })}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              value?.bool === b ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {b ? "Ya" : "Tidak"}
          </button>
        ))}
      </div>
    );
  }
  if (q.tipe === "OPTIONS") {
    return (
      <select
        className="h-10 max-w-xs rounded-lg border bg-white px-3 text-sm"
        value={value?.text ?? ""}
        disabled={disabled}
        onChange={(e) => setValue(key, { text: e.target.value })}
      >
        <option value="">— Pilih —</option>
        {q.opsi.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (q.tipe === "DATE") {
    return (
      <Input
        type="date"
        className="max-w-48"
        value={value?.date ?? ""}
        disabled={disabled}
        onChange={(e) => setValue(key, { date: e.target.value })}
      />
    );
  }
  if (q.tipe === "FILE") {
    return (
      <div className="space-y-2">
        {value?.text && (
          <div className="flex max-w-xl items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
            <a
              href={`/api/backoffice/uploads/${encodeURIComponent(value.text)}`}
              className="inline-flex items-center gap-2 font-medium text-emerald-700 hover:underline"
            >
              <FileText className="h-4 w-4" /> Dokumen pendukung tersimpan
            </a>
            {!disabled && (
              <button type="button" onClick={() => setValue(key, { text: "" })} className="text-slate-400 hover:text-rose-600" title="Lepaskan dokumen">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {!disabled && (
          <label className={`inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {value?.text ? "Ganti dokumen" : "Unggah dokumen"}
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={(event) => uploadFile(event.target.files?.[0])}
            />
          </label>
        )}
        <p className="text-xs text-slate-500">PDF, DOCX, XLS/XLSX, CSV, PNG, atau JPG. Maksimal 10 MB.</p>
      </div>
    );
  }
  return <Input disabled placeholder="Tipe tidak didukung" />;
}
