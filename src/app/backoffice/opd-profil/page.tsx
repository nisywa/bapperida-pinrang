import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfilForm } from "@/components/backoffice/profil-form";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil OPD" };

export default async function OpdProfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OPD") {
    return <p className="text-sm text-slate-600">Menu ini khusus untuk pengguna OPD.</p>;
  }

  const opd = await db.opd.findUnique({ where: { id: session.opdId! }, include: { profil: true } });
  if (!opd) redirect("/login");

  let misiText = "";
  try {
    misiText = opd.profil?.misi ? JSON.parse(opd.profil.misi).join("\n") : "";
  } catch {
    misiText = opd.profil?.misi ?? "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Building2 className="h-6 w-6 text-emerald-600" /> Profil OPD
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola identitas {opd.nama} yang tampil pada halaman publik{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-emerald-700">/opd/{opd.slug}</code>
        </p>
      </div>

      <ProfilForm
        opdId={opd.id}
        opdNama={opd.nama}
        opdSlug={opd.slug}
        initial={{
          logoEmoji: opd.profil?.logoEmoji ?? "🏛️",
          deskripsi: opd.profil?.deskripsi ?? "",
          visi: opd.profil?.visi ?? "",
          misi: misiText,
          alamat: opd.profil?.alamat ?? "",
          telepon: opd.profil?.telepon ?? "",
          emailPublic: opd.profil?.emailPublic ?? "",
          heroRingkasan: opd.profil?.heroRingkasan ?? "",
        }}
      />
    </div>
  );
}
