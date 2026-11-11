/** Number formats shared by the accounting charts and cards (server and client). */

export type Fmt = "rand" | "percent" | "count";

export const fmtValue = (v: number | null | undefined, fmt: Fmt): string => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  if (fmt === "percent") return `${v.toFixed(1)}%`;
  if (fmt === "count") return String(Math.round(v));
  const sign = v < 0 ? "−" : "";
  return `${sign}R${Math.round(Math.abs(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}`;
};
