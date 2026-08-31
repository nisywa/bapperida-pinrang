"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { kirimPengingat } from "@/lib/actions/bapperida";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send } from "lucide-react";

export function PengingatForm({ opdList }: { opdList: Array<{ id: string; nama: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("opdIds");
    for (const id of selected) fd.append("opdIds", id);
    setLoading(true);
    const res = await kirimPengingat(fd);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Pengingat terkirim.");
      setSelected([]);
      form.reset();
      router.refresh();
    } else {
      toast.error(res.error ?? "Gagal mengirim.");
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-5 w-5 text-emerald-600" /> Kirim Pengingat Manual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" placeholder="Pengingat tenggat pengisian indikator" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Pesan</Label>
            <Textarea id="message" name="message" rows={3} placeholder="Mohon segera lengkapi pengisian data indikator Anda..." required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>OPD Tujuan ({selected.length} dipilih)</Label>
              <button
                type="button"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                onClick={() => setSelected(selected.length === opdList.length ? [] : opdList.map((o) => o.id))}
              >
                {selected.length === opdList.length ? "Kosongkan" : "Pilih semua"}
              </button>
            </div>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border p-3">
              {opdList.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-slate-50">
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onCheckedChange={(c) => setSelected((prev) => (c ? [...prev, o.id] : prev.filter((x) => x !== o.id)))}
                  />
                  {o.nama}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Pengingat
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
