"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPenugasan, createPeriode, tutupPeriode } from "@/lib/actions/bapperida";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, Lock } from "lucide-react";

type Option = { id: string; nama: string; singkatan?: string; kode?: string };
type PeriodeOpt = { id: string; nama: string; kode: string; status: string; startDate: string; endDate: string };

export function PenugasanForm({
  periodeList,
  indikatorList,
  opdList,
}: {
  periodeList: PeriodeOpt[];
  indikatorList: Array<{ id: string; nama: string; kode: string; jumlahPertanyaan: number }>;
  opdList: Option[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOpd, setSelectedOpd] = useState<string[]>([]);
  const periodeAktif = periodeList.find((p) => p.status === "AKTIF");

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
                <select name="periodeId" required className="h-10 w-full rounded-lg border bg-white px-3 text-sm" defaultValue={periodeAktif?.id ?? ""}>
                  {periodeList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} {p.status === "AKTIF" ? "• aktif" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Indikator</Label>
                <select name="indikatorId" required className="h-10 w-full rounded-lg border bg-white px-3 text-sm">
                  {indikatorList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.kode} — {i.nama} ({i.jumlahPertanyaan} pertanyaan)
                    </option>
                  ))}
                </select>
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
                <Input id="deadline" name="deadline" type="date" required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
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
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Periode
              </Button>
            </form>

            {periodeAktif && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  Periode aktif saat ini: <strong>{periodeAktif.nama}</strong>. Menutup periode akan
                  mengunci seluruh pengisian data.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    const res = await tutupPeriode(periodeAktif.id);
                    setLoading(false);
                    if (res.ok) {
                      toast.success(res.message ?? "Periode ditutup.");
                      router.refresh();
                    } else toast.error(res.error ?? "Gagal.");
                  }}
                >
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Tutup Periode Aktif
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
