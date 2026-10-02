import { redirect } from "next/navigation";
import { BellRing } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationInbox } from "@/components/backoffice/notification-inbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifikasi Saya" };

export default async function NotifikasiSayaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const recipients = await db.notifikasiPenerima.findMany({
    where: { userId: session.id },
    include: { notifikasi: true },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  const items = recipients.map((recipient) => ({
    id: recipient.id,
    readAt: recipient.readAt?.toISOString() ?? null,
    sentAt: recipient.sentAt.toISOString(),
    type: recipient.notifikasi.type,
    title: recipient.notifikasi.title,
    message: recipient.notifikasi.message,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BellRing className="h-6 w-6 text-emerald-600" /> Notifikasi Saya
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Penugasan, pengingat tenggat, pengiriman data, dan hasil verifikasi untuk akun Anda.
        </p>
      </header>
      <NotificationInbox items={items} />
    </div>
  );
}

