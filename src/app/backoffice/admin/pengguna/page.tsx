import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PenggunaManager } from "@/components/backoffice/pengguna-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manajemen Pengguna" };

export default async function PenggunaPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return <p className="text-sm text-slate-600">Menu ini khusus Administrator.</p>;
  }

  const [users, opdList] = await Promise.all([
    db.user.findMany({ include: { opd: true }, orderBy: { createdAt: "asc" } }),
    db.opd.findMany({ where: { status: "AKTIF" }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Users className="h-6 w-6 text-emerald-600" /> Manajemen Pengguna
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola akun Bapperida dan OPD: buat akun baru, aktifkan/nonaktifkan, dan reset kredensial.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <PenggunaManager
            users={users.map((u) => ({
              id: u.id,
              nama: u.nama,
              email: u.email,
              role: u.role,
              status: u.status,
              opdNama: u.opd?.nama ?? null,
              lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
            }))}
            opdList={opdList.map((o) => ({ id: o.id, nama: o.nama }))}
            currentUserId={session.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
