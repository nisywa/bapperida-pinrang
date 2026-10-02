import { BackofficeSidebar } from "@/components/backoffice/sidebar";
import { LogoutButton } from "@/components/backoffice/logout-button";
import { MENUS } from "@/lib/menus";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const mobileItems = MENUS[session.role] ?? [];

  return (
    <div className="flex min-h-screen bg-[#f3f6f3]">
      <div className="sticky top-0 hidden h-screen lg:flex">
        <BackofficeSidebar role={session.role} nama={session.nama} opdNama={session.opdNama} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/85 px-4 py-3.5 shadow-[0_8px_28px_-26px_rgba(25,60,48,0.6)] backdrop-blur-xl lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8efe9] p-1.5 lg:hidden"><Image src="/logo-kabupaten-pinrang.png" alt="Lambang Kabupaten Pinrang" width={32} height={36} className="h-full w-auto object-contain" /></span>
            <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              Backoffice {session.role === "OPD" ? session.opdNama : "Bapperida Kabupaten Pinrang"}
            </p>
            <p className="text-xs text-slate-500">
              {session.role === "ADMIN"
                ? "Administrator"
                : session.role === "BAPPERIDA"
                  ? "Pengelola Bapperida"
                  : `Operator ${session.opdNama ?? "OPD"}`}{" "}
              · {session.email}
            </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/backoffice/notifikasi" aria-label="Notifikasi" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-[#edf3ee] hover:text-[#376653]"><Bell className="h-4 w-4" /></a>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 bg-[radial-gradient(circle_at_90%_0%,rgba(212,226,216,0.55),transparent_28rem)] p-4 lg:p-8">{children}</main>
        {/* Navigasi mobile */}
        <nav className="sticky bottom-0 z-40 border-t border-slate-200/70 bg-white/90 p-2.5 backdrop-blur-xl lg:hidden" aria-label="Menu backoffice mobile">
          <div className="flex gap-2 overflow-x-auto">
            {mobileItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#edf2ee] px-3 py-2 text-xs font-semibold text-[#365e4e]"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
