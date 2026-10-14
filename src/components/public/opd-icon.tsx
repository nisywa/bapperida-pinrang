"use client";

import { cn } from "@/lib/utils";

export function OpdIcon({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  return <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200", className)}>
    <img src={logoUrl || "/opd-logo-default.svg"} alt={logoUrl ? `Logo ${name}` : `${name}: belum upload logo`} className="h-full w-full object-contain" onError={event => { if (!event.currentTarget.src.endsWith('/opd-logo-default.svg')) event.currentTarget.src = '/opd-logo-default.svg'; }} />
  </span>;
}
