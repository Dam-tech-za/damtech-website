/**
 * South African provinces and a curated town list with coordinates, used to
 * fill Location on the operations board and compute km from each Damtech
 * office. No Google API: staff pick from this list.
 */

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;
export type SaProvince = (typeof SA_PROVINCES)[number];

export type SaTown = {
  name: string;
  province: SaProvince;
  lat: number;
  lng: number;
};

/** Towns Damtech actually works in, plus metros used for filtering distance. */
export const SA_TOWNS: readonly SaTown[] = [
  { name: "East London", province: "Eastern Cape", lat: -33.015, lng: 27.912 },
  { name: "Gqeberha", province: "Eastern Cape", lat: -33.961, lng: 25.61 },
  { name: "Makhanda", province: "Eastern Cape", lat: -33.304, lng: 26.533 },
  { name: "Mthatha", province: "Eastern Cape", lat: -31.589, lng: 28.784 },
  { name: "Queenstown", province: "Eastern Cape", lat: -31.898, lng: 26.875 },
  { name: "Bethlehem", province: "Free State", lat: -28.231, lng: 28.307 },
  { name: "Bloemfontein", province: "Free State", lat: -29.121, lng: 26.214 },
  { name: "Harrismith", province: "Free State", lat: -28.273, lng: 29.129 },
  { name: "Kroonstad", province: "Free State", lat: -27.65, lng: 27.234 },
  { name: "Lindley", province: "Free State", lat: -27.881, lng: 27.919 },
  { name: "Welkom", province: "Free State", lat: -27.977, lng: 26.735 },
  { name: "Benoni", province: "Gauteng", lat: -26.188, lng: 28.321 },
  { name: "Boksburg", province: "Gauteng", lat: -26.225, lng: 28.25 },
  { name: "Bronkhorstspruit", province: "Gauteng", lat: -25.805, lng: 28.736 },
  { name: "Centurion", province: "Gauteng", lat: -25.86, lng: 28.189 },
  { name: "Cullinan", province: "Gauteng", lat: -25.671, lng: 28.521 },
  { name: "Heidelberg", province: "Gauteng", lat: -26.505, lng: 28.36 },
  { name: "Johannesburg", province: "Gauteng", lat: -26.204, lng: 28.047 },
  { name: "Krugersdorp", province: "Gauteng", lat: -26.085, lng: 27.775 },
  { name: "Lanseria", province: "Gauteng", lat: -25.938, lng: 27.926 },
  { name: "Midrand", province: "Gauteng", lat: -25.989, lng: 28.128 },
  { name: "Pretoria", province: "Gauteng", lat: -25.747, lng: 28.229 },
  { name: "Randburg", province: "Gauteng", lat: -26.094, lng: 27.975 },
  { name: "Roodepoort", province: "Gauteng", lat: -26.162, lng: 27.872 },
  { name: "Sandton", province: "Gauteng", lat: -26.107, lng: 28.057 },
  { name: "Soweto", province: "Gauteng", lat: -26.248, lng: 27.854 },
  { name: "Springs", province: "Gauteng", lat: -26.25, lng: 28.4 },
  { name: "Vanderbijlpark", province: "Gauteng", lat: -26.699, lng: 27.838 },
  { name: "Vereeniging", province: "Gauteng", lat: -26.673, lng: 27.926 },
  { name: "Villieria", province: "Gauteng", lat: -25.721, lng: 28.237 },
  { name: "Durban", province: "KwaZulu-Natal", lat: -29.858, lng: 31.029 },
  { name: "Newcastle", province: "KwaZulu-Natal", lat: -27.758, lng: 29.932 },
  { name: "Pietermaritzburg", province: "KwaZulu-Natal", lat: -29.601, lng: 30.379 },
  { name: "Richards Bay", province: "KwaZulu-Natal", lat: -28.783, lng: 32.038 },
  { name: "Vryheid", province: "KwaZulu-Natal", lat: -27.769, lng: 30.792 },
  { name: "Bela-Bela", province: "Limpopo", lat: -24.885, lng: 28.294 },
  { name: "Lephalale", province: "Limpopo", lat: -23.674, lng: 27.745 },
  { name: "Modimolle", province: "Limpopo", lat: -24.7, lng: 28.406 },
  { name: "Mokopane", province: "Limpopo", lat: -24.194, lng: 29.011 },
  { name: "Polokwane", province: "Limpopo", lat: -23.904, lng: 29.469 },
  { name: "Thabazimbi", province: "Limpopo", lat: -24.592, lng: 27.411 },
  { name: "Tzaneen", province: "Limpopo", lat: -23.833, lng: 30.165 },
  { name: "eMalahleni", province: "Mpumalanga", lat: -25.877, lng: 29.209 },
  { name: "Ermelo", province: "Mpumalanga", lat: -26.517, lng: 29.99 },
  { name: "Mbombela", province: "Mpumalanga", lat: -25.475, lng: 30.97 },
  { name: "Middelburg", province: "Mpumalanga", lat: -25.775, lng: 29.464 },
  { name: "Piet Retief", province: "Mpumalanga", lat: -27.004, lng: 30.803 },
  { name: "Secunda", province: "Mpumalanga", lat: -26.55, lng: 29.167 },
  { name: "Standerton", province: "Mpumalanga", lat: -26.934, lng: 29.241 },
  { name: "Klerksdorp", province: "North West", lat: -26.852, lng: 26.666 },
  { name: "Mahikeng", province: "North West", lat: -25.865, lng: 25.644 },
  { name: "Potchefstroom", province: "North West", lat: -26.715, lng: 27.096 },
  { name: "Rustenburg", province: "North West", lat: -25.667, lng: 27.242 },
  { name: "Hartswater", province: "Northern Cape", lat: -27.754, lng: 24.764 },
  { name: "Kimberley", province: "Northern Cape", lat: -28.728, lng: 24.75 },
  { name: "Kuruman", province: "Northern Cape", lat: -27.452, lng: 23.432 },
  { name: "Upington", province: "Northern Cape", lat: -28.447, lng: 21.256 },
  { name: "Betty's Bay", province: "Western Cape", lat: -34.368, lng: 18.896 },
  { name: "Cape Town", province: "Western Cape", lat: -33.925, lng: 18.424 },
  { name: "George", province: "Western Cape", lat: -33.964, lng: 22.459 },
  { name: "Gansbaai", province: "Western Cape", lat: -34.589, lng: 19.352 },
  { name: "Hermanus", province: "Western Cape", lat: -34.419, lng: 19.234 },
  { name: "Kleinmond", province: "Western Cape", lat: -34.338, lng: 19.033 },
  { name: "Knysna", province: "Western Cape", lat: -34.036, lng: 23.047 },
  { name: "Oudtshoorn", province: "Western Cape", lat: -33.59, lng: 22.201 },
  { name: "Paarl", province: "Western Cape", lat: -33.734, lng: 18.975 },
  { name: "Pringle Bay", province: "Western Cape", lat: -34.351, lng: 18.824 },
  { name: "Robertson", province: "Western Cape", lat: -33.803, lng: 19.887 },
  { name: "Rooi-Els", province: "Western Cape", lat: -34.3, lng: 18.816 },
  { name: "Stellenbosch", province: "Western Cape", lat: -33.932, lng: 18.86 },
  { name: "Tulbagh", province: "Western Cape", lat: -33.285, lng: 19.138 },
  { name: "Worcester", province: "Western Cape", lat: -33.646, lng: 19.449 },
];

export function isSaProvince(value: string): value is SaProvince {
  return (SA_PROVINCES as readonly string[]).includes(value);
}

export function townsInProvince(province: string): SaTown[] {
  return SA_TOWNS.filter((t) => t.province === province);
}

export function findTown(province: string, town: string): SaTown | null {
  const name = town.trim().toLowerCase();
  if (!name) return null;
  return SA_TOWNS.find((t) => t.province === province && t.name.toLowerCase() === name) ?? null;
}

/** Best-effort match when Xero only gives a city or region string. */
export function findTownByName(raw: string | null | undefined): SaTown | null {
  const name = (raw ?? "").trim().toLowerCase();
  if (!name) return null;
  return SA_TOWNS.find((t) => t.name.toLowerCase() === name) ?? null;
}
