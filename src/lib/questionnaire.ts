export const QUESTION_TYPES = {
  RADIO: "Radio button (satu pilihan)", CHECKBOX: "Checkbox (banyak pilihan)",
  NUMBER: "Angka", TEXT: "Teks", DROPDOWN: "Dropdown (satu pilihan)",
} as const;
export type QuestionType = keyof typeof QUESTION_TYPES;
export function dateInputValue(date: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}
export const CHOICE_TYPES = ["RADIO", "CHECKBOX", "DROPDOWN", "OPTIONS"];

export function parseOptions(text: string): string[] {
  const options = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (options.length < 2 || options.length > 50) throw new Error("Isi 2–50 pilihan jawaban, satu pilihan per baris.");
  if (options.some(value => value.length > 200)) throw new Error("Setiap pilihan maksimal 200 karakter.");
  if (new Set(options).size !== options.length) throw new Error("Pilihan jawaban tidak boleh sama.");
  return options;
}

export function parseDateBoundary(value: string, end = false): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Tanggal tidak valid.");
  const check = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== value) throw new Error("Tanggal tidak valid.");
  return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}+08:00`);
}

export function fillingError(assignment: {
  status: string; deadline: Date | null;
  periode: { status: string; startDate: Date; endDate: Date; lockAt: Date | null };
}, now = new Date()): string | null {
  if (assignment.status !== "AKTIF") return "Penugasan ini sedang dinonaktifkan oleh Bapperida.";
  if (assignment.periode.status !== "AKTIF" || assignment.periode.lockAt) return "Periode pengisian sudah ditutup.";
  if (now < assignment.periode.startDate) return "Periode pengisian belum dimulai.";
  if (now > assignment.periode.endDate) return "Periode pengisian sudah berakhir.";
  if (assignment.deadline && now > assignment.deadline) return "Tenggat pengisian penugasan sudah berakhir.";
  return null;
}

export function checkboxValues(text: string | null | undefined): string[] {
  try {
    const values: unknown = JSON.parse(text || "[]");
    return Array.isArray(values) && values.every(value => typeof value === "string") ? values : [];
  } catch { return []; }
}

export type AnswerValue = {
  valueText?: string | null; valueNumber?: number | null;
  valueBoolean?: boolean | null; valueDate?: string | null;
};
export function normalizeAnswer(question: { tipeJawaban: string; opsi: { label: string }[] }, value: AnswerValue) {
  const result = { valueText: null as string | null, valueNumber: null as number | null, valueBoolean: null as boolean | null, valueDate: null as Date | null };
  if (question.tipeJawaban === "NUMBER") {
    if (value.valueNumber != null && !Number.isFinite(value.valueNumber)) throw new Error("Jawaban angka harus berupa angka yang valid.");
    result.valueNumber = value.valueNumber ?? null;
  } else if (question.tipeJawaban === "BOOLEAN") result.valueBoolean = typeof value.valueBoolean === "boolean" ? value.valueBoolean : null;
  else if (question.tipeJawaban === "DATE") {
    if (value.valueDate) {
      parseDateBoundary(value.valueDate); // Validate the calendar date; legacy answers store dates at UTC midnight.
      result.valueDate = new Date(`${value.valueDate}T00:00:00Z`);
    }
  } else if (question.tipeJawaban === "CHECKBOX") {
    if (value.valueText) {
      let selected: unknown;
      try { selected = JSON.parse(value.valueText); } catch { throw new Error("Jawaban checkbox tidak valid."); }
      if (!Array.isArray(selected) || selected.some(item => typeof item !== "string" || !question.opsi.some(option => option.label === item))) throw new Error("Pilihan checkbox tidak sesuai dengan pertanyaan.");
      if (selected.length) result.valueText = JSON.stringify([...new Set(selected)]);
    }
  } else {
    const text = value.valueText?.trim() || null;
    if (text && CHOICE_TYPES.includes(question.tipeJawaban) && !question.opsi.some(option => option.label === text)) throw new Error("Pilihan jawaban tidak sesuai dengan pertanyaan.");
    if (text && text.length > 10000) throw new Error("Jawaban teks maksimal 10.000 karakter.");
    result.valueText = text;
  }
  return result;
}

export function hasAnswer(detail: { valueText: string | null; valueNumber: number | null; valueDate: Date | null; valueBoolean: boolean | null }) {
  return (detail.valueText !== null && detail.valueText.trim() !== "" && detail.valueText !== "[]") || detail.valueNumber !== null || detail.valueDate !== null || detail.valueBoolean !== null;
}

export function displayAnswerText(text: string | null, type: string) {
  return type === "CHECKBOX" ? checkboxValues(text).join(", ") : text;
}
