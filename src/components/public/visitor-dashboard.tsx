"use client";

import { useEffect, useState } from "react";
import { Activity, Eye, RefreshCw, UsersRound } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultVisitRange, type VisitorAnalytics, type VisitGranularity } from "@/lib/visitor-analytics";

const number = new Intl.NumberFormat("id-ID");
function periodLabel(value: string) {
  if (value.length === 4) return value;
  return new Date(`${value.length === 7 ? `${value}-01` : value}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC", ...(value.length === 10 ? { day: "numeric" as const } : {}), month: "short", year: "numeric",
  });
}

export function VisitorDashboard() {
  const [filters, setFilters] = useState(() => ({ ...defaultVisitRange(), granularity: "day" as VisitGranularity }));
  const [applied, setApplied] = useState(filters);
  const [data, setData] = useState<VisitorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/public/pengunjung?${new URLSearchParams(applied)}`, {
          signal: controller.signal, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Statistik belum dapat dimuat.");
        if (!controller.signal.aborted) setData(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Statistik belum dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [applied, revision]);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("website-visit-recorded", refresh);
    return () => window.removeEventListener("website-visit-recorded", refresh);
  }, []);

  return <div className="space-y-6">
    <form className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" onSubmit={event => {
      event.preventDefault();
      setApplied({ ...filters });
    }}>
      <h2 className="mb-4 text-lg font-semibold text-[#24483a]">Filter periode kunjungan</h2>
      <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2 text-sm font-medium text-slate-700">Tren grafik
          <select className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={filters.granularity} onChange={event => setFilters({ ...filters, granularity: event.target.value as VisitGranularity })}>
            <option value="day">Harian</option><option value="month">Bulanan</option><option value="year">Tahunan</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">Tanggal awal
          <Input className="mt-2" type="date" required min="2000-01-01" max={filters.end || "2100-12-31"} value={filters.start} onChange={event => setFilters({ ...filters, start: event.target.value })} />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">Tanggal akhir
          <Input className="mt-2" type="date" required min={filters.start || "2000-01-01"} max="2100-12-31" value={filters.end} onChange={event => setFilters({ ...filters, end: event.target.value })} />
        </label>
        <Button type="submit" className="h-10 bg-[#285b4a] hover:bg-[#1e4739]" disabled={loading}>Terapkan filter</Button>
      </div>
      <p className="mt-4 text-xs text-slate-500">Waktu Indonesia Tengah (WITA). Tanggal awal dan akhir termasuk dalam perhitungan. Grafik harian maksimal 366 hari.</p>
    </form>

    <div aria-live="polite" aria-busy={loading}>
      {loading ? <div className="rounded-2xl border bg-white p-12 text-center text-slate-500" role="status">Memuat statistik pengunjung…</div>
        : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => setRevision(value => value + 1)}>Coba lagi</Button></div>
        : data && <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Periode: <strong className="text-[#24483a]">{periodLabel(data.start)} – {periodLabel(data.end)}</strong> · {data.granularity === "day" ? "Harian" : data.granularity === "month" ? "Bulanan" : "Tahunan"}</p>
            <Button variant="outline" size="sm" onClick={() => setRevision(value => value + 1)}><RefreshCw className="mr-2 h-4 w-4" />Perbarui data</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Kunjungan dalam periode", value: data.visits, icon: Eye, detail: "Jumlah halaman yang dibuka" },
              { title: "Pengunjung unik dalam periode", value: data.visitors, icon: UsersRound, detail: "Browser berbeda dalam rentang terpilih" },
              { title: "Total kunjungan keseluruhan", value: data.allTimeVisits, icon: Activity, detail: "Sejak pencatatan diaktifkan" },
            ].map(card => <div key={card.title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <card.icon className="mb-4 h-5 w-5 text-emerald-700" /><p className="text-sm text-slate-600">{card.title}</p>
              <p className="mt-2 text-3xl font-bold text-[#24483a]">{number.format(card.value)}</p><p className="mt-2 text-xs text-slate-500">{card.detail}</p>
            </div>)}
          </div>
          <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" aria-label="Grafik tren pengunjung">
            <h2 className="text-lg font-semibold text-[#24483a]">Tren kunjungan website</h2>
            <p className="mt-1 text-sm text-slate-500">Jumlah kunjungan dan pengunjung unik per {data.granularity === "day" ? "hari" : data.granularity === "month" ? "bulan" : "tahun"}.</p>
            {data.visits === 0 && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Belum ada kunjungan pada periode ini.</p>}
            <div className="mt-6 h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series} margin={{ top: 10, right: 15, bottom: 15, left: 0 }} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="period" tickFormatter={periodLabel} minTickGap={35} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={50} tickFormatter={value => number.format(value)} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                  <Tooltip labelFormatter={value => periodLabel(String(value))} formatter={(value: number) => number.format(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="visits" name="Kunjungan" stroke="#285b4a" strokeWidth={3} dot={data.series.length <= 31} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="visitors" name="Pengunjung unik" stroke="#d39736" strokeWidth={2} strokeDasharray="5 4" dot={data.series.length <= 31} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <details className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <summary className="cursor-pointer font-semibold text-[#24483a]">Lihat rincian jumlah per periode</summary>
            <div className="mt-4 max-h-96 overflow-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Rincian kunjungan periode {data.start} sampai {data.end}</caption><thead className="sticky top-0 bg-slate-50"><tr><th className="p-3">Periode</th><th className="p-3 text-right">Kunjungan</th><th className="p-3 text-right">Pengunjung unik</th></tr></thead><tbody>{data.series.map(row => <tr key={row.period} className="border-t"><td className="p-3">{periodLabel(row.period)}</td><td className="p-3 text-right">{number.format(row.visits)}</td><td className="p-3 text-right">{number.format(row.visitors)}</td></tr>)}</tbody></table></div>
          </details>
        </div>}
    </div>
    <p className="text-xs leading-relaxed text-slate-500">Kunjungan dihitung setiap halaman publik dibuka atau dimuat ulang, termasuk melalui klik menu. Klik yang tidak membuka halaman tidak menambah kunjungan. Pengunjung unik dikenali melalui ID acak di browser tanpa menyimpan nama, email, atau alamat IP. Browser atau perangkat lain, serta penghapusan penyimpanan browser, dapat dihitung sebagai pengunjung baru. Pengunjung unik pada seluruh rentang dihitung sekali dan bukan penjumlahan pengunjung unik tiap hari. Data tersedia sejak fitur pencatatan diaktifkan.</p>
  </div>;
}
