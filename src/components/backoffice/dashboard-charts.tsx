"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "Belum Diisi": "#cbd5e1",
  "Draft": "#94a3b8",
  "Dikirim": "#f59e0b",
  "Perlu Perbaikan": "#f43f5e",
  "Terverifikasi": "#10b981",
};

export function StatusDonut({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Belum ada data.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v} penugasan`, "Jumlah"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Legend iconSize={9} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OpdProgressBar({ data }: { data: Array<{ nama: string; percent: number }> }) {
  const sorted = [...data].sort((a, b) => b.percent - a.percent);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="nama" width={90} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => [`${v}%`, "Progres"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="percent" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
