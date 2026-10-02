"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Lock, House, CircleUserRound, Building2, Newspaper, ChartNoAxesCombined, LibraryBig } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/profil", label: "Profil", icon: CircleUserRound },
  { href: "/opd", label: "OPD", icon: Building2 },
  { href: "/berita", label: "Berita", icon: Newspaper },
  { href: "/data", label: "Data & Statistik", icon: ChartNoAxesCombined },
  { href: "/publikasi", label: "Publikasi", icon: LibraryBig },
];

export function PublicNavbar({ siteTitle }: { siteTitle: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/opd") return pathname === "/opd" || (pathname.startsWith("/opd/") && !pathname.includes("/berita") && !pathname.includes("/publikasi") && !pathname.includes("/data"));
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fbfcfa]/95 shadow-[0_8px_28px_-24px_rgba(20,55,44,0.5)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#fbfcfa]/85">
      {/* Government strip */}
      <div className="bg-[#a8cdb4] text-[#294f40]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] font-medium tracking-wide">
          <span className="hidden sm:inline">Pemerintah Kabupaten Pinrang · Sulawesi Selatan</span>
          <span className="sm:hidden">Pemkab Pinrang</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full bg-white/45 px-2.5 py-1 transition-colors hover:bg-white/70 hover:text-[#173c30]">
              <Lock className="h-3 w-3" />
              Login Internal
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-[#d5e3d8]">
            <Image src="/logo-kabupaten-pinrang.png" alt="Lambang Kabupaten Pinrang" width={40} height={45} className="h-full w-auto object-contain" priority />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-[0.08em] text-[#183c33] sm:text-base">BAPPERIDA</span>
            <span className="block truncate text-[10px] leading-tight text-muted-foreground sm:text-xs">Kabupaten Pinrang</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-[#e6eee8] text-[#285b4a] shadow-[inset_0_0_0_1px_rgba(57,103,86,0.08)]"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-[#285b4a]"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#285b4a] shadow-sm lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200/70 bg-[#fbfcfa] px-4 py-3 lg:hidden" aria-label="Navigasi mobile">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                isActive(item.href) ? "bg-[#e6eee8] text-[#285b4a]" : "text-slate-600"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
