"use client";

import { useState } from "react";
import { useAction } from "@/components/backoffice/action-utils";
import { createOpd, updateOpdStatus, createIndikator, toggleIndikator } from "@/lib/actions/admin";
import { tutupPeriode } from "@/lib/actions/bapperida";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Power, Building2, ListTree, MapPin, CalendarClock, Lock } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

type OpdItem = { id: string; kode: string; nama: string; singkatan: string; slug: string; status: string; users: number; emoji: string };
type IndItem = { id: string; kode: string; nama: string; satuan: string | null; isActive: boolean; aspek: Array<{ nama: string; jumlahPertanyaan: number }> };
type WilItem = { id: string; kode: string; nama: string; lat: number; lng: number };
type PerItem = { id: string; kode: string; nama: string; status: string; startDate: string; endDate: string; penugasan: number };

export function MasterManager({
  canManage, opdList, indikatorList, wilayahList, periodeList,
}: {
  canManage: boolean;
  opdList: OpdItem[];
  indikatorList: IndItem[];
  wilayahList: WilItem[];
  periodeList: PerItem[];
}) {
  const { run, runForm, loading } = useAction();

  return (
    <Tabs defaultValue="opd">
      <TabsList className="grid w-full max-w-xl grid-cols-4">
        <TabsTrigger value="opd">OPD ({opdList.length})</TabsTrigger>
        <TabsTrigger value="indikator">Indikator ({indikatorList.length})</TabsTrigger>
        <TabsTrigger value="wilayah">Wilayah ({wilayahList.length})</TabsTrigger>
        <TabsTrigger value="periode">Periode ({periodeList.length})</TabsTrigger>
      </TabsList>

      {/* ===== OPD ===== */}
      <TabsContent value="opd" className="mt-4 space-y-4">
        {canManage && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Daftarkan OPD
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>OPD Baru</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const res = await runForm(createOpd, new FormData(f)); if (res.ok) f.reset(); }}>
                <div className="space-y-1.5">
                  <Label>Nama OPD</Label>
                  <Input name="nama" required placeholder="Dinas ..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kode</Label>
                    <Input name="kode" required placeholder="7307.xx" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Singkatan</Label>
                    <Input name="singkatan" required placeholder="Dinas xx" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Slug (URL /opd/&#123;slug&#125;)</Label>
                  <Input name="slug" placeholder="dinas-... (otomatis bila kosong)" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Daftarkan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {opdList.map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-xl border p-4">
              <span className="text-2xl">{o.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{o.nama}</p>
                <p className="text-xs text-slate-500">{o.kode} · {o.users} akun · /opd/{o.slug}</p>
              </div>
              {canManage ? (
                <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0 text-slate-400" disabled={loading} onClick={() => run(() => updateOpdStatus(o.id))}>
                  <Power className="h-4 w-4" />
                </Button>
              ) : (
                <Badge variant="secondary">{o.status}</Badge>
              )}
            </div>
          ))}
        </div>
      </TabsContent>

      {/* ===== INDIKATOR ===== */}
      <TabsContent value="indikator" className="mt-4 space-y-4">
        {canManage && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Indikator Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Indikator Baru</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const res = await runForm(createIndikator, new FormData(f)); if (res.ok) f.reset(); }}>
                <div className="space-y-1.5">
                  <Label>Kode</Label>
                  <Input name="kode" required placeholder="IND-06" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nama Indikator</Label>
                  <Input name="nama" required placeholder="Nama indikator" />
                </div>
                <div className="space-y-1.5">
                  <Label>Satuan Default</Label>
                  <Input name="satuan" placeholder="unit / % / jiwa" />
                </div>
                <div className="space-y-1.5">
                  <Label>Deskripsi</Label>
                  <Input name="deskripsi" placeholder="Deskripsi singkat" />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Buat Indikator
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        <div className="space-y-3">
          {indikatorList.map((i) => (
            <div key={i.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{i.kode} — {i.nama}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {i.aspek.length} aspek · {i.aspek.reduce((a, x) => a + x.jumlahPertanyaan, 0)} pertanyaan · satuan: {i.satuan ?? "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={i.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                    {i.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {canManage && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400" disabled={loading} onClick={() => run(() => toggleIndikator(i.id))}>
                      <Power className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {i.aspek.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {i.aspek.map((a, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] font-normal">
                      {a.nama} ({a.jumlahPertanyaan})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </TabsContent>

      {/* ===== WILAYAH ===== */}
      <TabsContent value="wilayah" className="mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
          Master wilayah digunakan sebagai dimensi choropleth. Geometry kecamatan disimpan sebagai GeoJSON dengan kode referensi BPS.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode BPS</TableHead>
              <TableHead>Kecamatan</TableHead>
              <TableHead>Centroid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wilayahList.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs text-slate-600">{w.kode}</TableCell>
                <TableCell className="font-medium text-slate-900">{w.nama}</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">{w.lat.toFixed(4)}, {w.lng.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* ===== PERIODE ===== */}
      <TabsContent value="periode" className="mt-4">
        <div className="space-y-3">
          {periodeList.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{p.nama}</p>
                  <p className="text-xs text-slate-500">
                    {formatTanggal(p.startDate)} – {formatTanggal(p.endDate)} · {p.penugasan} penugasan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={p.status === "AKTIF" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                  {p.status === "AKTIF" ? "Aktif" : "Ditutup"}
                </Badge>
                {canManage && p.status === "AKTIF" && (
                  <Button variant="outline" size="sm" className="h-8 border-amber-200 text-xs text-amber-700" disabled={loading} onClick={() => run(() => tutupPeriode(p.id))}>
                    <Lock className="mr-1 h-3.5 w-3.5" /> Tutup
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
