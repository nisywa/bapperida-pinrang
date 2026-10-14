"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPenugasan, createPeriode } from "@/lib/actions/bapperida";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle } from "lucide-react";
import { dateInputValue } from "@/lib/questionnaire";
import { TIPE_JAWABAN } from "@/lib/constants";

type Option = { id: string; nama: string; singkatan?: string; kode?: string };
type PeriodeOpt = { id: string; nama: string; kode: string; status: string; startDate: string; endDate: string };

export function PenugasanForm({
  periodeList,
  indikatorList,
  opdList,
}: {
  periodeList: PeriodeOpt[];
  indikatorList: Array<{ id: string; nama: string; kode: string; jumlahPertanyaan: number; aspek: { nama: string; pertanyaan: { teks: string; tipe: string }[] }[] }>;
  opdList: Option[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOpd, setSelectedOpd] = useState<string[]>([]);
  const availablePeriods = periodeList.filter(p => p.status === "AKTIF" && new Date(p.endDate) >= new Date());
  const [selectedPeriodId, setSelectedPeriodId] = useState(availablePeriods[0]?.id ?? "");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(indikatorList[0]?.id ?? "");
  const selectedPeriod = periodeList.find(p => p.id === selectedPeriodId);
  const selectedIndicator = indikatorList.find(i => i.id === selectedIndicatorId);

  async function submitPenugasan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("opdIds");
    for (const id of selectedOpd) fd.append("opdIds", id);
    setLoading(true);
    const res = await createPenugasan(fd);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Penugasan dibuat.");
      setSelectedOpd([]);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal membuat penugasan.");
    }
  }

  async function submitPeriode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    const res = await createPeriode(fd);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Periode dibuat.");
      form.reset();
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal membuat periode.");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusCircle className="h-5 w-5 text-emerald-600" /> Buat Penugasan Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="penugasan">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="penugasan">Penugasan</TabsTrigger>
            <TabsTrigger value="periode">Periode</TabsTrigger>
          </TabsList>

          <TabsContent value="penugasan" className="mt-4">
            <form onSubmit={submitPenugasan} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Periode</Label>
                <select name="periodeId" required className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={selectedPeriodId} onChange={event => setSelectedPeriodId(event.target.value)}>
                  <option value="" disabled>Pilih periode aktif</option>
                  {availablePeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} {p.status === "AKTIF" ? "• aktif" : ""}
                    </option>
                  ))}
                </select>
                {selectedPeriod && <p className="text-xs text-slate-500">{dateInputValue(selectedPeriod.startDate)} – {dateInputValue(selectedPeriod.endDate)} WITA</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Indikator</Label>
                <select name="indikatorId" required className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={selectedIndicatorId} onChange={event => setSelectedIndicatorId(event.target.value)}>
                  <option value="" disabled>Pilih indikator</option>
                  {indikatorList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.kode} — {i.nama} ({i.jumlahPertanyaan} pertanyaan)
                    </option>
                  ))}
                </select>
                {selectedIndicator && <details className="rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-xs text-emerald-700">Lihat aspek dan pertanyaan</summary>{selectedIndicator.aspek.map((aspect, index) => <div key={index} className="mt-3"><p className="text-xs font-semibold">{aspect.nama}</p><ol className="ml-4 mt-1 list-decimal space-y-1 text-xs text-slate-500">{aspect.pertanyaan.map((q, qIndex) => <li key={qIndex}>{q.teks} · {TIPE_JAWABAN[q.tipe as keyof typeof TIPE_JAWABAN] ?? q.tipe}</li>)}</ol></div>)}</details>}
              </div>
              <div className="space-y-1.5">
                <Label>OPD Yang Ditugaskan ({selectedOpd.length} dipilih)</Label>
                <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border p-3">
                  {opdList.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-slate-50">
                      <Checkbox
                        checked={selectedOpd.includes(o.id)}
                        onCheckedChange={(c) =>
                          setSelectedOpd((prev) => (c ? [...prev, o.id] : prev.filter((x) => x !== o.id)))
                        }
                      />
                      {o.nama}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Tenggat</Label>
                <Input id="deadline" name="deadline" type="date" min={selectedPeriod ? dateInputValue(selectedPeriod.startDate) : undefined} max={selectedPeriod ? dateInputValue(selectedPeriod.endDate) : undefined} />
                <p className="text-xs text-slate-500">Opsional. Jika kosong, mengikuti tanggal selesai periode.</p>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading || !availablePeriods.length || !indikatorList.length || selectedOpd.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Penugasan
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="periode" className="mt-4">
            <form onSubmit={submitPeriode} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="kode">Kode Periode</Label>
                <Input id="kode" name="kode" placeholder="SEM-2-2026" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nama">Nama Periode</Label>
                <Input id="nama" name="nama" placeholder="Tahun 2026 - Semester 2" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Mulai</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Selesai</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              <p className="text-xs text-slate-500">WITA: mulai pukul 00.00 sampai 23.59 pada tanggal selesai. Periode satu hari diperbolehkan.</p>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Periode
              </Button>
            </form>

          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
