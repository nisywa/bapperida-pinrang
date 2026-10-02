"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ubahAkunSaya } from "@/lib/actions/opd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { formatTanggal, ROLE_LABEL } from "@/lib/constants";

export function AkunForm({
  email, role, opdNama, lastLoginAt, nama,
}: {
  email: string;
  role: string;
  opdNama: string | null;
  lastLoginAt: string | null;
  nama: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLoading(true);
    const res = await ubahAkunSaya(fd);
    setLoading(false);
    if (res.ok) {
      toast.success(res.message ?? "Akun diperbarui.");
      form.reset();
      router.refresh();
    } else toast.error(res.error ?? "Gagal memperbarui akun.");
  }

  return (
    <div className="space-y-5">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2.5">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{email}</span>
          </div>
          <div className="flex justify-between border-b pb-2.5">
            <span className="text-slate-500">Peran</span>
            <Badge variant="secondary">{ROLE_LABEL[role] ?? role}</Badge>
          </div>
          {opdNama && (
            <div className="flex justify-between border-b pb-2.5">
              <span className="text-slate-500">OPD</span>
              <span className="font-medium text-slate-900">{opdNama}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Login Terakhir</span>
            <span className="font-medium text-slate-900">{formatTanggal(lastLoginAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perbarui Profil &amp; Kata Sandi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama">Nama Tampilan</Label>
              <Input id="nama" name="nama" defaultValue={nama} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Sandi Baru (opsional)</Label>
              <Input id="password" name="password" type="password" minLength={8} placeholder="Minimal 8 karakter — kosongkan bila tidak diubah" />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
