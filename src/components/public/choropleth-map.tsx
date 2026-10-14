"use client";

import { useId, useMemo, useState } from "react";
import { PALETTES } from "@/lib/constants";

export type MapPolygon = {
  id: string;
  nama: string;
  geometry: string; // GeoJSON Polygon or MultiPolygon (WGS84)
  value: number | null;
};

type Point = [number, number];
type Polygon = Point[][];

function projectRings(geometry: string): Polygon[] {
  try {
    const geo = JSON.parse(geometry);
    const parts: Polygon[] = geo.type === "Polygon" ? [geo.coordinates]
      : geo.type === "MultiPolygon" ? geo.coordinates : [];
    return parts.filter((part) => Array.isArray(part) && part.length > 0 && part.every((ring) =>
      Array.isArray(ring) && ring.length >= 4 && ring.every((point) =>
        Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]),
      ),
    ));
  } catch {
    return [];
  }
}

function ringArea(ring: Point[]): number {
  return Math.abs(ring.reduce((sum, [x, y], i) => {
    const next = ring[(i + 1) % ring.length];
    return sum + x * next[1] - next[0] * y;
  }, 0) / 2);
}

// Place labels inside the largest land polygon, avoiding outlying islands.
function labelPoint(parts: Polygon[]): Point | null {
  const largest = [...parts].sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0];
  if (!largest) return null;
  const ring = largest[0];
  let area = 0, centerY = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x, y] = ring[i], [nx, ny] = ring[i + 1];
    const cross = x * ny - nx * y;
    area += cross;
    centerY += (y + ny) * cross;
  }
  const y = Math.abs(area) > 1e-12 ? centerY / (3 * area) : ring[0][1];
  const intersections: number[] = [];
  for (const boundary of largest) {
    for (let i = 0; i < boundary.length - 1; i++) {
      const [x1, y1] = boundary[i], [x2, y2] = boundary[i + 1];
      if ((y1 > y) !== (y2 > y)) intersections.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
  }
  intersections.sort((a, b) => a - b);
  let best: Point | null = null, width = -1;
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const span = intersections[i + 1] - intersections[i];
    if (span > width) { width = span; best = [(intersections[i] + intersections[i + 1]) / 2, y]; }
  }
  return best ?? ring[0];
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
  const gridId = useId().replace(/:/g, "");

  const palette = PALETTES[paletteKey] ?? PALETTES.emerald;

  // Proyeksi & klasifikasi
  const { paths, bounds } = useMemo(() => {
    const allRings = polygons.map((p) => ({ id: p.id, rings: projectRings(p.geometry) }));
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const r of allRings) {
      for (const ring of r.rings.flat()) {
        for (const [lng, lat] of ring) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
    if (!Number.isFinite(minLng)) {
      minLng = 119.3; maxLng = 120; minLat = -4; maxLat = -3;
    }
    const pad = 0.01;
    minLng -= pad; maxLng += pad; minLat -= pad; maxLat += pad;
    return { paths: allRings, bounds: { minLng, maxLng, minLat, maxLat } };
  }, [polygons]);

  const W = 360;
  const H = 520;
  const cosLat = Math.cos(((bounds.minLat + bounds.maxLat) / 2) * (Math.PI / 180));
  const mapWidth = (bounds.maxLng - bounds.minLng) * cosLat;
  const mapHeight = bounds.maxLat - bounds.minLat;
  const scale = Math.min((W - 40) / mapWidth, (H - 40) / mapHeight);
  const offsetX = (W - mapWidth * scale) / 2;
  const offsetY = (H - mapHeight * scale) / 2;

  const toXY = (lat: number, lng: number): [number, number] => {
    const x = offsetX + (lng - bounds.minLng) * cosLat * scale;
    const y = offsetY + (bounds.maxLat - lat) * scale;
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
    return palette[Math.min(palette.length - 1, 2 + idx)];
  };

  const fmt = (v: number) =>
    v.toLocaleString("id-ID", { maximumFractionDigits: 1 });

  const selectedP = polygons.find((p) => p.id === selected);
  const hoveredP = polygons.find((p) => p.id === hovered);
  const legendVals = Array.from({ length: classes }, (_, i) => vMin + i * step);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
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
            <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill={`url(#${gridId})`} rx="12" />

          {paths.map(({ id, rings }) => {
            const p = polygons.find((x) => x.id === id)!;
            const d = rings.flat()
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
                fillRule="evenodd"
                fill={colorFor(p.value)}
                stroke={isSel ? "#0f766e" : isHov ? "#334155" : "#ffffff"}
                strokeWidth={isSel ? 3 : isHov ? 2 : 1.2}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="button"
                aria-label={`${p.nama}: ${p.value === null ? "Data tidak tersedia" : `${fmt(p.value)} ${satuan}`}`}
                aria-pressed={isSel}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === id ? null : id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(selected === id ? null : id);
                  }
                }}
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
            const center = labelPoint(rings);
            if (!center) return null;
            const [cx, cy] = toXY(center[1], center[0]);
            return (
              <text
                key={`label-${id}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                fontSize="12"
                fontWeight="600"
                fill="#0f172a"
                opacity="0.75"
                stroke="white"
                strokeWidth="2.5"
                paintOrder="stroke"
              >
                {p.nama.length > 14 ? p.nama.slice(0, 13) + "…" : p.nama}
              </text>
            );
          })}
        </svg>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Batas wilayah: <a href="https://data.pinrangkab.go.id/dataset/batas-administrasi-kecamatan-kabupaten-pinrang1" target="_blank" rel="noreferrer" className="underline">Satu Data Kabupaten Pinrang</a> · edisi 2023.
        </p>

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
                      style={{ background: palette[Math.min(palette.length - 1, 2 + idx)] }}
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
