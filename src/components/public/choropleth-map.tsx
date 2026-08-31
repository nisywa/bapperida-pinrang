"use client";

import { useMemo, useState } from "react";
import { PALETTES } from "@/lib/constants";

export type MapPolygon = {
  id: string;
  nama: string;
  geometry: string; // GeoJSON Polygon
  value: number | null;
};

function projectRings(geometry: string): [number, number][][] {
  try {
    const geo = JSON.parse(geometry);
    const ring: [number, number][] = geo.coordinates[0];
    return [ring];
  } catch {
    return [];
  }
}

export function ChoroplethMap({
  polygons,
  paletteKey = "emerald",
  satuan = "",
  height = 460,
}: {
  polygons: MapPolygon[];
  paletteKey?: string;
  satuan?: string;
  height?: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const palette = PALETTES[paletteKey] ?? PALETTES.emerald;

  // Proyeksi & klasifikasi
  const { paths, bounds } = useMemo(() => {
    const allRings = polygons.map((p) => ({ id: p.id, rings: projectRings(p.geometry) }));
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const r of allRings) {
      for (const ring of r.rings) {
        for (const [lng, lat] of ring) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
    const pad = 0.01;
    minLng -= pad; maxLng += pad; minLat -= pad; maxLat += pad;
    return { paths: allRings, bounds: { minLng, maxLng, minLat, maxLat } };
  }, [polygons]);

  const W = 640;
  const H = (() => {
    const lngSpan = bounds.maxLng - bounds.minLng;
    const latSpan = bounds.maxLat - bounds.minLat;
    const cosLat = Math.cos(((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180));
    const ratio = (latSpan) / (lngSpan * cosLat);
    return Math.round(W * ratio);
  })();

  const toXY = (lat: number, lng: number): [number, number] => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * H;
    return [x, y];
  };

  const values = polygons.filter((p) => p.value !== null).map((p) => p.value as number);
  const vMin = values.length ? Math.min(...values) : 0;
  const vMax = values.length ? Math.max(...values) : 0;

  const classes = 6;
  const step = vMax > vMin ? (vMax - vMin) / classes : 1;
  const colorFor = (v: number | null): string => {
    if (v === null) return "#e2e8f0";
    let idx = Math.floor((v - vMin) / step);
    if (idx >= classes) idx = classes - 1;
    if (idx < 0) idx = 0;
    return palette[Math.min(palette.length - 1, 2 + idx * (palette.length - 2) / classes)];
  };

  const fmt = (v: number) =>
    v.toLocaleString("id-ID", { maximumFractionDigits: 1 });

  const selectedP = polygons.find((p) => p.id === selected);
  const hoveredP = polygons.find((p) => p.id === hovered);
  const legendVals = Array.from({ length: classes }, (_, i) => vMin + i * step);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ maxHeight: height, width: "100%" }}
          role="img"
          aria-label="Peta choropleth kecamatan Kabupaten Pinrang"
          className="mx-auto block"
        >
          {/* Grid samar latar */}
          <defs>
            <pattern id="mapGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#mapGrid)" rx="12" />

          {paths.map(({ id, rings }) => {
            const p = polygons.find((x) => x.id === id)!;
            const d = rings
              .map((ring) =>
                ring
                  .map(([lng, lat], i) => {
                    const [x, y] = toXY(lat, lng);
                    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ") + " Z"
              )
              .join(" ");
            const isSel = selected === id;
            const isHov = hovered === id;
            return (
              <path
                key={id}
                d={d}
                fill={colorFor(p.value)}
                stroke={isSel ? "#0f766e" : isHov ? "#334155" : "#ffffff"}
                strokeWidth={isSel ? 3 : isHov ? 2 : 1.2}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === id ? null : id)}
              >
                <title>
                  {`${p.nama}: ${p.value === null ? "Data tidak tersedia" : `${fmt(p.value)} ${satuan}`}`}
                </title>
              </path>
            );
          })}

          {/* Label nama kecamatan */}
          {paths.map(({ id, rings }) => {
            const p = polygons.find((x) => x.id === id)!;
            const ring = rings[0];
            if (!ring) return null;
            const cx = ring.reduce((a, [lng, lat]) => a + toXY(lat, lng)[0], 0) / ring.length;
            const cy = ring.reduce((a, [lng, lat]) => a + toXY(lat, lng)[1], 0) / ring.length;
            return (
              <text
                key={`label-${id}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                fontSize="10.5"
                fontWeight="600"
                fill="#0f172a"
                opacity="0.75"
              >
                {p.nama.length > 14 ? p.nama.slice(0, 13) + "…" : p.nama}
              </text>
            );
          })}
        </svg>

        {/* Tooltip hover */}
        {hoveredP && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-lg bg-slate-900/90 px-3.5 py-2 text-center text-xs text-white shadow-lg backdrop-blur">
            <span className="font-semibold">{hoveredP.nama}</span>
            <br />
            {hoveredP.value === null ? (
              <span className="text-slate-300">Data tidak tersedia</span>
            ) : (
              <span>{fmt(hoveredP.value)} {satuan}</span>
            )}
          </div>
        )}
      </div>

      {/* Legenda + detail */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legenda</p>
          <div className="mt-3 space-y-1.5">
            {legendVals
              .slice()
              .reverse()
              .map((v, i) => {
                const idx = classes - 1 - i;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-3.5 w-6 rounded-sm border border-white shadow-sm"
                      style={{ background: palette[Math.min(palette.length - 1, 2 + idx * (palette.length - 2) / classes)] }}
                    />
                    <span>
                      {fmt(v)} – {fmt(v + step)} {satuan}
                    </span>
                  </div>
                );
              })}
            <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs text-slate-600">
              <span className="h-3.5 w-6 rounded-sm border border-slate-300 bg-slate-200" />
              Data tidak tersedia
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail Kecamatan</p>
          {selectedP ? (
            <div className="mt-3">
              <p className="font-semibold text-slate-900">{selectedP.nama}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {selectedP.value === null ? "-" : fmt(selectedP.value)}
                <span className="ml-1 text-sm font-normal text-slate-500">{satuan}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {selectedP.value === null
                  ? "Kecamatan ini belum mengirimkan data pada metric terpilih."
                  : `Peringkat ke-${values.length ? [...values].sort((a, b) => b - a).indexOf(selectedP.value as number) + 1 : "-"} dari ${values.length} kecamatan.`}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Klik salah satu kecamatan pada peta untuk melihat nilai, satuan, dan peringkatnya.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
