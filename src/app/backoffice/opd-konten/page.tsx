import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KontenManager } from "@/components/backoffice/konten-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Konten OPD" };

export default async function OpdKontenPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OPD") {
    return <p className="text-sm text-slate-600">Menu ini khusus untuk pengguna OPD.</p>;
  }

  const [artikels, publikasis] = await Promise.all([
    db.artikel.findMany({ where: { opdId: session.opdId }, orderBy: { createdAt: "desc" } }),
    db.publikasi.findMany({ where: { opdId: session.opdId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Newspaper className="h-6 w-6 text-emerald-600" /> Konten OPD
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Penambahan artikel hanya dilakukan oleh Bapperida. Kelola publikasi dan artikel yang sudah ada milik {session.opdNama}. Konten berstatus Published tampil
          pada halaman publik OPD.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <KontenManager
            canCreate
            canCreateArticles={false}
            artikelList={artikels.map((a) => ({
              id: a.id,
              judul: a.judul,
              ringkasan: a.ringkasan,
              isi: a.isi,
              emoji: a.thumbnailEmoji,
              thumbnailUrl: a.thumbnailUrl,
              status: a.status,
              publishedAt: a.publishedAt?.toISOString() ?? null,
              pemilik: session.opdNama ?? "OPD",
              opdId: a.opdId,
              showOnMainPortal: a.showOnMainPortal,
            }))}
            publikasiList={publikasis.map((p) => ({
              id: p.id,
              judul: p.judul,
              deskripsi: p.deskripsi,
              jenisFile: p.jenisFile,
              tahun: p.tahun,
              status: p.status,
              pemilik: session.opdNama ?? "OPD",
              downloads: p.downloadCount,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
