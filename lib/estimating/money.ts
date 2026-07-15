/** Decimal-safe money helpers using integer cents. */

export type MoneyCents = number;

export function toCents(amount: number): MoneyCents {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function fromCents(cents: MoneyCents): number {
  return Math.round(cents) / 100;
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

export function addMoney(...amounts: number[]): number {
  return fromCents(amounts.reduce((sum, a) => sum + toCents(a), 0));
}

export function multiplyMoney(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

export function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(roundMoney(amount));
}
