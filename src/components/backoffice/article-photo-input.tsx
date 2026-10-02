"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ArticlePhotoInput({ id, initialUrl }: { id: string; initialUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    const form = inputRef.current?.form;
    const reset = () => setPreview(null);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  const url = preview ?? initialUrl;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Foto Artikel</Label>
      {url && <Image src={url} alt="Pratinjau foto artikel" width={320} height={180} unoptimized className="h-36 w-full rounded-lg border object-cover" />}
      <Input ref={inputRef} id={id} name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : null)} />
      <p className="text-xs text-slate-500">JPG, PNG, atau WebP, maksimal 5 MB. Foto digunakan sebagai gambar artikel. {initialUrl && "Kosongkan untuk mempertahankan foto saat ini."}</p>
    </div>
  );
}
