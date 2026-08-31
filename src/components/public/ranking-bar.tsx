"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PALETTES } from "@/lib/constants";

export type RankingItem = { nama: string; nilai: number };

export function RankingBar({
  data,
  paletteKey = "emerald",
  satuan = "",
}: {
  data: RankingItem[];
  paletteKey?: string;
  satuan?: string;
}) {
  const palette = PALETTES[paletteKey] ?? PALETTES.emerald;
  const sorted = [...data].sort((a, b) => b.nilai - a.nilai);
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nama"
            width={110}
            tick={{ fontSize: 11, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString("id-ID")} ${satuan}`, "Nilai"]}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }}
          />
          <Bar dataKey="nilai" radius={[0, 4, 4, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={palette[Math.min(palette.length - 1, 3 + Math.floor(i / Math.max(1, sorted.length / 5)))]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
