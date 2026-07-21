/**
 * Pure helpers for quote scope / notes content.
 *
 * These functions have no I/O so they can be unit-tested and reused by the PDF
 * renderer, the public-quote mapper and the send-validation logic. The single
 * source of truth for which sections are customer-facing versus internal lives
 * here so it cannot drift between outputs.
 */

/** Sections that may appear on customer outputs (PDF, portal, email). */
export const CUSTOMER_FACING_SECTIONS = [
  "scopeSummary",
  "assumptions",
  "exclusions",
  "customerMessage",
  "warrantyWording",
] as const;

/** Sections that must NEVER appear on any customer output. */
export const INTERNAL_SECTIONS = ["internalNotes"] as const;

export type CustomerFacingSection = (typeof CUSTOMER_FACING_SECTIONS)[number];

/**
 * Split a scope/assumptions/exclusions text block into individual clause
 * strings, stripping any pre-existing list markers ("1.", "-", "•").
 * Blank lines are dropped. This mirrors parseClauses without the clause IDs so
 * the PDF layer stays dependency-free.
 */
export function splitClauses(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, "").trim())
    .filter((line) => line.length > 0);
}

/** Count non-empty clauses in a text block. */
export function countClauseLines(text: string | null | undefined): number {
  return splitClauses(text).length;
}

export type QuoteContentSections = {
  scopeSummary?: string | null;
  assumptions?: string | null;
  exclusions?: string | null;
  customerMessage?: string | null;
  warrantyWording?: string | null;
};

/** True when the quote has any customer-facing scope/notes content to review. */
export function hasCustomerFacingContent(sections: QuoteContentSections): boolean {
  return CUSTOMER_FACING_SECTIONS.some((key) =>
    Boolean((sections[key] ?? "").toString().trim()),
  );
}

export type ContentReviewStatus = "unreviewed" | "reviewed" | "modified";

/**
 * Derive the review status shown next to the content source.
 * - modified: content changed after it was last reviewed
 * - reviewed: reviewed and unchanged since
 * - unreviewed: never reviewed
 */
export function contentReviewStatus(input: {
  reviewed: boolean;
  modifiedSinceReview: boolean;
}): ContentReviewStatus {
  if (input.modifiedSinceReview) return "modified";
  return input.reviewed ? "reviewed" : "unreviewed";
}

/**
 * Guard used by tests and by output builders: asserts that a customer-facing
 * payload object does not contain any internal-section keys.
 */
export function containsInternalSection(payload: Record<string, unknown>): boolean {
  return INTERNAL_SECTIONS.some((key) => key in payload);
}

export type CustomerContent = {
  scopeSummary: string | null;
  assumptions: string | null;
  exclusions: string | null;
  customerMessage: string | null;
  warrantyWording: string | null;
};

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

/**
 * The single, enforced mapping from a stored quote row (snake_case columns) to
 * the customer-visible content payload. Internal columns (internal_notes) are
 * intentionally never read here, so no customer output can leak them. Both the
 * PDF renderer and the public-quote view build their content through this
 * function.
 */
export function pickCustomerContent(quote: Record<string, unknown>): CustomerContent {
  return {
    scopeSummary: str(quote.scope_summary),
    assumptions: str(quote.assumptions),
    exclusions: str(quote.exclusions),
    customerMessage: str(quote.customer_message),
    warrantyWording: str(quote.warranty_wording),
  };
}
