import { findTown, isSaProvince, type SaProvince } from "./sa-places.ts";

export type OpsOfficeId = "pretoria" | "western-cape";

export type OfficePin = {
  id: OpsOfficeId;
  label: string;
  lat: number;
  lng: number;
};

/**
 * Operating bases used for km-from-office. Coordinates are the Villieria and
 * Betty's Bay yards from lib/site.ts, not published on the public site.
 */
export const OPS_OFFICES: readonly OfficePin[] = [
  { id: "pretoria", label: "Pretoria", lat: -25.721, lng: 28.237 },
  { id: "western-cape", label: "Western Cape", lat: -34.368, lng: 18.896 },
];

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type DistancePair = {
  km_from_pretoria: number | null;
  km_from_western_cape: number | null;
  one_way_km: number | null;
  nearest_office: OpsOfficeId | null;
};

export function distancesFromPoint(lat: number, lng: number): DistancePair {
  const pret = Math.round(haversineKm({ lat, lng }, OPS_OFFICES[0]) * 10) / 10;
  const west = Math.round(haversineKm({ lat, lng }, OPS_OFFICES[1]) * 10) / 10;
  const nearest: OpsOfficeId = pret <= west ? "pretoria" : "western-cape";
  return {
    km_from_pretoria: pret,
    km_from_western_cape: west,
    one_way_km: nearest === "pretoria" ? pret : west,
    nearest_office: nearest,
  };
}

export function distancesForTown(province: string, town: string): DistancePair {
  const match = findTown(province, town);
  if (!match) {
    return { km_from_pretoria: null, km_from_western_cape: null, one_way_km: null, nearest_office: null };
  }
  return distancesFromPoint(match.lat, match.lng);
}

export function officeLabel(id: OpsOfficeId): string {
  return OPS_OFFICES.find((o) => o.id === id)?.label ?? id;
}

export function formatLocationCell(p: {
  site_province: string | null;
  site_town: string | null;
  site_location: string | null;
  km_from_pretoria: number | null;
  km_from_western_cape: number | null;
}): string | null {
  const place =
    p.site_province && p.site_town
      ? `${p.site_province}, ${p.site_town}`
      : p.site_town || p.site_province || p.site_location?.trim() || "";
  if (!place) return null;
  const pret = p.km_from_pretoria;
  const west = p.km_from_western_cape;
  if (pret === null && west === null) return place;
  if (pret === null) return `${place} (${formatKm(west)} · ${officeLabel("western-cape")})`;
  if (west === null) return `${place} (${formatKm(pret)} · ${officeLabel("pretoria")})`;
  const nearer: OpsOfficeId = pret <= west ? "pretoria" : "western-cape";
  const km = nearer === "pretoria" ? pret : west;
  return `${place} (${formatKm(km)} · ${officeLabel(nearer)})`;
}

function formatKm(km: number | null): string {
  if (km === null) return "—";
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
  return `${rounded} km`;
}

export type LocationPatch = {
  site_province: SaProvince | null;
  site_town: string | null;
  km_from_pretoria: number | null;
  km_from_western_cape: number | null;
  one_way_km: number | null;
};

export function locationPatch(province: string, town: string): LocationPatch {
  const trimmedTown = town.trim().slice(0, 80) || null;
  const trimmedProvince = province.trim();
  const validProvince = isSaProvince(trimmedProvince) ? trimmedProvince : null;
  const km = validProvince && trimmedTown ? distancesForTown(validProvince, trimmedTown) : {
    km_from_pretoria: null,
    km_from_western_cape: null,
    one_way_km: null,
    nearest_office: null,
  };
  return {
    site_province: validProvince,
    site_town: trimmedTown,
    km_from_pretoria: km.km_from_pretoria,
    km_from_western_cape: km.km_from_western_cape,
    one_way_km: km.one_way_km,
  };
}
