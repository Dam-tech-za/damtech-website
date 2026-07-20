export const QUOTE_STATUSES = [
  "draft",
  "internal_review",
  "approved",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
  "superseded",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Legacy Phase 2 value — treat as rejected in UI/filters. */
export type QuoteStatusDb = QuoteStatus | "declined";

export const QUOTE_LINE_TYPES = [
  "item",
  "material",
  "labour",
  "travel",
  "delivery",
  "subcontractor",
  "custom",
  "heading",
  "note",
] as const;

export type QuoteLineType = (typeof QUOTE_LINE_TYPES)[number];

export type QuoteLineInput = {
  id?: string;
  sortOrder: number;
  lineType: QuoteLineType;
  itemCode?: string | null;
  category?: string | null;
  description: string;
  quantity: number;
  unit: string;
  costUnitPrice?: number | null;
  sellUnitPrice: number;
  discountPercent: number;
  taxCategory: "standard" | "exempt" | "zero";
  sourceMaterialItemId?: string | null;
  sourceLabourItemId?: string | null;
  sourceSupplierPriceId?: string | null;
  sourcePricingItemId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type QuoteTotals = {
  subtotalExVat: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalIncVat: number;
  directCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  vatExemptAmount: number;
};

export type QuoteDisplayNumber = {
  quoteNumber: string;
  revisionNumber: number;
  label: string;
  fileSlug: string;
};

export function normaliseQuoteStatus(status: string): QuoteStatus {
  if (status === "declined") return "rejected";
  if ((QUOTE_STATUSES as readonly string[]).includes(status)) {
    return status as QuoteStatus;
  }
  return "draft";
}

export function formatQuoteNumber(
  quoteNumber: string,
  revisionNumber: number,
): QuoteDisplayNumber {
  return {
    quoteNumber,
    revisionNumber,
    label: `${quoteNumber} Rev ${revisionNumber}`,
    fileSlug: `Damtech-Quotation-${quoteNumber}-Rev-${revisionNumber}.pdf`,
  };
}

export function daysRemaining(validUntil: string | Date, from = new Date()): number {
  const end =
    typeof validUntil === "string"
      ? new Date(`${validUntil}T23:59:59`)
      : validUntil;
  const ms = end.getTime() - from.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isQuoteExpiredByDate(
  validUntil: string | Date,
  status: string,
  from = new Date(),
): boolean {
  const normalised = normaliseQuoteStatus(status);
  if (["accepted", "rejected", "cancelled", "superseded", "expired"].includes(normalised)) {
    return normalised === "expired";
  }
  return daysRemaining(validUntil, from) < 0;
}
