"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/admin";

export function useAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<ActionResult>, successMsg?: string) => {
    setLoading(true);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg ?? res.message ?? "Berhasil.");
        router.refresh();
        return res;
      }
      toast.error(res.error ?? "Terjadi kesalahan.");
      return res;
    } catch {
      toast.error("Terjadi kesalahan tak terduga.");
      return { ok: false } as ActionResult;
    } finally {
      setLoading(false);
    }
  };

  const runForm = async (fn: (fd: FormData) => Promise<ActionResult>, fd: FormData, successMsg?: string) => {
    setLoading(true);
    try {
      const res = await fn(fd);
      if (res.ok) {
        toast.success(successMsg ?? res.message ?? "Berhasil.");
        router.refresh();
        return res;
      }
      toast.error(res.error ?? "Terjadi kesalahan.");
      return res;
    } catch {
      toast.error("Terjadi kesalahan tak terduga.");
      return { ok: false } as ActionResult;
    } finally {
      setLoading(false);
    }
  };

  return { run, runForm, loading };
}
