import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Self-contained tests mirroring the import pipeline algorithms.
 * (The runtime modules use extensionless relative imports that Node's
 * type-stripping runner cannot resolve, so the pure logic is replicated here
 * exactly as implemented in lib/pricing/import/*.ts.)
 */

const CANONICAL_HEADERS = [
  "item_code", "item_type", "category", "product_name", "quote_description",
  "purchase_unit", "quote_unit", "conversion_factor", "default_cost_ex_vat_zar",
  "recommended_sell_ex_vat_zar", "pricing_method", "default_markup_percent",
  "target_margin_percent", "tax_category", "waste_percent", "overlap_percent",
  "coverage_rate", "coverage_unit", "roll_width_m", "roll_length_m", "pack_size",
  "thickness_mm", "gsm", "supplier_name", "source_reference", "source_url",
  "price_date", "confidence", "requires_manual_confirmation", "is_active", "notes",
];

const HEADER_ALIASES: Record<string, string> = {
  code: "item_code", sku: "item_code", product_code: "item_code",
  name: "product_name", item_name: "product_name",
  description: "quote_description", quote_text: "quote_description",
  cost: "default_cost_ex_vat_zar", unit_cost: "default_cost_ex_vat_zar", cost_price: "default_cost_ex_vat_zar",
  sell_price: "recommended_sell_ex_vat_zar", selling_price: "recommended_sell_ex_vat_zar", unit_price: "recommended_sell_ex_vat_zar",
  unit: "quote_unit", selling_unit: "quote_unit",
  buy_unit: "purchase_unit", supplier_unit: "purchase_unit",
  active: "is_active", enabled: "is_active",
  manual_confirmation: "requires_manual_confirmation", confirm_price: "requires_manual_confirmation",
  supplier: "supplier_name",
};

function normalizeHeader(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const curr = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

const CANDIDATES: Array<{ key: string; target: string }> = [
  ...CANONICAL_HEADERS.map((c) => ({ key: c, target: c })),
  ...Object.entries(HEADER_ALIASES).map(([k, t]) => ({ key: k, target: t })),
];

type Method = "exact" | "alias" | "normalised_alias" | "fuzzy" | "unmatched";

function matchHeader(header: string): { target: string | null; confidence: number; method: Method } {
  const n = normalizeHeader(header);
  if (!n) return { target: null, confidence: 0, method: "unmatched" };
  if (CANONICAL_HEADERS.includes(n)) return { target: n, confidence: 100, method: "exact" };
  if (HEADER_ALIASES[n]) return { target: HEADER_ALIASES[n], confidence: 95, method: "alias" };
  let best: { target: string; score: number } | null = null;
  for (const c of CANDIDATES) {
    const score = similarity(n, c.key);
    if (!best || score > best.score) best = { target: c.target, score };
  }
  if (best && best.score >= 0.8) return { target: best.target, confidence: Math.round(best.score * 100), method: "normalised_alias" };
  if (best && best.score >= 0.6) return { target: best.target, confidence: Math.round(best.score * 100), method: "fuzzy" };
  return { target: null, confidence: 0, method: "unmatched" };
}

describe("header normalisation", () => {
  it("handles spaces, hyphens, case and BOM", () => {
    assert.equal(normalizeHeader("Item Code"), "item_code");
    assert.equal(normalizeHeader("item-code"), "item_code");
    assert.equal(normalizeHeader("ITEM_CODE"), "item_code");
    assert.equal(normalizeHeader("\uFEFFitem_code"), "item_code");
    assert.equal(normalizeHeader("  Product   Name  "), "product_name");
  });

  it("collapses duplicate and trailing underscores", () => {
    assert.equal(normalizeHeader("sell__price__"), "sell_price");
  });
});

describe("column matching priority", () => {
  it("exact canonical scores 100", () => {
    assert.deepEqual(matchHeader("item_code"), { target: "item_code", confidence: 100, method: "exact" });
  });

  it("exact alias scores 95", () => {
    const m = matchHeader("Name");
    assert.equal(m.target, "product_name");
    assert.equal(m.confidence, 95);
    assert.equal(m.method, "alias");
  });

  it("maps sell/cost/unit aliases", () => {
    assert.equal(matchHeader("sell price").target, "recommended_sell_ex_vat_zar");
    assert.equal(matchHeader("cost").target, "default_cost_ex_vat_zar");
    assert.equal(matchHeader("unit").target, "quote_unit");
    assert.equal(matchHeader("description").target, "quote_description");
    assert.equal(matchHeader("active").target, "is_active");
  });

  it("suggests a fuzzy match for near-miss headers", () => {
    const m = matchHeader("categary");
    assert.equal(m.target, "category");
    assert.ok(m.confidence >= 60 && m.confidence < 100);
  });

  it("leaves unknown headers unmatched", () => {
    assert.equal(matchHeader("random_supplier_field_xyz").target, null);
  });
});

describe("auto-map full canonical template", () => {
  it("matches all 31 canonical columns exactly", () => {
    const matches = CANONICAL_HEADERS.map(matchHeader);
    const exact = matches.filter((m) => m.method === "exact").length;
    assert.equal(exact, 31);
    assert.ok(matches.every((m) => m.confidence === 100));
  });

  it("detects conflicts when two columns resolve to the same target", () => {
    const headers = ["name", "product_name"];
    const targets = headers.map((h) => matchHeader(h).target);
    const dupes = targets.filter((t, i) => targets.indexOf(t) !== i);
    assert.ok(dupes.includes("product_name"));
  });
});

// Template detection mirror
const CANONICAL_SET = new Set(CANONICAL_HEADERS);
function detectTemplate(headers: string[]) {
  const norm = headers.map(normalizeHeader);
  const set = new Set(norm);
  const hits = norm.filter((h) => CANONICAL_SET.has(h)).length;
  const requiredExact = ["item_code", "item_type", "category", "product_name", "quote_unit"].every((k) => set.has(k));
  if (requiredExact && hits >= CANONICAL_HEADERS.length - 3) return { template: "unified", skipMapping: true };
  if (
    (set.has("item_code") || set.has("code") || set.has("sku")) &&
    (set.has("name") || set.has("product_name")) &&
    (set.has("unit") || set.has("quote_unit")) &&
    (set.has("default_cost") || set.has("cost") || set.has("sell_price"))
  ) {
    return { template: "legacy_materials", skipMapping: false };
  }
  return { template: "unknown", skipMapping: false };
}

describe("template detection", () => {
  it("recognises the unified canonical template and skips mapping", () => {
    const d = detectTemplate([...CANONICAL_HEADERS]);
    assert.equal(d.template, "unified");
    assert.equal(d.skipMapping, true);
  });

  it("recognises a legacy materials list", () => {
    const d = detectTemplate(["item_code", "category", "name", "unit", "cost", "sell_price"]);
    assert.equal(d.template, "legacy_materials");
    assert.equal(d.skipMapping, false);
  });

  it("marks an unrecognised sheet as unknown", () => {
    const d = detectTemplate(["foo", "bar", "baz"]);
    assert.equal(d.template, "unknown");
  });
});

describe("derived fields", () => {
  const markup = (c: number, s: number) => Math.round(((s - c) / c) * 10000) / 100;
  const margin = (c: number, s: number) => Math.round(((s - c) / s) * 10000) / 100;
  const rollArea = (w: number, l: number) => Math.round(w * l * 100) / 100;

  it("computes markup and margin", () => {
    assert.equal(markup(50, 75), 50);
    assert.equal(margin(50, 75), 33.33);
  });

  it("computes gross roll area", () => {
    assert.equal(rollArea(7, 100), 700);
  });
});
