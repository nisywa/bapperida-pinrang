"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OpdIcon } from "@/components/public/opd-icon";

export function OpdLogoInput({ initialUrl, nama, slug }: { initialUrl: string | null; nama: string; slug: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : removed ? null : initialUrl, [file, removed, initialUrl]);
  useEffect(() => {
    if (file && preview) return () => URL.revokeObjectURL(preview);
  }, [file, preview]);
  return <div className="space-y-4">
    <input type="hidden" name="removeLogo" value={removed ? "true" : "false"} />
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-slate-50 p-5">
      <OpdIcon name={nama} logoUrl={preview} className="h-32 w-32" />
      <p className="text-sm text-slate-500">{preview ? "Logo dinas" : "Belum upload gambar logo"}</p>
    </div>
    <label htmlFor="opd-logo" className="block text-sm font-medium">Upload logo dinas</label>
    <input ref={input} id="opd-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="logo-help" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700" onChange={event => {
      const selected = event.target.files?.[0]; setError("");
      if (!selected) { setFile(null); return; }
      if (!["image/png", "image/jpeg", "image/webp"].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
        setError("Pilih PNG, JPG, atau WebP dengan ukuran maksimal 2 MB."); event.target.value = ""; setFile(null); return;
      }
      setRemoved(false); setFile(selected);
    }} />
    <p id="logo-help" className="text-xs text-slate-500">PNG, JPG, atau WebP, maksimal 2 MB. Logo tersimpan setelah klik Simpan Profil.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {preview && <button type="button" className="text-sm text-red-600 underline" onClick={() => { setRemoved(true); setFile(null); setError(""); if (input.current) input.current.value = ""; }}>Gunakan logo default</button>}
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 p-5 text-white">
      <p className="text-xs text-emerald-300">Pratinjau Header</p>
      <div className="mt-3 flex items-center gap-3"><OpdIcon name={nama} logoUrl={preview} /><div className="min-w-0"><p className="truncate text-sm font-bold">{nama}</p><p className="truncate text-xs text-emerald-300">/opd/{slug}</p></div></div>
    </div>
  </div>;
}
