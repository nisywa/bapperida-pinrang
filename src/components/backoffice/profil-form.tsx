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
import { OpdLogoInput } from "@/components/backoffice/opd-logo-input";

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
    logoUrl: string | null;
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
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("opdId", opdId);
    if (loading) return;
    setLoading(true);
    try {
      const res = await simpanProfilOpd(fd);
      if (res.ok) {
        toast.success(res.message ?? "Profil diperbarui.");
        router.refresh();
      } else toast.error(res.error ?? "Gagal menyimpan profil.");
    } catch { toast.error("Koneksi terputus. Silakan coba lagi."); }
    finally { setLoading(false); }
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
          <CardTitle className="text-base">Logo Dinas</CardTitle>
        </CardHeader>
        <CardContent>
          <OpdLogoInput key={initial.logoUrl} initialUrl={initial.logoUrl} nama={opdNama} slug={opdSlug} />
        </CardContent>
      </Card>
    </form>
  );
}
