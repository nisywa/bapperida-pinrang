import { BackofficeSidebar } from "@/components/backoffice/sidebar";
import { LogoutButton } from "@/components/backoffice/logout-button";
import { MENUS } from "@/lib/menus";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen bg-slate-100">
      <div className="sticky top-0 hidden h-screen lg:flex">
        <BackofficeSidebar role={session.role} nama={session.nama} opdNama={session.opdNama} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm lg:px-8">
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
          <LogoutButton />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
        {/* Navigasi mobile */}
        <nav className="sticky bottom-0 border-t bg-white p-2 lg:hidden" aria-label="Menu backoffice mobile">
          <div className="flex gap-2 overflow-x-auto">
            {mobileItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
