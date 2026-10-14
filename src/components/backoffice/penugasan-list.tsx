"use client";

import { useAction } from "@/components/backoffice/action-utils";
import { deletePenugasan, updatePenugasan } from "@/lib/actions/bapperida";
import { Input } from "@/components/ui/input";
import { dateInputValue } from "@/lib/questionnaire";
import { Button } from "@/components/ui/button";
import { formatTanggal, formatNumber, JAWABAN_STATUS } from "@/lib/constants";
import { Trash2 } from "lucide-react";

type Item = {
  id: string;
  opdNama: string;
  indikatorNama: string;
  periodeNama: string;
  deadline: string | null;
  status: string;
  percent: number;
  periodeStatus: string;
  accessStatus: string;
  periodStart: string;
  periodEnd: string;
};

export function PenugasanList({ items }: { items: Item[] }) {
  const { run, runForm, loading } = useAction();

  return (
    <div className="space-y-2.5">
      {items.map((p) => {
        const st = JAWABAN_STATUS[p.status as keyof typeof JAWABAN_STATUS];
        return (
          <div key={p.id} className="rounded-xl border p-4 transition-colors hover:bg-slate-50/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {p.opdNama} <span className="font-normal text-slate-400">·</span>{" "}
                  <span className="text-slate-700">{p.indikatorNama}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.periodeNama} · Deadline {formatTanggal(p.deadline)}
                </p>
                <p className={`mt-1 text-xs ${p.accessStatus === "AKTIF" ? "text-emerald-700" : "text-red-600"}`}>Akses OPD: {p.accessStatus === "AKTIF" ? "Aktif" : "Dinonaktifkan"} · Periode {dateInputValue(p.periodStart)} – {dateInputValue(p.periodEnd)} WITA</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st?.color ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st?.dot ?? "bg-slate-300"}`} />
                  {p.status === "BELUM" ? "Belum Diisi" : st?.label ?? p.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  disabled={loading}
                  onClick={() => run(() => deletePenugasan(p.id))}
                  title="Hapus penugasan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <details className="mt-3 rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-medium text-emerald-700">Atur akses OPD & tenggat</summary><form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void runForm(updatePenugasan, new FormData(event.currentTarget)); }}>
              <input type="hidden" name="id" value={p.id} />
              <label className="space-y-1 text-xs">Akses pengisian<select name="status" defaultValue={p.accessStatus} className="block h-10 rounded-md border bg-white px-2 text-sm"><option value="AKTIF">Aktif</option><option value="NONAKTIF">Nonaktif</option></select></label>
              <label className="space-y-1 text-xs">Tenggat (WITA)<Input name="deadline" type="date" min={dateInputValue(p.periodStart)} max={dateInputValue(p.periodEnd)} defaultValue={p.deadline ? dateInputValue(p.deadline) : ""} /></label>
              <Button size="sm" type="submit" disabled={loading}>Simpan pengaturan</Button>
              <p className="w-full text-xs text-slate-500">Kosongkan tenggat untuk mengikuti tanggal selesai periode. Nonaktif menghentikan pengisian OPD ini dan mempertahankan riwayat jawaban.</p>
            </form></details>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, p.percent)}%` }} />
              </div>
              <span className="text-xs font-medium text-slate-600">{formatNumber(p.percent, 0)}%</span>
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada penugasan.</p>
      )}
    </div>
  );
}
