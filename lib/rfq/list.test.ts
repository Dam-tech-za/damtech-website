import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RFQ_SORT_FIELDS,
  validateRfqPage,
  validateRfqPageSize,
  validateRfqSortField,
} from "./list-query.ts";

describe("rfq list allowlists", () => {
  it("only allows known sort fields", () => {
    assert.equal(validateRfqSortField("submitted_at"), "submitted_at");
    assert.equal(validateRfqSortField("contact_name"), "contact_name");
    assert.equal(validateRfqSortField("project_location"), "project_location");
    assert.equal(validateRfqSortField("evil;drop"), "submitted_at");
    assert.ok((RFQ_SORT_FIELDS as readonly string[]).includes("updated_at"));
  });

  it("clamps page and page size", () => {
    assert.equal(validateRfqPage(0), 1);
    assert.equal(validateRfqPage(-3), 1);
    assert.equal(validateRfqPage("2"), 2);
    assert.equal(validateRfqPageSize(0), 25);
    assert.equal(validateRfqPageSize(500), 100);
    assert.equal(validateRfqPageSize(10), 10);
  });
});
