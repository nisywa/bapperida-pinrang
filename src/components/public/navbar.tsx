"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Landmark, Lock } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil" },
  { href: "/opd", label: "OPD" },
  { href: "/berita", label: "Berita" },
  { href: "/data", label: "Data & Statistik" },
  { href: "/publikasi", label: "Publikasi" },
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
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      {/* Government strip */}
      <div className="bg-emerald-950 text-emerald-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <span className="hidden sm:inline">Pemerintah Kabupaten Pinrang · Sulawesi Selatan</span>
          <span className="sm:hidden">Pemkab Pinrang</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Lock className="h-3 w-3" />
              Login Internal
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
            <Landmark className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight text-emerald-950 sm:text-base">BAPPERIDA</span>
            <span className="block truncate text-[10px] leading-tight text-muted-foreground sm:text-xs">Kabupaten Pinrang</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white px-4 py-2 lg:hidden" aria-label="Navigasi mobile">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
