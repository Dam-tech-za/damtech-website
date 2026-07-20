import assert from "node:assert/strict";
import { describe, it } from "node:test";

function stripBom(text: string) {
  if (text.charCodeAt(0) === 0xfeff || text.startsWith("\uFEFF")) {
    return { text: text.replace(/^\uFEFF/, ""), hadBom: true };
  }
  return { text, hadBom: false };
}

function detectDelimiter(headerLine: string): "," | ";" | "\t" {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function splitCsvLine(line: string, delimiter: "," | ";" | "\t"): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsvText(raw: string) {
  const { text, hadBom } = stripBom(raw);
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const lines = normalised.split("\n").filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = splitCsvLine(lines[0] ?? "", delimiter);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  return { headers, rows, delimiter, hadBom };
}

const ALIASES: Record<string, string> = {
  name: "product_name",
  cost: "default_cost_ex_vat_zar",
  sell_price: "recommended_sell_ex_vat_zar",
  unit: "quote_unit",
  code: "item_code",
  description: "quote_description",
};

function autoMap(headers: string[]) {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const key = h.trim().toLowerCase();
    mapping[h] = ALIASES[key] ?? key;
  }
  return mapping;
}

function normaliseItemCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

function normaliseUnit(raw: string) {
  const key = raw.trim().toLowerCase();
  if (key === "m2" || key === "sqm") return "m²";
  if (key === "ea") return "each";
  return raw.trim();
}

describe("csv parse", () => {
  it("strips UTF-8 BOM", () => {
    const { text, hadBom } = stripBom("\uFEFFitem_code,name\nA,B");
    assert.equal(hadBom, true);
    assert.equal(text.startsWith("item_code"), true);
  });

  it("preserves m² symbols", () => {
    const parsed = parseCsvText("unit\nm²");
    assert.equal(parsed.rows[0][0], "m²");
  });

  it("detects semicolon delimiter", () => {
    assert.equal(detectDelimiter("a;b;c"), ";");
    const parsed = parseCsvText("item_code;name\nHDPE-1;Test");
    assert.equal(parsed.delimiter, ";");
    assert.equal(parsed.rows[0][0], "HDPE-1");
  });
});

describe("header mapping", () => {
  it("maps starter CSV headers", () => {
    const mapping = autoMap([
      "item_code",
      "category",
      "name",
      "cost",
      "sell_price",
      "quote_unit",
    ]);
    assert.equal(mapping.name, "product_name");
    assert.equal(mapping.cost, "default_cost_ex_vat_zar");
    assert.equal(mapping.sell_price, "recommended_sell_ex_vat_zar");
  });
});

describe("validation helpers", () => {
  it("normalises item codes and units", () => {
    assert.equal(normaliseItemCode("lin-hdpe-1500-sm"), "LIN-HDPE-1500-SM");
    assert.equal(normaliseUnit("m2"), "m²");
    assert.equal(normaliseUnit("sqm"), "m²");
    assert.equal(normaliseUnit("ea"), "each");
  });

  it("rejects invalid item codes", () => {
    const code = normaliseItemCode("bad code!");
    assert.equal(/^[A-Z0-9][A-Z0-9_-]*$/.test(code), false);
  });

  it("accepts valid starter codes", () => {
    assert.equal(/^[A-Z0-9][A-Z0-9_-]*$/.test(normaliseItemCode("HDPE-15-SMOOTH")), true);
  });
});

describe("prepare starter csv", () => {
  it("parses Damtech starter format end-to-end", () => {
    const csv = `\uFEFFitem_code,category,name,purchase_unit,quote_unit,conversion_factor,cost,sell_price,tax_category,waste_percent,overlap_percent
HDPE-10-SMOOTH,HDPE geomembrane,1.0 mm smooth HDPE geomembrane,roll,m²,1050,45,72,standard,10,8
HDPE-15-SMOOTH,HDPE geomembrane,1.5 mm smooth HDPE geomembrane,roll,m²,1050,58,92,standard,10,8`;
    const prepared = parseCsvText(csv);
    const mapping = autoMap(prepared.headers);
    assert.equal(prepared.hadBom, true);
    assert.equal(prepared.rows.length, 2);
    assert.equal(mapping.name, "product_name");
    assert.equal(mapping.cost, "default_cost_ex_vat_zar");
    const nameIdx = prepared.headers.indexOf("name");
    const costIdx = prepared.headers.indexOf("cost");
    assert.equal(prepared.rows[0][nameIdx].includes("1.0 mm"), true);
    assert.equal(prepared.rows[0][costIdx], "45");
    assert.equal(normaliseUnit(prepared.rows[0][prepared.headers.indexOf("quote_unit")]), "m²");
  });
});
