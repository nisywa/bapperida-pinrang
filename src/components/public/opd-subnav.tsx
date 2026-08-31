"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function OpdSubnav({ slug, nama, singkatan }: { slug: string; nama: string; singkatan: string }) {
  const pathname = usePathname();
  const base = `/opd/${slug}`;
  const items = [
    { href: base, label: "Beranda" },
    { href: `${base}/berita`, label: "Berita OPD" },
    { href: `${base}/data`, label: "Data OPD" },
    { href: `${base}/publikasi`, label: "Publikasi" },
  ];
  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  return (
    <nav aria-label={`Navigasi ${nama}`} className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive(it.href)
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-600 hover:text-emerald-700"
            }`}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
