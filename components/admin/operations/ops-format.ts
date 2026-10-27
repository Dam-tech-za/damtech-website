import { formatZarExactAmount } from "@/lib/catalogue/format";

const DATE = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" });
const DATE_TIME = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Johannesburg",
});

/** "2026-10-21" → "21 Oct 2026". Date-only values are read as calendar dates, not UTC instants. */
export function formatOpsDate(value: string | null): string {
  if (!value) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+02:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : DATE.format(d);
}

export function formatOpsDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : DATE_TIME.format(d);
}

export function formatOpsMoney(value: number | null): string {
  return value == null || !Number.isFinite(value) ? "—" : formatZarExactAmount(value);
}
