import boundaries from "@/data/pinrang-kecamatan.json";

// Match names rather than the legacy seed's region codes, preserving all IDs
// referenced by answers and published datasets. Coordinates use WGS84 lon/lat.
const normalize = (name: string) => name.toLowerCase().replace(/^kecamatan\s+/, "").replace(/[^a-z]/g, "");
const geometries = new Map(boundaries.features.map((feature) => [
  normalize(feature.properties.nama), JSON.stringify(feature.geometry),
]));

export function getPinrangGeometry(nama: string, fallback: string | null): string {
  return geometries.get(normalize(nama)) ?? fallback ?? "[]";
}
