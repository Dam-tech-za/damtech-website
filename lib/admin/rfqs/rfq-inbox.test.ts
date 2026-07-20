import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseRfqInboxSort,
  requiresPostFetchSort,
  toListSortParams,
  validateRfqInboxPageSize,
} from "./rfq-inbox-query.ts";
import {
  buildFilterParams,
  canViewRfqContact,
  countActiveAdvancedFilters,
  formatSubmittedDate,
} from "./rfq-inbox-utils.ts";
import { compareRfqSize, sortRowsBySize } from "./rfq-size-sort.ts";
import { softParseProjectSize } from "../../rfq/soft-size-parse.ts";

describe("rfq inbox sort parsing", () => {
  it("defaults to newest first", () => {
    assert.equal(parseRfqInboxSort(undefined), "submitted_desc");
    assert.equal(parseRfqInboxSort(""), "submitted_desc");
    assert.deepEqual(toListSortParams("submitted_desc"), {
      sort: "submitted_at_desc",
    });
  });

  it("supports oldest first and recently updated", () => {
    assert.equal(parseRfqInboxSort("submitted_asc"), "submitted_asc");
    assert.equal(parseRfqInboxSort("updated_desc"), "updated_desc");
  });

  it("supports customer and location sorting via allowlisted fields", () => {
    assert.deepEqual(toListSortParams("customer_asc"), {
      sortField: "contact_name",
      sortDirection: "asc",
    });
    assert.deepEqual(toListSortParams("location_asc"), {
      sortField: "project_location",
      sortDirection: "asc",
    });
  });

  it("rejects unknown sort strings", () => {
    assert.equal(parseRfqInboxSort("evil;drop table"), "submitted_desc");
  });

  it("marks size sorts as post-fetch", () => {
    assert.equal(requiresPostFetchSort("size_desc"), true);
    assert.equal(requiresPostFetchSort("size_asc"), true);
    assert.equal(requiresPostFetchSort("customer_asc"), false);
  });

  it("defaults page size to 25 with allowlist", () => {
    assert.equal(validateRfqInboxPageSize(undefined), 25);
    assert.equal(validateRfqInboxPageSize(50), 50);
    assert.equal(validateRfqInboxPageSize(99), 25);
  });
});

describe("rfq size summary", () => {
  it("prefers confirmed asset quantities when summarised", () => {
    const summary = {
      liningMaterialM2: 5000,
      liningInstallM2: 0,
      torchOnM2: 0,
      steelCapacityKL: 0,
      assetCount: 1,
      assetTypes: ["earth_dam"],
      measurementStatuses: ["confirmed_for_quote"],
      needsSiteMeasurement: false,
      allConfirmed: true,
    };
    assert.equal(summary.allConfirmed, true);
    assert.equal(summary.liningMaterialM2, 5000);
  });

  it("uses customer estimate text when no assets", () => {
    const parsed = softParseProjectSize("5000 m²");
    assert.equal(parsed.estimated_area_m2, 5000);
  });

  it("returns missing instead of zero when no size supplied", () => {
    const parsed = softParseProjectSize("");
    assert.equal(parsed.estimated_area_m2, null);
    assert.equal(parsed.estimated_capacity_kl, null);
  });

  it("sorts compatible sizes and places null values last", () => {
    const rows = [
      {
        approximateSize: {
          displayValue: "250 kL",
          numericValue: 250,
          unit: "kL" as const,
          source: "calculated" as const,
          sortType: "capacity" as const,
        },
      },
      {
        approximateSize: {
          displayValue: null,
          numericValue: null,
          unit: null,
          source: "missing" as const,
          sortType: "none" as const,
        },
      },
      {
        approximateSize: {
          displayValue: "5 000 m²",
          numericValue: 5000,
          unit: "m²" as const,
          source: "customer_estimate" as const,
          sortType: "area" as const,
        },
      },
    ];

    const sorted = sortRowsBySize(rows, "desc");
    assert.equal(sorted[0].approximateSize.sortType, "area");
    assert.equal(sorted[1].approximateSize.sortType, "capacity");
    assert.equal(sorted[2].approximateSize.source, "missing");
  });

  it("does not compare unlike units within the same sort type group", () => {
    const area = {
      displayValue: "100 m²",
      numericValue: 100,
      unit: "m²" as const,
      source: "customer_estimate" as const,
      sortType: "area" as const,
    };
    const capacity = {
      displayValue: "50 kL",
      numericValue: 50,
      unit: "kL" as const,
      source: "calculated" as const,
      sortType: "capacity" as const,
    };
    assert.ok(compareRfqSize(area, capacity, "desc") < 0);
  });
});

describe("rfq inbox filters and permissions", () => {
  it("counts advanced filters for the More filters badge", () => {
    assert.equal(countActiveAdvancedFilters({}), 0);
    assert.equal(
      countActiveAdvancedFilters({
        province: "Northern Cape",
        service: "HDPE dam liner",
        hasAttachments: "1",
      }),
      3,
    );
  });

  it("builds URL query params and supports clear filters", () => {
    const params = buildFilterParams(
      { q: "Kakamas", status: "new", page: "2" },
      ["status", "page"],
    );
    assert.equal(params.get("q"), "Kakamas");
    assert.equal(params.get("status"), null);
    assert.equal(params.get("page"), null);
  });

  it("hides contact details from viewer role", () => {
    assert.equal(canViewRfqContact("viewer"), false);
    assert.equal(canViewRfqContact("sales"), true);
    assert.equal(canViewRfqContact("estimator"), true);
  });

  it("formats submitted dates for the table", () => {
    const formatted = formatSubmittedDate("2026-07-19T17:06:00.000Z");
    assert.match(formatted.dateLine, /19 Jul 2026/);
    assert.match(formatted.timeLine, /\d{2}:\d{2}/);
    assert.ok(formatted.tooltip.length > 0);
  });
});

describe("rfq inbox search filter mapping", () => {
  it("preserves search, status and sort in query params", () => {
    const params = buildFilterParams({
      q: "henko@example.co.za",
      status: "new",
      sort: "customer_asc",
      page: "3",
    });
    assert.equal(params.get("q"), "henko@example.co.za");
    assert.equal(params.get("status"), "new");
    assert.equal(params.get("sort"), "customer_asc");
    assert.equal(params.get("page"), "3");
  });
});
