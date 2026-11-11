/** Board stages for saved liner courier quotes (pure, so it can be tested). */

export const LINER_QUOTE_STAGES = ["quoted", "brief", "rated", "draft"] as const;
export type LinerQuoteStage = (typeof LINER_QUOTE_STAGES)[number];

export const LINER_QUOTE_STAGE_LABELS: Record<LinerQuoteStage, string> = {
  quoted: "On a quotation",
  brief: "Formal quote asked",
  rated: "Rated",
  draft: "Draft",
};

export const LINER_QUOTE_STAGE_TONES: Record<LinerQuoteStage, string> = {
  quoted: "green",
  brief: "purple",
  rated: "blue",
  draft: "grey",
};

export type LinerQuoteStageInput = {
  quote_id: string | null;
  chosen_amount: number | string | null;
  formal_quote_status: string;
  courier_rates: unknown[] | null;
};

export function linerQuoteStage(row: LinerQuoteStageInput): LinerQuoteStage {
  if (row.quote_id && row.chosen_amount != null) return "quoted";
  if (row.formal_quote_status === "brief_copied" || row.formal_quote_status === "portal_opened" || row.formal_quote_status === "api_submitted") {
    return "brief";
  }
  if (Array.isArray(row.courier_rates) && row.courier_rates.length > 0) return "rated";
  return "draft";
}

export function groupLinerQuotes<T extends LinerQuoteStageInput>(rows: T[]) {
  return LINER_QUOTE_STAGES.map((stage) => ({
    id: stage,
    label: LINER_QUOTE_STAGE_LABELS[stage],
    tone: LINER_QUOTE_STAGE_TONES[stage],
    rows: rows.filter((row) => linerQuoteStage(row) === stage),
  }));
}

/** Search over reference, customer, city and phone. */
export function matchesLinerQuoteSearch(
  row: { reference: string | null; customer_name: string | null; delivery_address: Record<string, string> | null },
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const a = row.delivery_address ?? {};
  return [row.reference, row.customer_name, a.city, a.suburb, a.phone, a.companyName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}
