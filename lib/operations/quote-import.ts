import type { ProjectService } from "./types.ts";
import type { XeroQuoteDetail } from "./xero-bridge.ts";

/**
 * Turning an accepted Xero quote into the payload for
 * public.ops_import_accepted_quote(). Deterministic: keyword rules, no AI.
 * Anything uncertain is left for a person (needs_review stays true).
 */

const SERVICE_RULES: { service: ProjectService; pattern: RegExp }[] = [
  { service: "torch_on_bitumen", pattern: /torch[\s-]?on|bitumen/i },
  { service: "roof_waterproofing", pattern: /roof\s+waterproof|flat\s+roof|roof\s+coating/i },
  { service: "foundation_waterproofing", pattern: /foundation|retaining\s+wall|damp[\s-]?proof/i },
  { service: "steel_reservoir", pattern: /steel\s+reservoir|zinc(al)?\s+reservoir|corrugated|\bk[lL]\s+reservoir|reservoir\s+shell/i },
  { service: "reservoir_lining", pattern: /reservoir\s+(re)?lining|relin(e|ing)\s+.*reservoir/i },
  { service: "hdpe_dam_lining", pattern: /hdpe/i },
  { service: "pvc_lining", pattern: /\bpvc\b/i },
  { service: "repairs", pattern: /repair|leak/i },
];

/** First matching rule on the title, then the line descriptions. */
export function inferService(title: string | null, lines: { description: string | null }[]): ProjectService {
  const texts = [title ?? "", ...lines.map((l) => l.description ?? "")];
  for (const text of texts) {
    for (const rule of SERVICE_RULES) {
      if (rule.pattern.test(text)) return rule.service;
    }
  }
  return "unclassified";
}

const INSTALL_WORDS = /install|site\s+establishment|welding|labour|crew|erect/i;
const SUPPLY_WORDS = /supply\s+only|supply-only|collection\s+only|material\s+supply/i;

/** Supply-only only when the quote says so and has no installation lines. */
export function inferSupplyOnly(title: string | null, lines: { description: string | null }[]): boolean {
  const all = [title ?? "", ...lines.map((l) => l.description ?? "")].join("\n");
  return SUPPLY_WORDS.test(all) && !INSTALL_WORDS.test(all);
}

export type QuoteImportPayload = {
  xero_quote_id: string;
  quote_number: string;
  xero_status: string;
  title: string;
  customer_name: string;
  xero_contact_id: string | null;
  service: ProjectService;
  is_supply_only: boolean;
  scope: string | null;
  total_incl_vat: number | null;
  total_excl_vat: number | null;
  quote_date: string | null;
  next_action: string;
  next_action_due: string;
  needs_review: boolean;
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function buildQuoteImportPayload(quote: XeroQuoteDetail, today: string): QuoteImportPayload {
  const service = inferService(quote.title, quote.lines);
  const scopeLines = quote.lines
    .map((l) => (l.description ?? "").trim())
    .filter(Boolean)
    .map((d) => `• ${d}`);
  const scope = [quote.summary?.trim(), scopeLines.join("\n")].filter(Boolean).join("\n\n");
  const customer = quote.contact?.trim() || "Unknown customer";
  return {
    xero_quote_id: quote.id,
    quote_number: quote.number,
    xero_status: quote.status,
    title: clip(quote.title?.trim() ? `${customer} – ${quote.title.trim()}` : `${customer} – ${quote.number}`, 200),
    customer_name: customer,
    xero_contact_id: quote.contact_id,
    service,
    is_supply_only: inferSupplyOnly(quote.title, quote.lines),
    scope: scope ? clip(scope, 8000) : null,
    total_incl_vat: quote.total,
    total_excl_vat: quote.subtotal,
    quote_date: quote.date,
    next_action: "Confirm the deposit invoice and payment in Xero",
    next_action_due: today,
    // Always reviewed once by a person: site, crew and scope live outside Xero.
    needs_review: true,
  };
}

/** Quote numbers mentioned in an invoice reference, e.g. "000527 / QU0294" → ["QU0294"]. */
export function quoteNumbersInReference(reference: string | null): string[] {
  if (!reference) return [];
  const found = reference.toUpperCase().match(/\bQU-?\d{3,6}\b/g) ?? [];
  return [...new Set(found.map((q) => q.replace("-", "")))];
}

export type InvoiceMatchProject = {
  id: string;
  xero_quote_numbers: string[];
  xero_invoice_numbers: string[];
  customer_name: string;
  stage: string;
  /** Earliest linked quote date; invoices dated before it are never matched by contact. */
  since: string | null;
};

export type InvoiceMatch = { projectId: string; method: "reference" | "contact" } | null;

const upper = (v: string) => v.trim().toUpperCase();

const sameName = (a: string | null, b: string) =>
  (a ?? "").trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Which project an invoice belongs to.
 *
 * 0. The invoice number is listed on exactly one project (Monday migration).
 * 1. A quote number in the reference that exactly one project lists.
 * 2. Otherwise, the Xero contact has exactly one open project and the invoice
 *    is dated on or after that project's quote.
 *
 * Anything else returns null, so a person links it by hand instead of the
 * sync guessing between two jobs for the same customer.
 */
export function matchInvoiceToProject(
  invoice: { number: string | null; reference: string | null; contact: string | null; date: string | null },
  projects: InvoiceMatchProject[],
): InvoiceMatch {
  if (invoice.number) {
    const listed = projects.filter((p) => p.xero_invoice_numbers.some((n) => upper(n) === upper(invoice.number ?? "")));
    if (listed.length === 1) return { projectId: listed[0].id, method: "reference" };
    if (listed.length > 1) return null;
  }
  const numbers = quoteNumbersInReference(invoice.reference);
  if (numbers.length > 0) {
    const hits = new Set<string>();
    for (const p of projects) {
      if (p.xero_quote_numbers.some((q) => numbers.includes(q.toUpperCase()))) hits.add(p.id);
    }
    if (hits.size === 1) return { projectId: [...hits][0], method: "reference" };
    if (hits.size > 1) return null;
  }
  const open = projects.filter(
    (p) =>
      p.stage !== "completed" &&
      sameName(invoice.contact, p.customer_name) &&
      p.since !== null &&
      invoice.date !== null &&
      invoice.date >= p.since,
  );
  return open.length === 1 ? { projectId: open[0].id, method: "contact" } : null;
}
