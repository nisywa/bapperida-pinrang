// Konstanta status & label - sesuai Dokumen Desain Sistem

export const JAWABAN_STATUS = {
  DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  DIKIRIM: { label: "Dikirim", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  PERLU_PERBAIKAN: { label: "Perlu Perbaikan", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  TERVERIFIKASI: { label: "Terverifikasi", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
} as const;

export type JawabanStatus = keyof typeof JAWABAN_STATUS;

export const TIPE_JAWABAN = {
  RADIO: "Radio button",
  CHECKBOX: "Checkbox",
  DROPDOWN: "Dropdown",
  TEXT: "Teks",
  NUMBER: "Angka",
  DATE: "Tanggal",
  BOOLEAN: "Ya/Tidak",
  OPTIONS: "Pilihan",
  FILE: "Berkas",
} as const;

export const PALETTES: Record<string, string[]> = {
  emerald: ["#ecfdf5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46"],
  amber: ["#fffbeb", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
  cyan: ["#ecfeff", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75"],
  teal: ["#f0fdfa", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59"],
  rose: ["#fff1f2", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239"],
  lime: ["#f7fee7", "#d9f99d", "#bef264", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212"],
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  BAPPERIDA: "Bapperida",
  OPD: "OPD",
  MASYARAKAT: "Masyarakat (Portal Publik)",
};

export function formatTanggal(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatNumber(n: number | null | undefined, decimal = 0): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("id-ID", { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
}
