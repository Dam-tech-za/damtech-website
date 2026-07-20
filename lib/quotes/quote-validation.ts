import type { QuoteLineInput } from "./types";
import type { QuoteBuilderDefaults } from "./quote-builder-types";
import { NON_PRICED_LINE_TYPES } from "./quote-builder-types";

export type ValidationIssue = {
  id: string;
  section: "customer" | "project" | "items" | "terms" | "review";
  level: "error" | "warning";
  message: string;
};

export type ReadinessSection = {
  id: "customer" | "project" | "items" | "terms" | "review";
  label: string;
  status: "complete" | "incomplete" | "warning";
};

function pricedLines(lines: QuoteLineInput[]): QuoteLineInput[] {
  return lines.filter((line) => !NON_PRICED_LINE_TYPES.has(line.lineType));
}

export function assessQuoteReadiness(input: {
  customerId: string;
  title: string;
  email: string;
  lines: QuoteLineInput[];
  issueDate: string;
  validUntil: string;
  paymentTerms: string;
  hasCalculatorSuggestions: boolean;
  estimatorConfirmedSuggestions: boolean;
}): ReadinessSection[] {
  const priced = pricedLines(input.lines);
  const hasPricedItem = priced.some(
    (line) => line.quantity > 0 && line.sellUnitPrice > 0 && line.description.trim(),
  );
  const needsConfirmation =
    input.hasCalculatorSuggestions && !input.estimatorConfirmedSuggestions;

  return [
    {
      id: "customer",
      label: "Customer",
      status: input.customerId ? "complete" : "incomplete",
    },
    {
      id: "project",
      label: "Project",
      status: input.title.trim() ? "complete" : "incomplete",
    },
    {
      id: "items",
      label: "Items",
      status: needsConfirmation
        ? "warning"
        : hasPricedItem
          ? "complete"
          : "incomplete",
    },
    {
      id: "terms",
      label: "Terms",
      status:
        input.issueDate && input.validUntil && input.paymentTerms.trim()
          ? "complete"
          : "incomplete",
    },
    {
      id: "review",
      label: "Review",
      status:
        input.customerId && input.title.trim() && hasPricedItem && input.email.trim()
          ? "complete"
          : "incomplete",
    },
  ];
}

export function validateDraftSave(input: {
  customerId: string;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.customerId) {
    issues.push({
      id: "customer-required",
      section: "customer",
      level: "warning",
      message: "Select a customer before saving the draft.",
    });
  }
  return issues;
}

export function validatePreview(input: {
  customerId: string;
  title: string;
  lines: QuoteLineInput[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.customerId) {
    issues.push({
      id: "customer",
      section: "customer",
      level: "error",
      message: "Customer is required before preview.",
    });
  }
  if (!input.title.trim()) {
    issues.push({
      id: "title",
      section: "project",
      level: "error",
      message: "Project title is required before preview.",
    });
  }
  const priced = pricedLines(input.lines);
  if (!priced.some((line) => line.description.trim() && line.quantity > 0)) {
    issues.push({
      id: "items",
      section: "items",
      level: "error",
      message: "Add at least one priced line item before preview.",
    });
  }
  for (const line of priced) {
    if (line.sellUnitPrice <= 0) {
      issues.push({
        id: `price-${line.sortOrder}`,
        section: "items",
        level: "error",
        message: `Line "${line.description}" requires a unit price.`,
      });
    }
  }
  return issues;
}

export function validateSend(input: {
  customerId: string;
  title: string;
  email: string;
  lines: QuoteLineInput[];
  issueDate: string;
  validUntil: string;
  paymentTerms: string;
  hasCalculatorSuggestions: boolean;
  estimatorConfirmedSuggestions: boolean;
  status: string;
}): ValidationIssue[] {
  const issues = validatePreview(input);
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    issues.push({
      id: "email",
      section: "customer",
      level: "error",
      message: "A valid customer email is required to send the quotation.",
    });
  }
  if (!input.paymentTerms.trim()) {
    issues.push({
      id: "payment-terms",
      section: "terms",
      level: "error",
      message: "Payment terms are required before sending.",
    });
  }
  if (input.hasCalculatorSuggestions && !input.estimatorConfirmedSuggestions) {
    issues.push({
      id: "estimator-confirm",
      section: "items",
      level: "error",
      message: "Estimator must confirm suggested quantities before sending.",
    });
  }
  if (!["approved", "draft", "internal_review"].includes(input.status)) {
    if (input.status !== "approved") {
      issues.push({
        id: "status",
        section: "review",
        level: "warning",
        message: "Quote should be approved before sending (owner may override).",
      });
    }
  }
  return issues;
}

export function quoteDefaultsFromMetadata(
  quote: Record<string, unknown>,
): Pick<
  QuoteBuilderDefaults,
  "discountType" | "discountPercent" | "discountReason" | "vatPricingMode"
> {
  const meta =
    quote.metadata && typeof quote.metadata === "object"
      ? (quote.metadata as Record<string, unknown>)
      : {};
  return {
    discountType: (meta.discountType as QuoteBuilderDefaults["discountType"]) ?? "amount",
    discountPercent: Number(meta.discountPercent ?? 0),
    discountReason: String(meta.discountReason ?? ""),
    vatPricingMode:
      (meta.vatPricingMode as QuoteBuilderDefaults["vatPricingMode"]) ?? "exclusive",
  };
}
