import {
  CATALOGUE_CATEGORY_PATH,
  MAX_CATALOGUE_QUANTITY,
  MIN_CATALOGUE_QUANTITY,
} from "./types.ts";

const ZA_GROUP = "\u00a0";

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatZarNumber(amount: number): string {
  const rounded = roundMoney(amount);
  const [whole, fraction = "00"] = rounded.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ZA_GROUP);
  return `${grouped}.${fraction}`;
}

/** Visible consumer price — always VAT-inclusive, never “from” or ex-VAT. */
export function formatZarInclVat(amount: number): string {
  return `R ${formatZarNumber(amount)} incl. VAT`;
}

/** Marketing whole-rand price, e.g. “R12 999 incl. VAT”. JSON-LD still uses two decimals. */
export function formatZarWholeInclVat(amount: number): string {
  const whole = Math.round(roundMoney(amount));
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ZA_GROUP);
  return `R${grouped} incl. VAT`;
}

/** Checkout whole-rand amount without repeating “incl. VAT”, e.g. “R12 999”. */
export function formatZarWholeAmount(amount: number): string {
  const whole = Math.round(roundMoney(amount));
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ZA_GROUP);
  return `R${grouped}`;
}

/** Checkout decimal amount without “incl. VAT”, e.g. “R1 695.52”. */
export function formatZarExactAmount(amount: number): string {
  return `R${formatZarNumber(amount)}`;
}

export function formatJsonLdPrice(amount: number): string {
  return roundMoney(amount).toFixed(2);
}

export function formatCapacityLitres(litres: number): string {
  return `${litres.toLocaleString("en-ZA").replace(/,/g, " ")} L`;
}

export function clampCatalogueQuantity(raw: number): number {
  if (!Number.isFinite(raw)) return MIN_CATALOGUE_QUANTITY;
  return Math.min(
    MAX_CATALOGUE_QUANTITY,
    Math.max(MIN_CATALOGUE_QUANTITY, Math.floor(raw)),
  );
}

export function parseCatalogueQuantity(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return clampCatalogueQuantity(raw);
  if (typeof raw !== "string" || !raw.trim()) return MIN_CATALOGUE_QUANTITY;
  const parsed = Number(raw.trim());
  return clampCatalogueQuantity(parsed);
}

export function productPath(slug: string): string {
  return `${CATALOGUE_CATEGORY_PATH}/${slug}`;
}

export function invoiceRequestPath(sku: string, quantity = 1): string {
  const qty = clampCatalogueQuantity(quantity);
  const params = new URLSearchParams({
    sku,
    qty: String(qty),
  });
  return `/quote/?${params.toString()}`;
}

export function orderPath(sku: string, quantity = 1): string {
  const qty = clampCatalogueQuantity(quantity);
  const params = new URLSearchParams({
    sku,
    qty: String(qty),
  });
  return `/order/?${params.toString()}`;
}
