import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { KontenManager } from "@/components/backoffice/konten-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Konten Portal" };

export default async function KontenPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const [artikels, publikasis] = await Promise.all([
    db.artikel.findMany({ include: { opd: true }, orderBy: { createdAt: "desc" } }),
    db.publikasi.findMany({ include: { opd: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Newspaper className="h-6 w-6 text-emerald-600" /> Konten Portal
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola artikel dan publikasi portal utama. Artikel baru hanya dapat ditambahkan Bapperida. Klik Terbitkan agar informasi dapat dilihat masyarakat.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <KontenManager
            canCreate
            canCreateArticles={session.role === "BAPPERIDA"}
            artikelList={artikels.map((a) => ({
              id: a.id,
              judul: a.judul,
              ringkasan: a.ringkasan,
              isi: a.isi,
              emoji: a.thumbnailEmoji,
              thumbnailUrl: a.thumbnailUrl,
              status: a.status,
              publishedAt: a.publishedAt?.toISOString() ?? null,
              pemilik: a.opd?.nama ?? "Bapperida",
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
              pemilik: p.opd?.nama ?? "Bapperida",
              downloads: p.downloadCount,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
