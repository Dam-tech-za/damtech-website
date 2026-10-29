/**
 * Board extras that may live in dedicated columns (after v4 migration) or, as a
 * fallback, as a single @@board@@ JSON line at the top of `scope`.
 */

import { PAYMENT_LABELS, type PaymentLabel } from "./board.ts";

export const DEFAULT_LEAD_SUGGESTIONS = ["Arno", "Andre", "Annemieke De Lange"] as const;

export type BoardManualField =
  | "title"
  | "lead"
  | "payment"
  | "client"
  | "phone"
  | "email"
  | "company"
  | "value"
  | "location"
  | "xero"
  | "notes"
  | "next_action";

export type BoardMeta = {
  payment?: PaymentLabel | null;
  manual?: Partial<Record<BoardManualField, boolean>>;
  lead?: string | null;
};

const META_LINE = /^@@board@@(\{.*\})\s*$/m;

export function parseBoardMetaFromScope(scope: string | null | undefined): BoardMeta {
  if (!scope) return {};
  const match = scope.match(META_LINE);
  if (!match) return {};
  try {
    const raw = JSON.parse(match[1]) as BoardMeta;
    const payment =
      raw.payment && (PAYMENT_LABELS as readonly string[]).includes(raw.payment) ? raw.payment : null;
    return {
      payment,
      manual: raw.manual ?? {},
      lead: typeof raw.lead === "string" ? raw.lead : null,
    };
  } catch {
    return {};
  }
}

export function stripBoardMetaFromScope(scope: string | null | undefined): string {
  if (!scope) return "";
  return scope.replace(META_LINE, "").replace(/^\n+/, "");
}

export function writeBoardMetaIntoScope(scope: string | null | undefined, meta: BoardMeta): string {
  const body = stripBoardMetaFromScope(scope);
  const compact: BoardMeta = {};
  if (meta.payment) compact.payment = meta.payment;
  if (meta.lead?.trim()) compact.lead = meta.lead.trim().slice(0, 120);
  const manual = Object.fromEntries(Object.entries(meta.manual ?? {}).filter(([, v]) => v));
  if (Object.keys(manual).length) compact.manual = manual;
  if (!compact.payment && !compact.lead && !compact.manual) return body;
  return `@@board@@${JSON.stringify(compact)}\n${body}`.trimEnd();
}

export function isPaymentLabel(value: string): value is PaymentLabel {
  return (PAYMENT_LABELS as readonly string[]).includes(value);
}

/** Normalise SA and international phone strings for storage. */
export function normalisePhoneInput(raw: string, defaultCountry = "ZA"): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed.slice(0, 40);

  if (defaultCountry === "ZA") {
    let national = digits;
    if (digits.startsWith("27") && digits.length >= 11) national = digits.slice(2);
    else if (digits.startsWith("0")) national = digits.slice(1);
    if (national.length >= 9) {
      const nine = national.slice(0, 9);
      return `+27${nine}`;
    }
  }

  if (trimmed.startsWith("+")) return `+${digits}`.slice(0, 40);
  return trimmed.slice(0, 40);
}

export function mergeLeadSuggestions(existing: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const name of DEFAULT_LEAD_SUGGESTIONS) set.add(name);
  for (const name of existing) {
    const t = (name ?? "").trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function splitXeroNumbers(raw: string): { quotes: string[]; invoices: string[] } {
  const parts = raw
    .split(/[,;\s]+/)
    .map((p) => p.trim().toUpperCase().replace(/-/g, ""))
    .filter(Boolean);
  const quotes: string[] = [];
  const invoices: string[] = [];
  for (const p of parts) {
    if (/^QU\d{3,6}$/.test(p)) quotes.push(p);
    else if (/^INV\d{3,6}$/.test(p)) invoices.push(p);
    else if (/^QT\d{3,6}$/.test(p)) quotes.push(p.replace(/^QT/, "QU"));
  }
  return { quotes: [...new Set(quotes)], invoices: [...new Set(invoices)] };
}
