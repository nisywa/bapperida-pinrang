import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session || session.role === "OPD") {
    return <p className="text-sm text-slate-600">Akses ditolak.</p>;
  }

  const logs = await db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const actionColor: Record<string, string> = {
    LOGIN: "bg-cyan-50 text-cyan-700",
    LOGOUT: "bg-slate-100 text-slate-600",
    CREATE: "bg-emerald-50 text-emerald-700",
    UPDATE: "bg-amber-50 text-amber-700",
    DELETE: "bg-rose-50 text-rose-700",
    VERIFY: "bg-teal-50 text-teal-700",
    PUBLISH: "bg-lime-50 text-lime-700",
    UNPUBLISH: "bg-orange-50 text-orange-700",
    SUBMIT: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <ScrollText className="h-6 w-6 text-emerald-600" /> Audit Log
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Jejak aktivitas sistem — append-only. Mencatat actor, peran, cakupan OPD, aksi, entitas,
          dan waktu untuk setiap aksi penting (100 terakhir).
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Aktivitas</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Scope</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {l.createdAt.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={actionColor[l.action] ?? ""}>
                        {l.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{l.detail}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{l.entityType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{l.actorNama}</p>
                      <p className="text-xs text-slate-400">{l.actingRole}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.opdScopeNama ?? "—"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Belum ada aktivitas tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
