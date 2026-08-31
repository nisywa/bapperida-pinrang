"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";
import { MENUS } from "@/lib/menus";

export function BackofficeSidebar({
  role,
  nama,
  opdNama,
}: {
  role: string;
  nama: string;
  opdNama?: string | null;
}) {
  const pathname = usePathname();
  const items = MENUS[role] ?? MENUS.OPD;
  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-emerald-950 text-emerald-100">
      <Link href="/" className="flex items-center gap-3 border-b border-emerald-900 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800">
          <Landmark className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">BAPPERIDA</p>
          <p className="truncate text-[10px] text-emerald-400">Kabupaten Pinrang</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu backoffice">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
              {g}
            </p>
            <ul className="space-y-0.5">
              {items.filter((i) => i.group === g).map((item) => {
                const active =
                  item.href === "/backoffice" ? pathname === "/backoffice" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-emerald-700/80 font-medium text-white"
                          : "text-emerald-200/85 hover:bg-emerald-900/70 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-emerald-900 px-5 py-4">
        <p className="truncate text-sm font-medium text-white">{nama}</p>
        <p className="truncate text-xs text-emerald-400">
          {role === "OPD" ? opdNama : role === "ADMIN" ? "Administrator Sistem" : "Pengelola Bapperida"}
        </p>
      </div>
    </aside>
  );
}
