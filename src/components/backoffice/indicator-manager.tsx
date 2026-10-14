"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { saveIndikator, saveAspek, savePertanyaan, deletePertanyaan, deleteAspek } from "@/lib/actions/questionnaire";
import { QUESTION_TYPES, CHOICE_TYPES } from "@/lib/questionnaire";
import { TIPE_JAWABAN } from "@/lib/constants";

type Question = { id: string; kode: string; pertanyaan: string; tipeJawaban: string; wajibDefault: boolean; dimensiWilayah: boolean; satuan: string; helpText: string; opsi: string[]; hasAnswers: boolean };
type Aspect = { id: string; nama: string; deskripsi: string; pertanyaan: Question[] };
type Indicator = { id: string; kode: string; nama: string; deskripsi: string; satuan: string; isActive: boolean; aspek: Aspect[] };
type Editor = { kind: "indicator"; item?: Indicator } | { kind: "aspect"; parentId: string; item?: Aspect } | { kind: "question"; parentId: string; item?: Question };

export function IndicatorManager({ indicators }: { indicators: Indicator[] }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "question" | "aspect"; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = indicators.filter(i => `${i.kode} ${i.nama} ${i.aspek.map(a => `${a.nama} ${a.pertanyaan.map(q => `${q.kode} ${q.pertanyaan}`).join(" ")}`).join(" ")}`.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID")));

  return <div className="space-y-5">
    <div className="flex flex-wrap gap-3"><Input aria-label="Cari indikator, aspek, atau pertanyaan" placeholder="Cari indikator, aspek, atau pertanyaan…" className="max-w-md bg-white" value={search} onChange={event => setSearch(event.target.value)} /><Button onClick={() => setEditor({ kind: "indicator" })}><Plus className="mr-2 h-4 w-4" />Tambah indikator</Button></div>
    {filtered.map(i => <section key={i.id} className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-emerald-700">{i.kode} · {i.isActive ? "Aktif" : "Nonaktif"}</p><h2 className="mt-1 text-lg font-bold">{i.nama}</h2><p className="mt-1 text-sm text-slate-500">{i.aspek.length} aspek · {i.aspek.reduce((total, a) => total + a.pertanyaan.length, 0)} pertanyaan aktif</p>{i.deskripsi && <p className="mt-2 text-sm text-slate-600">{i.deskripsi}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditor({ kind: "indicator", item: i })}><Pencil className="mr-2 h-4 w-4" />Edit indikator</Button><Button size="sm" onClick={() => setEditor({ kind: "aspect", parentId: i.id })}><Plus className="mr-2 h-4 w-4" />Tambah aspek</Button></div></div>
      <div className="mt-5 space-y-3">{i.aspek.map(a => <details key={a.id} open className="rounded-xl border bg-slate-50/50 p-4">
        <summary className="cursor-pointer font-semibold text-slate-800">{a.nama} <span className="text-xs font-normal text-slate-500">({a.pertanyaan.length} pertanyaan)</span></summary>
        {a.deskripsi && <p className="mt-2 text-sm text-slate-500">{a.deskripsi}</p>}
        <div className="my-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditor({ kind: "aspect", parentId: i.id, item: a })}>Edit aspek</Button><Button size="sm" variant="outline" onClick={() => setDeleting({ kind: "aspect", id: a.id })}>Hapus aspek</Button><Button size="sm" onClick={() => setEditor({ kind: "question", parentId: a.id })}><Plus className="mr-2 h-4 w-4" />Tambah pertanyaan</Button></div>
        <div className="space-y-3">{a.pertanyaan.map((q, index) => <article key={q.id} className="rounded-lg border bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-slate-500">{q.kode} · {TIPE_JAWABAN[q.tipeJawaban as keyof typeof TIPE_JAWABAN] ?? q.tipeJawaban} · {q.wajibDefault ? "Wajib" : "Opsional"}{q.dimensiWilayah ? " · Per kecamatan" : ""}</p><h3 className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{index + 1}. {q.pertanyaan}</h3></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label={`Edit pertanyaan ${q.kode}`} onClick={() => setEditor({ kind: "question", parentId: a.id, item: q })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600" aria-label={`Hapus pertanyaan ${q.kode}`} onClick={() => setDeleting({ kind: "question", id: q.id })}><Trash2 className="h-4 w-4" /></Button></div></div>
          {q.helpText && <p className="mt-2 text-xs text-slate-500">{q.helpText}</p>}
          <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Pratinjau jawaban</p>
            {q.tipeJawaban === "RADIO" || q.tipeJawaban === "CHECKBOX" ? <div className="flex flex-wrap gap-4">{q.opsi.map(option => <label key={option} className="flex items-center gap-2 text-sm text-slate-600"><input disabled type={q.tipeJawaban === "RADIO" ? "radio" : "checkbox"} name={`preview-${q.id}`} />{option}</label>)}</div>
              : q.tipeJawaban === "DROPDOWN" || q.tipeJawaban === "OPTIONS" ? <select disabled aria-label={`Pratinjau ${q.kode}`} className="h-9 w-full max-w-sm rounded border bg-white px-2 text-sm"><option>Pilih jawaban</option>{q.opsi.map(option => <option key={option}>{option}</option>)}</select>
              : <Input disabled aria-label={`Pratinjau ${q.kode}`} placeholder={q.tipeJawaban === "NUMBER" ? `Masukkan angka${q.satuan ? ` (${q.satuan})` : ""}` : "Jawaban OPD"} className="max-w-sm bg-white" />}
          </div>
        </article>)}</div>
        {!a.pertanyaan.length && <p className="text-sm text-slate-500">Belum ada pertanyaan aktif. Tambahkan pertanyaan untuk aspek ini.</p>}
      </details>)}</div>
      {!i.aspek.length && <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada aspek. Tambahkan aspek, lalu buat pertanyaannya.</p>}
    </section>)}
    {!filtered.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-500">{indicators.length ? "Tidak ada hasil pencarian." : "Belum ada indikator. Mulai dengan menambahkan indikator."}</p>}
    <Dialog open={!!editor} onOpenChange={open => { if (!open && !busy) setEditor(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editor?.item ? "Edit" : "Tambah"} {editor?.kind === "indicator" ? "indikator" : editor?.kind === "aspect" ? "aspek" : "pertanyaan"}</DialogTitle></DialogHeader>{editor && <EditorForm key={`${editor.kind}-${editor.item?.id ?? "new"}`} editor={editor} busy={busy} onSubmit={async form => {
      setBusy(true);
      try {
        const action = editor.kind === "indicator" ? saveIndikator : editor.kind === "aspect" ? saveAspek : savePertanyaan;
        const result = await action(form);
        if (result.ok) { toast.success(result.message); setEditor(null); router.refresh(); } else toast.error(result.error);
      } catch { toast.error("Penyimpanan gagal. Silakan coba lagi."); } finally { setBusy(false); }
    }} />}</DialogContent></Dialog>
    <AlertDialog open={!!deleting} onOpenChange={open => { if (!open && !busy) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus {deleting?.kind === "question" ? "pertanyaan" : "aspek"}?</AlertDialogTitle><AlertDialogDescription>{deleting?.kind === "question" ? "Pertanyaan akan dihapus dari pengisian aktif. Riwayat jawaban yang sudah dikirim tetap tersimpan." : "Aspek hanya dapat dihapus setelah seluruh pertanyaannya dihapus dan tidak memiliki riwayat jawaban."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={async event => {
      event.preventDefault(); if (!deleting) return; setBusy(true);
      try { const result = await (deleting.kind === "question" ? deletePertanyaan : deleteAspek)(deleting.id); if (result.ok) { toast.success(result.message); setDeleting(null); router.refresh(); } else toast.error(result.error); } catch { toast.error("Penghapusan gagal."); } finally { setBusy(false); }
    }}>{busy ? "Menghapus…" : "Hapus"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function EditorForm({ editor, busy, onSubmit }: { editor: Editor; busy: boolean; onSubmit: (form: FormData) => Promise<void> }) {
  const q = editor.kind === "question" ? editor.item : undefined;
  const [type, setType] = useState(q?.tipeJawaban ?? "TEXT");
  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }}>
    <input type="hidden" name="id" value={editor.item?.id ?? ""} />
    {editor.kind !== "indicator" && <input type="hidden" name={editor.kind === "aspect" ? "indikatorId" : "aspekId"} value={editor.parentId} />}
    {editor.kind !== "aspect" && <label className="block space-y-2 text-sm font-medium">Kode<Input name="kode" required maxLength={60} defaultValue={editor.item && "kode" in editor.item ? editor.item.kode : ""} placeholder={editor.kind === "indicator" ? "IND-01" : "IND-01-Q01"} /><span className="block text-xs font-normal text-slate-500">Kode harus unik di seluruh sistem.</span></label>}
    {editor.kind === "question" ? <>
      <label className="block space-y-2 text-sm font-medium">Pertanyaan<Textarea name="pertanyaan" required maxLength={2000} defaultValue={q?.pertanyaan} /></label>
      <label className="block space-y-2 text-sm font-medium">Tipe jawaban<select name="tipeJawaban" value={type} onChange={event => setType(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3">{Object.entries(QUESTION_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}{q && !(q.tipeJawaban in QUESTION_TYPES) && <option value={q.tipeJawaban}>{TIPE_JAWABAN[q.tipeJawaban as keyof typeof TIPE_JAWABAN]} (format lama)</option>}</select></label>
      {CHOICE_TYPES.includes(type) && <label className="block space-y-2 text-sm font-medium">Pilihan jawaban<Textarea name="opsi" required rows={5} defaultValue={q?.opsi.join("\n")} placeholder={"Pilihan pertama\nPilihan kedua"} /><span className="block text-xs font-normal text-slate-500">Satu pilihan per baris, minimal 2 pilihan.</span></label>}
      <label className="block space-y-2 text-sm font-medium">Petunjuk pengisian<Textarea name="helpText" maxLength={2000} defaultValue={q?.helpText} /></label>
      <label className="block space-y-2 text-sm font-medium">Satuan (opsional)<Input name="satuan" maxLength={100} defaultValue={q?.satuan} placeholder="Orang, persen, unit…" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="wajibDefault" defaultChecked={q?.wajibDefault ?? true} />Wajib diisi</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="dimensiWilayah" defaultChecked={q?.dimensiWilayah ?? false} />Jawaban per kecamatan</label>
      {q?.hasAnswers && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Pertanyaan ini sudah memiliki jawaban. Teks dan petunjuk dapat diedit. Untuk mengubah tipe, pilihan, atau dimensi wilayah, buat pertanyaan baru.</p>}
    </> : <>
      <label className="block space-y-2 text-sm font-medium">Nama {editor.kind === "indicator" ? "indikator" : "aspek"}<Input name="nama" required maxLength={300} defaultValue={editor.item?.nama} /></label>
      <label className="block space-y-2 text-sm font-medium">Deskripsi<Textarea name="deskripsi" maxLength={2000} defaultValue={editor.item?.deskripsi} /></label>
      {editor.kind === "indicator" && <><label className="block space-y-2 text-sm font-medium">Satuan default<Input name="satuan" maxLength={100} defaultValue={editor.item?.satuan} /></label><label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={editor.item?.isActive ?? true} />Indikator aktif</label></>}
    </>}
    <Button className="w-full" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
  </form>;
}
