"use client";

import { useState } from "react";
import { useAction } from "@/components/backoffice/action-utils";
import { createPengguna, updatePenggunaStatus, resetPasswordPengguna } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, Power, KeyRound } from "lucide-react";
import { formatTanggal } from "@/lib/constants";

type UserItem = {
  id: string; nama: string; email: string; role: string; status: string;
  opdNama: string | null; lastLoginAt: string | null;
};

function UserTable({ items, currentUserId }: { items: UserItem[]; currentUserId: string }) {
  const { run, runForm, loading } = useAction();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>OPD</TableHead>
          <TableHead>Login Terakhir</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium text-slate-900">{u.nama}</TableCell>
            <TableCell className="text-slate-600">{u.email}</TableCell>
            <TableCell className="text-slate-600">{u.opdNama ?? "-"}</TableCell>
            <TableCell className="text-xs text-slate-500">{formatTanggal(u.lastLoginAt)}</TableCell>
            <TableCell>
              <Badge className={u.status === "AKTIF" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"}>
                {u.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500" title="Reset kata sandi">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Reset Kata Sandi — {u.nama}</DialogTitle>
                    </DialogHeader>
                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        fd.set("userId", u.id);
                        const res = await runForm(resetPasswordPengguna, fd);
                        if (res.ok) (e.target as HTMLFormElement).reset();
                      }}
                    >
                      <div className="space-y-1.5">
                        <Label>Kata Sandi Baru</Label>
                        <Input name="password" type="password" required minLength={8} placeholder="Minimal 8 karakter" />
                      </div>
                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                  title={u.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                  disabled={u.id === currentUserId || loading}
                  onClick={() => run(() => updatePenggunaStatus(u.id))}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PenggunaManager({
  users, opdList, currentUserId,
}: {
  users: UserItem[];
  opdList: Array<{ id: string; nama: string }>;
  currentUserId: string;
}) {
  const { runForm, loading } = useAction();
  const bapperidaUsers = users.filter((u) => u.role === "BAPPERIDA");
  const opdUsers = users.filter((u) => u.role === "OPD");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs defaultValue="bapperida" className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="bapperida">User Bapperida ({bapperidaUsers.length})</TabsTrigger>
              <TabsTrigger value="opd">User OPD ({opdUsers.length})</TabsTrigger>
            </TabsList>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Pengguna Baru</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const res = await runForm(createPengguna, fd);
                    if (res.ok) (e.target as HTMLFormElement).reset();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label>Peran</Label>
                    <select name="role" className="h-10 w-full rounded-lg border bg-white px-3 text-sm" defaultValue="BAPPERIDA">
                      <option value="BAPPERIDA">Bapperida</option>
                      <option value="OPD">OPD</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>OPD (wajib untuk peran OPD)</Label>
                    <select name="opdId" className="h-10 w-full rounded-lg border bg-white px-3 text-sm">
                      <option value="">— Tanpa OPD —</option>
                      {opdList.map((o) => (
                        <option key={o.id} value={o.id}>{o.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nama</Label>
                    <Input name="nama" required placeholder="Nama lengkap" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input name="email" type="email" required placeholder="nama@pinrang.go.id" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kata Sandi</Label>
                    <Input name="password" type="password" required minLength={8} placeholder="Minimal 8 karakter" />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buat Pengguna
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="bapperida" className="mt-4">
            <UserTable items={bapperidaUsers} currentUserId={currentUserId} />
          </TabsContent>
          <TabsContent value="opd" className="mt-4">
            <UserTable items={opdUsers} currentUserId={currentUserId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
