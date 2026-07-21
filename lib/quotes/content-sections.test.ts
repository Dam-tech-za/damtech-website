import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CUSTOMER_FACING_SECTIONS,
  INTERNAL_SECTIONS,
  splitClauses,
  countClauseLines,
  hasCustomerFacingContent,
  contentReviewStatus,
  containsInternalSection,
  pickCustomerContent,
} from "./content-sections.ts";

describe("splitClauses", () => {
  it("splits numbered lists and strips markers", () => {
    const clauses = splitClauses("1. First clause\n2. Second clause\n3. Third");
    assert.deepEqual(clauses, ["First clause", "Second clause", "Third"]);
  });

  it("strips bullet and dash markers and drops blank lines", () => {
    const clauses = splitClauses("- Alpha\n\n• Beta\n*  Gamma\n");
    assert.deepEqual(clauses, ["Alpha", "Beta", "Gamma"]);
  });

  it("returns empty array for null/empty", () => {
    assert.deepEqual(splitClauses(null), []);
    assert.deepEqual(splitClauses(""), []);
    assert.deepEqual(splitClauses("   \n  "), []);
  });

  it("counts clause lines", () => {
    assert.equal(countClauseLines("1. a\n2. b\n3. c"), 3);
    assert.equal(countClauseLines(""), 0);
  });
});

describe("customer-facing vs internal sections", () => {
  it("never lists internalNotes as customer-facing", () => {
    for (const internal of INTERNAL_SECTIONS) {
      assert.ok(
        !(CUSTOMER_FACING_SECTIONS as readonly string[]).includes(internal),
        `${internal} must not be customer-facing`,
      );
    }
  });

  it("detects internal keys in a payload", () => {
    assert.equal(containsInternalSection({ internalNotes: "secret" }), true);
    assert.equal(containsInternalSection({ scopeSummary: "ok" }), false);
  });

  it("hasCustomerFacingContent reflects presence of any customer section", () => {
    assert.equal(hasCustomerFacingContent({}), false);
    assert.equal(hasCustomerFacingContent({ scopeSummary: "  " }), false);
    assert.equal(hasCustomerFacingContent({ exclusions: "1. No earthworks" }), true);
    assert.equal(
      hasCustomerFacingContent({ internalNotes: "crew note" } as never),
      false,
    );
  });
});

describe("pickCustomerContent (internal-note protection)", () => {
  it("maps only customer-facing columns and never internal_notes", () => {
    const quoteRow = {
      scope_summary: "1. Confirm dimensions",
      assumptions: "1. Drained",
      exclusions: "1. No structural repair",
      customer_message: "Thank you for the opportunity.",
      warranty_wording: "Standard warranty applies.",
      internal_notes: "SECRET crew cost R5000 — do not show customer",
    };

    const content = pickCustomerContent(quoteRow);

    assert.equal(content.scopeSummary, "1. Confirm dimensions");
    assert.equal(content.customerMessage, "Thank you for the opportunity.");
    assert.equal(content.warrantyWording, "Standard warranty applies.");

    // The internal note must not appear anywhere in the customer payload.
    assert.equal(containsInternalSection(content as unknown as Record<string, unknown>), false);
    const serialised = JSON.stringify(content);
    assert.ok(!serialised.includes("SECRET"), "internal note leaked into customer content");
    assert.ok(!serialised.toLowerCase().includes("crew cost"));
  });

  it("normalises blank columns to null", () => {
    const content = pickCustomerContent({ scope_summary: "  ", assumptions: null });
    assert.equal(content.scopeSummary, null);
    assert.equal(content.assumptions, null);
  });
});

describe("contentReviewStatus", () => {
  it("returns modified when changed after review", () => {
    assert.equal(
      contentReviewStatus({ reviewed: true, modifiedSinceReview: true }),
      "modified",
    );
  });
  it("returns reviewed when reviewed and unchanged", () => {
    assert.equal(
      contentReviewStatus({ reviewed: true, modifiedSinceReview: false }),
      "reviewed",
    );
  });
  it("returns unreviewed by default", () => {
    assert.equal(
      contentReviewStatus({ reviewed: false, modifiedSinceReview: false }),
      "unreviewed",
    );
  });
});
