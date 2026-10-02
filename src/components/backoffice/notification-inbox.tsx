"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { tandaiNotifikasiDibaca } from "@/lib/actions/opd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InboxItem = {
  id: string;
  readAt: string | null;
  sentAt: string;
  type: string;
  title: string;
  message: string;
};

export function NotificationInbox({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(id?: string) {
    setLoading(id ?? "all");
    const result = await tandaiNotifikasiDibaca(id);
    setLoading(null);
    if (!result.ok) return toast.error(result.error ?? "Gagal memperbarui notifikasi.");
    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {unread > 0 ? `${unread} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}
        </p>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markRead()} disabled={loading !== null}>
            {loading === "all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-4 ${item.readAt ? "bg-white" : "border-emerald-200 bg-emerald-50/50"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Bell className={`h-4 w-4 ${item.readAt ? "text-slate-400" : "text-emerald-600"}`} />
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                  {!item.readAt && <Badge className="bg-emerald-600 text-[10px]">Baru</Badge>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(item.sentAt).toLocaleString("id-ID")}
                </p>
              </div>
              {!item.readAt && (
                <Button variant="ghost" size="sm" onClick={() => markRead(item.id)} disabled={loading !== null}>
                  {loading === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sudah dibaca
                </Button>
              )}
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">
            Belum ada notifikasi untuk akun Anda.
          </div>
        )}
      </div>
    </div>
  );
}

