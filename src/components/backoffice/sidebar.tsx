"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
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
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#c7dacb] bg-[#dceade] text-[#355548]">
      <Link href="/" className="flex items-center gap-3 border-b border-[#c7dacb] px-5 py-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-white">
          <Image src="/logo-kabupaten-pinrang.png" alt="Lambang Kabupaten Pinrang" width={38} height={43} className="h-full w-auto object-contain" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-[0.08em] text-[#24483a]">BAPPERIDA</p>
          <p className="truncate text-[10px] text-[#668676]">Kabupaten Pinrang</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Menu backoffice">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#668676]">
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
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                        active
                          ? "bg-white/85 font-semibold text-[#204b3d] shadow-[0_8px_18px_-14px_rgba(45,87,68,0.45)]"
                          : "text-[#4e6e5f] hover:bg-white/45 hover:text-[#173c30]"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#4f8169]" : "text-[#71927f]"}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#c7dacb] p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 p-3 ring-1 ring-white/80">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#56816c]"><ShieldCheck className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#24483a]">{nama}</p>
            <p className="truncate text-[11px] text-[#668676]">
              {role === "OPD" ? opdNama : role === "ADMIN" ? "Administrator Sistem" : "Pengelola Bapperida"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
