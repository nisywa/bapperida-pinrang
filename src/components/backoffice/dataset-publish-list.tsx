"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { publishDataset, unpublishDataset } from "@/lib/actions/bapperida";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, Undo2 } from "lucide-react";

type Item = { penugasanId: string; opdNama: string; indikatorNama: string; periodeNama: string; jawabanId: string };

export function DatasetPublishList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function publish(item: Item) {
    setLoadingId(item.penugasanId);
    const res = await publishDataset(item.penugasanId, `Snapshot resmi ${item.indikatorNama} - ${item.periodeNama}`);
    setLoadingId(null);
    if (res.ok) {
      toast.success(res.message ?? "Dataset dipublikasikan.");
      router.refresh();
    } else toast.error(res.error ?? "Gagal.");
  }

  async function unpublish(datasetId: string, label: string) {
    setLoadingId(datasetId);
    const res = await unpublishDataset(datasetId);
    setLoadingId(null);
    if (res.ok) {
      toast.success(res.message ?? "Dataset ditarik.");
      router.refresh();
    } else toast.error(res.error ?? "Gagal.");
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.penugasanId} className="flex items-center justify-between gap-3 rounded-xl border p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{item.indikatorNama}</p>
            <p className="text-xs text-slate-500">
              {item.opdNama} · {item.periodeNama}
            </p>
          </div>
          <Button size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700" disabled={loadingId === item.penugasanId} onClick={() => publish(item)}>
            {loadingId === item.penugasanId ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-1.5 h-3.5 w-3.5" />}
            Terbitkan
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">Belum ada data terverifikasi yang siap diterbitkan.</p>
          <p className="mt-1 text-xs text-slate-400">Verifikasi data OPD terlebih dahulu pada menu Verifikasi.</p>
        </div>
      )}
    </div>
  );
}
