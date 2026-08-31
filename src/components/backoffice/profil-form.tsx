"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { simpanProfilOpd } from "@/lib/actions/opd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

const EMOJI_CHOICES = ["🏛️", "🏥", "🎓", "🛣️", "🏭", "🤝", "🌾", "📡", "🏘️", "💼", "🚧", "⚖️", "🏞️", "🚌"];

export function ProfilForm({
  opdId,
  opdNama,
  opdSlug,
  initial,
}: {
  opdId: string;
  opdNama: string;
  opdSlug: string;
  initial: {
    logoEmoji: string;
    deskripsi: string;
    visi: string;
    misi: string;
    alamat: string;
    telepon: string;
    emailPublic: string;
    heroRingkasan: string;
  };
}) {
  const router = useRouter();
  const [emoji, setEmoji] = useState(initial.logoEmoji);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("opdId", opdId);
    fd.set("logoEmoji", emoji);
    setLoading(true);
    const res = await simpanProfilOpd(fd);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Profil diperbarui.");
      router.refresh();
    } else toast.error(res.error ?? "Gagal menyimpan profil.");
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="heroRingkasan">Ringkasan Hero</Label>
            <Input id="heroRingkasan" name="heroRingkasan" defaultValue={initial.heroRingkasan} placeholder="Satu kalimat yang tampil di bagian atas halaman OPD" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea id="deskripsi" name="deskripsi" rows={4} defaultValue={initial.deskripsi} placeholder="Deskripsi lengkap tugas dan fungsi OPD" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="visi">Visi</Label>
              <Textarea id="visi" name="visi" rows={3} defaultValue={initial.visi} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="misi">Misi (satu per baris)</Label>
              <Textarea id="misi" name="misi" rows={3} defaultValue={initial.misi} placeholder={"Misinya satu\nMisinya dua"} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="alamat">Alamat</Label>
              <Input id="alamat" name="alamat" defaultValue={initial.alamat} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telepon">Telepon</Label>
              <Input id="telepon" name="telepon" defaultValue={initial.telepon} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailPublic">Email Publik</Label>
              <Input id="emailPublic" name="emailPublic" type="email" defaultValue={initial.emailPublic} />
            </div>
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Simpan Profil
          </Button>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logo (Emoji)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-2xl transition-all ${
                  emoji === e ? "border-emerald-500 bg-emerald-50 shadow-sm" : "hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 p-5 text-white">
            <p className="text-xs text-emerald-300">Pratinjau Header</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl">{emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{opdNama}</p>
                <p className="truncate text-xs text-emerald-300">/opd/{opdSlug}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
