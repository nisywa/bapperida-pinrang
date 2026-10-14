"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

let memoryVisitorId: string | undefined;
function visitorId() {
  try {
    const stored = localStorage.getItem("website-visitor-id");
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("website-visitor-id", id);
    return id;
  } catch {
    return memoryVisitorId ??= crypto.randomUUID();
  }
}

export function VisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Layout persists across navigation. Ignore effect replays, count actual page changes.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const body = JSON.stringify({ id: crypto.randomUUID(), visitorId: visitorId(), pathname });
    async function record() {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch("/api/public/pengunjung", {
            method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
          });
          if (response.ok) {
            window.dispatchEvent(new Event("website-visit-recorded"));
            return;
          }
          if (response.status < 500) return;
        } catch { /* Retry the same ID without counting twice. */ }
      }
    }
    void record();
  }, [pathname]);

  return null;
}
