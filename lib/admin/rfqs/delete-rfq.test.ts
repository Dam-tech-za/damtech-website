import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPerform } from "../../auth/permissions.ts";
import {
  assessRfqDeleteBlockers,
  buildRfqDeleteAuditSnapshot,
  validateRfqDeleteId,
  validateRfqDeleteReason,
  validateTypedRfqConfirmation,
  type RfqDeleteSummary,
} from "./delete-rfq.ts";

const summary: RfqDeleteSummary = {
  id: "11111111-1111-4111-8111-111111111111",
  rfqNumber: "RFQ-2026-00005",
  customerName: "Jane Doe",
  companyName: "Acme Farm",
  serviceLabel: "HDPE lining",
  submittedAt: "2026-01-15T10:00:00.000Z",
  status: "new",
};

describe("deleteRfqs permission", () => {
  it("allows owner and admin only", () => {
    assert.equal(canPerform("owner", "deleteRfqs"), true);
    assert.equal(canPerform("admin", "deleteRfqs"), true);
    assert.equal(canPerform("sales", "deleteRfqs"), false);
    assert.equal(canPerform("estimator", "deleteRfqs"), false);
    assert.equal(canPerform("viewer", "deleteRfqs"), false);
  });
});

describe("validateRfqDeleteId", () => {
  it("accepts valid UUIDs", () => {
    assert.equal(
      validateRfqDeleteId("11111111-1111-4111-8111-111111111111"),
      true,
    );
  });

  it("rejects invalid ids", () => {
    assert.equal(validateRfqDeleteId("not-a-uuid"), false);
    assert.equal(validateRfqDeleteId(""), false);
  });
});

describe("validateRfqDeleteReason", () => {
  it("requires a known reason", () => {
    const result = validateRfqDeleteReason("Test submission");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "Test submission");
    }
  });

  it("requires detail for Other", () => {
    assert.equal(validateRfqDeleteReason("Other", "x").ok, false);
    const result = validateRfqDeleteReason("Other", "Entered in error");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "Other: Entered in error");
    }
  });

  it("rejects empty reason", () => {
    assert.equal(validateRfqDeleteReason("").ok, false);
  });
});

describe("validateTypedRfqConfirmation", () => {
  it("requires exact RFQ number match", () => {
    assert.equal(
      validateTypedRfqConfirmation("RFQ-2026-00005", "RFQ-2026-00005"),
      true,
    );
    assert.equal(
      validateTypedRfqConfirmation("RFQ-2026-00004", "RFQ-2026-00005"),
      false,
    );
    assert.equal(
      validateTypedRfqConfirmation(" rfq-2026-00005 ", "RFQ-2026-00005"),
      false,
    );
  });
});

describe("assessRfqDeleteBlockers", () => {
  const base = {
    status: "new",
    convertedQuoteId: null,
    linkedQuoteCount: 0,
    sentCommunicationCount: 0,
    answeredInfoRequestCount: 0,
    hasConfirmedAssetQuantities: false,
  };

  it("blocks converted RFQs", () => {
    const result = assessRfqDeleteBlockers({
      ...base,
      status: "converted",
      convertedQuoteId: "22222222-2222-4222-8222-222222222222",
    });
    assert.equal(result.blocked, true);
    assert.equal(result.code, "RFQ_DELETE_BLOCKED");
  });

  it("blocks linked quotes", () => {
    const result = assessRfqDeleteBlockers({
      ...base,
      linkedQuoteCount: 1,
    });
    assert.equal(result.blocked, true);
    assert.equal(result.code, "RFQ_DELETE_BLOCKED");
  });

  it("blocks sent customer communications", () => {
    const result = assessRfqDeleteBlockers({
      ...base,
      sentCommunicationCount: 2,
    });
    assert.equal(result.blocked, true);
  });

  it("blocks answered information requests", () => {
    const result = assessRfqDeleteBlockers({
      ...base,
      answeredInfoRequestCount: 1,
    });
    assert.equal(result.blocked, true);
  });

  it("blocks ready_for_quote RFQs with confirmed estimator work", () => {
    const result = assessRfqDeleteBlockers({
      ...base,
      status: "ready_for_quote",
      hasConfirmedAssetQuantities: true,
    });
    assert.equal(result.blocked, true);
  });

  it("allows unlinked test RFQs", () => {
    const result = assessRfqDeleteBlockers(base);
    assert.equal(result.blocked, false);
  });
});

describe("buildRfqDeleteAuditSnapshot", () => {
  it("stores only safe deletion metadata", () => {
    const snapshot = buildRfqDeleteAuditSnapshot({
      summary,
      deletionReason: "Test submission",
      deletedByEmail: "admin@example.com",
      deletedAt: "2026-07-20T08:00:00.000Z",
    });

    assert.equal(snapshot.rfqNumber, "RFQ-2026-00005");
    assert.equal(snapshot.customerName, "Jane Doe");
    assert.equal(snapshot.deletionReason, "Test submission");
    assert.equal(snapshot.deletedBy, "admin@example.com");
    assert.equal(snapshot.deletedAt, "2026-07-20T08:00:00.000Z");
    assert.equal(Object.keys(snapshot).length, 9);
  });
});

describe("delete workflow guards", () => {
  it("typed confirmation mismatch should block client-side delete enablement", () => {
    assert.equal(
      validateTypedRfqConfirmation("wrong", summary.rfqNumber),
      false,
    );
  });

  it("deletion reason is required before server acceptance", () => {
    assert.equal(validateRfqDeleteReason("").ok, false);
  });
});
