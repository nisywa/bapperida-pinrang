"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAction } from "@/components/backoffice/action-utils";
import {
  simpanArtikel, publikasikanArtikel, hapusArtikel,
  simpanPublikasi, publikasikanPublikasi, hapusPublikasi,
} from "@/lib/actions/opd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle, Send, Trash2, Pencil, FileDown } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

type ArtikelItem = {
  id: string; judul: string; ringkasan: string; isi: string; emoji: string;
  status: string; publishedAt: string | null; pemilik: string; opdId: string | null;
  showOnMainPortal: boolean;
};
type PublikasiItem = {
  id: string; judul: string; deskripsi: string; jenisFile: string; tahun: number | null;
  status: string; pemilik: string; downloads: number;
};

export function KontenManager({
  artikelList,
  publikasiList,
  canCreate,
}: {
  artikelList: ArtikelItem[];
  publikasiList: PublikasiItem[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const { run, runForm, loading } = useAction();
  const [editArtikel, setEditArtikel] = useState<ArtikelItem | null>(null);

  return (
    <Tabs defaultValue="artikel">
      <TabsList className="grid w-full max-w-sm grid-cols-2">
        <TabsTrigger value="artikel">Artikel ({artikelList.length})</TabsTrigger>
        <TabsTrigger value="publikasi">Publikasi ({publikasiList.length})</TabsTrigger>
      </TabsList>

      {/* ============ ARTIKEL ============ */}
      <TabsContent value="artikel" className="mt-4 space-y-4">
        {canCreate && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Tulis Artikel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Artikel Baru</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const res = await runForm(simpanArtikel, fd);
                  if (res.ok) (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emoji">Emoji</Label>
                    <Input id="emoji" name="emoji" defaultValue="📰" maxLength={4} className="text-center text-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="judul">Judul</Label>
                    <Input id="judul" name="judul" required placeholder="Judul artikel" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ringkasan">Ringkasan</Label>
                  <Textarea id="ringkasan" name="ringkasan" rows={2} required placeholder="Ringkasan singkat (tampil pada daftar)" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="isi">Isi Artikel</Label>
                  <Textarea id="isi" name="isi" rows={8} required placeholder="Isi lengkap artikel. Pisahkan paragraf dengan baris kosong." />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan sebagai Draft
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="space-y-3">
          {artikelList.map((a) => (
            <div key={a.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="text-3xl">{a.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{a.judul}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{a.ringkasan}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.pemilik} · {a.publishedAt ? formatTanggal(a.publishedAt) : "Belum terbit"}
                      {a.showOnMainPortal ? " · tampil di portal utama" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge className={a.status === "PUBLISHED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                    {a.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500" title="Edit" onClick={() => setEditArtikel(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    disabled={loading}
                    onClick={() => run(() => publikasikanArtikel(a.id))}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    {a.status === "PUBLISHED" ? "Tarik" : "Terbitkan"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    disabled={loading}
                    onClick={() => run(() => hapusArtikel(a.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {artikelList.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada artikel.</p>
          )}
        </div>

        {/* Dialog edit */}
        {editArtikel && (
          <Dialog open onOpenChange={(o) => !o && setEditArtikel(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Artikel</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const res = await runForm(simpanArtikel, fd);
                  if (res.ok) setEditArtikel(null);
                }}
              >
                <input type="hidden" name="id" value={editArtikel.id} />
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-emoji">Emoji</Label>
                    <Input id="e-emoji" name="emoji" defaultValue={editArtikel.emoji} maxLength={4} className="text-center text-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-judul">Judul</Label>
                    <Input id="e-judul" name="judul" defaultValue={editArtikel.judul} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-ringkasan">Ringkasan</Label>
                  <Textarea id="e-ringkasan" name="ringkasan" rows={2} defaultValue={editArtikel.ringkasan} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-isi">Isi</Label>
                  <Textarea id="e-isi" name="isi" rows={8} defaultValue={editArtikel.isi} required />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </TabsContent>

      {/* ============ PUBLIKASI ============ */}
      <TabsContent value="publikasi" className="mt-4 space-y-4">
        {canCreate && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Publikasi Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Publikasi Baru</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const res = await runForm(simpanPublikasi, fd);
                  if (res.ok) (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="p-judul">Judul</Label>
                  <Input id="p-judul" name="judul" required placeholder="Judul publikasi" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-deskripsi">Deskripsi</Label>
                  <Textarea id="p-deskripsi" name="deskripsi" rows={3} required placeholder="Deskripsi publikasi" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-jenis">Jenis File</Label>
                    <select id="p-jenis" name="jenisFile" className="h-10 w-full rounded-lg border bg-white px-3 text-sm">
                      <option>PDF</option>
                      <option>XLSX</option>
                      <option>CSV</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-tahun">Tahun</Label>
                    <Input id="p-tahun" name="tahun" type="number" min="2000" max="2100" defaultValue={new Date().getFullYear()} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan sebagai Draft
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="space-y-3">
          {publikasiList.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                  {p.jenisFile}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{p.judul}</p>
                  <p className="text-xs text-slate-500">
                    {p.pemilik} · {p.tahun ?? "-"} · {p.downloads} unduhan
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge className={p.status === "PUBLISHED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                  {p.status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
                {p.status === "PUBLISHED" && (
                  <a
                    href={`/api/public/publikasi/${p.id}/download`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    title="Unduh"
                  >
                    <FileDown className="h-4 w-4" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  disabled={loading}
                  onClick={() => run(() => publikasikanPublikasi(p.id))}
                >
                  <Send className="mr-1 h-3.5 w-3.5" />
                  {p.status === "PUBLISHED" ? "Tarik" : "Terbitkan"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  disabled={loading}
                  onClick={() => run(() => hapusPublikasi(p.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {publikasiList.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada publikasi.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
