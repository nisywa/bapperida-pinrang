export const ANALYTICS_TIME_ZONE = "Asia/Makassar";
export type VisitGranularity = "day" | "month" | "year";

export function localDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function defaultVisitRange() {
  const end = localDate();
  const start = new Date(`${end}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start: start.toISOString().slice(0, 10), end };
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01" || value > "2100-12-31") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseVisitRange(params: URLSearchParams) {
  const defaults = defaultVisitRange();
  const start = params.get("start") ?? defaults.start;
  const end = params.get("end") ?? defaults.end;
  const granularity = params.get("granularity") ?? "day";
  if (!validDate(start) || !validDate(end)) throw new Error("Tanggal periode tidak valid.");
  if (start > end) throw new Error("Tanggal awal harus sebelum atau sama dengan tanggal akhir.");
  if (granularity !== "day" && granularity !== "month" && granularity !== "year") {
    throw new Error("Pengelompokan grafik tidak valid.");
  }
  const from = new Date(`${start}T00:00:00+08:00`);
  const until = new Date(`${end}T00:00:00+08:00`);
  until.setUTCDate(until.getUTCDate() + 1);
  if (granularity === "day" && (until.getTime() - from.getTime()) / 86400000 > 366) {
    throw new Error("Grafik harian maksimal 366 hari. Pilih bulanan atau tahunan untuk rentang lebih panjang.");
  }
  return { start, end, granularity, from, until };
}

export function visitBuckets(start: string, end: string, granularity: VisitGranularity) {
  const cursor = new Date(`${start}T00:00:00Z`);
  if (granularity !== "day") cursor.setUTCDate(1);
  if (granularity === "year") cursor.setUTCMonth(0);
  const keys: string[] = [];
  while (cursor.toISOString().slice(0, 10) <= end) {
    keys.push(cursor.toISOString().slice(0, granularity === "day" ? 10 : granularity === "month" ? 7 : 4));
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (granularity === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
  }
  return keys;
}

export type VisitorAnalytics = {
  start: string;
  end: string;
  granularity: VisitGranularity;
  visits: number;
  visitors: number;
  allTimeVisits: number;
  series: { period: string; visits: number; visitors: number }[];
};
