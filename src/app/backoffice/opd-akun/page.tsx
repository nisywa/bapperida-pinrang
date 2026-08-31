import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AkunForm } from "@/components/backoffice/akun-form";
import { UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akun Saya" };

export default async function OpdAkunPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.id }, include: { opd: true } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <UserCircle className="h-6 w-6 text-emerald-600" /> Akun Saya
        </h1>
        <p className="mt-1 text-sm text-slate-600">Kelola nama tampilan dan kata sandi akun Anda.</p>
      </div>
      <AkunForm
        email={user.email}
        role={user.role}
        opdNama={user.opd?.nama ?? null}
        lastLoginAt={user.lastLoginAt?.toISOString() ?? null}
        nama={user.nama}
      />
    </div>
  );
}
