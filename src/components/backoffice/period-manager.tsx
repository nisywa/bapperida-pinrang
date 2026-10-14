"use client";

import { useAction } from "@/components/backoffice/action-utils";
import { createPeriode } from "@/lib/actions/bapperida";
import { dateInputValue } from "@/lib/questionnaire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PeriodManager({ periods }: { periods: { id: string; kode: string; nama: string; startDate: string; endDate: string; status: string }[] }) {
  const { runForm, loading } = useAction();
  return <section className="rounded-xl border bg-white p-4 shadow-sm"><h2 className="mb-3 font-semibold">Periode Pengisian</h2><p className="mb-4 text-xs text-slate-500">Rentang berlaku pukul 00.00 tanggal mulai sampai 23.59 tanggal selesai, dalam WITA. Periode dapat diedit, ditutup, atau dibuka kembali.</p><div className="space-y-3">{periods.map(period => <details key={`${period.id}-${period.startDate}-${period.endDate}-${period.status}`} className="rounded-lg border p-3">
    <summary className="cursor-pointer text-sm"><span className="font-medium">{period.nama}</span><span className="mt-1 block text-xs text-slate-500">{dateInputValue(period.startDate)} – {dateInputValue(period.endDate)} · {period.status === "AKTIF" ? "Aktif" : "Ditutup"}</span></summary>
    <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); void runForm(createPeriode, new FormData(event.currentTarget)); }}>
      <input type="hidden" name="id" value={period.id} />
      <label className="block space-y-1 text-xs">Kode periode<Input required name="kode" defaultValue={period.kode} /></label>
      <label className="block space-y-1 text-xs">Nama periode<Input required name="nama" defaultValue={period.nama} /></label>
      <label className="block space-y-1 text-xs">Mulai (WITA)<Input required name="startDate" type="date" defaultValue={dateInputValue(period.startDate)} /></label>
      <label className="block space-y-1 text-xs">Selesai (WITA)<Input required name="endDate" type="date" defaultValue={dateInputValue(period.endDate)} /></label>
      <label className="block space-y-1 text-xs">Status<select name="status" defaultValue={period.status} className="h-10 w-full rounded-md border bg-white px-2 text-sm"><option value="AKTIF">Aktif / buka pengisian</option><option value="DITUTUP">Ditutup / kunci pengisian</option></select></label>
      <Button size="sm" type="submit" disabled={loading}>{loading ? "Menyimpan…" : "Simpan periode"}</Button>
    </form>
  </details>)}{!periods.length && <p className="text-sm text-slate-500">Belum ada periode.</p>}</div></section>;
}
