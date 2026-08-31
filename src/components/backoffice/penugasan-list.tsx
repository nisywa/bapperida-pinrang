"use client";

import { useAction } from "@/components/backoffice/action-utils";
import { deletePenugasan } from "@/lib/actions/bapperida";
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
};

export function PenugasanList({ items }: { items: Item[] }) {
  const { run, loading } = useAction();

  return (
    <div className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
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
