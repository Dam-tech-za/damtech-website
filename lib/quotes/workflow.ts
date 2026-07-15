import type { AdminRole } from "@/lib/auth/types";
import { canPerform, hasAnyRole } from "@/lib/auth/permissions";
import { normaliseQuoteStatus, type QuoteStatus } from "./types";

/**
 * Allowed status transitions. Acceptance/rejection/view/expire also handled
 * in specialised public/cron paths with their own guards.
 */
export const QUOTE_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  draft: ["internal_review", "cancelled"],
  internal_review: ["draft", "approved", "cancelled"],
  approved: ["sent", "internal_review", "cancelled"],
  sent: ["viewed", "accepted", "rejected", "expired", "cancelled"],
  viewed: ["accepted", "rejected", "expired", "cancelled"],
  accepted: [],
  rejected: [],
  expired: [],
  cancelled: [],
  superseded: [],
};

export function canTransition(
  from: string,
  to: QuoteStatus,
): boolean {
  const normalised = normaliseQuoteStatus(from);
  return QUOTE_TRANSITIONS[normalised].includes(to);
}

export function canEditQuote(status: string, role: AdminRole): boolean {
  const s = normaliseQuoteStatus(status);
  if (!canPerform(role, "manageQuotes")) return false;
  return s === "draft" || s === "internal_review";
}

export function canApproveQuote(role: AdminRole): boolean {
  return canPerform(role, "approveQuotes");
}

export function canSendQuote(
  status: string,
  role: AdminRole,
  options: { ownerOverrideUnapproved?: boolean } = {},
): boolean {
  if (!canPerform(role, "sendQuotes")) return false;
  const s = normaliseQuoteStatus(status);
  if (s === "approved") return true;
  if (
    options.ownerOverrideUnapproved &&
    hasAnyRole(role, ["owner"]) &&
    (s === "draft" || s === "internal_review")
  ) {
    return true;
  }
  return false;
}

export function canCreateRevision(status: string, role: AdminRole): boolean {
  if (!canPerform(role, "manageQuotes")) return false;
  const s = normaliseQuoteStatus(status);
  return ["sent", "viewed", "rejected", "expired", "approved", "cancelled"].includes(
    s,
  );
}

export function canDuplicateQuote(role: AdminRole): boolean {
  return canPerform(role, "manageQuotes");
}

export function canViewCostMargin(role: AdminRole): boolean {
  return canPerform(role, "viewQuoteMargin");
}
