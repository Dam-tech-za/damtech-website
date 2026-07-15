import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Soft size parse + enquiry channel helpers inlined for Node strip-types tests
 * (avoid path-alias imports).
 */

function parseNumberToken(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function softParseProjectSize(text: string) {
  const result = {
    estimated_area_m2: null as number | null,
    estimated_capacity_kl: null as number | null,
    estimated_diameter_m: null as number | null,
    estimated_height_m: null as number | null,
  };
  const input = text.trim();
  if (!input) return result;

  const areaMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*(m²|m2|sq\.?\s*m|square\s*metres?)/i,
  );
  if (areaMatch) {
    const n = parseNumberToken(areaMatch[1]);
    if (n != null) result.estimated_area_m2 = n;
  }

  const klMatch = input.match(/(\d[\d\s,]*(?:\.\d+)?)\s*(k\s*l|kl|kilolitres?)/i);
  if (klMatch) {
    const n = parseNumberToken(klMatch[1]);
    if (n != null) result.estimated_capacity_kl = n;
  } else {
    const litreMatch = input.match(
      /(\d[\d\s,]*(?:\.\d+)?)\s*(l|litres?|liters?)\b/i,
    );
    if (litreMatch) {
      const n = parseNumberToken(litreMatch[1]);
      if (n != null) result.estimated_capacity_kl = n / 1000;
    }
  }

  const diameterMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*m(?:etres?)?\s*(?:ø|diameter|dia\.?)/i,
  );
  if (diameterMatch) {
    const n = parseNumberToken(diameterMatch[1]);
    if (n != null) result.estimated_diameter_m = n;
  }

  const heightMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*m(?:etres?)?\s*(?:high|height|tall|wall)/i,
  );
  if (heightMatch) {
    const n = parseNumberToken(heightMatch[1]);
    if (n != null) result.estimated_height_m = n;
  }

  return result;
}

function enquiryChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "simple_public_rfq":
      return "Simple quote";
    case "calculator_quote_preparation":
      return "Calculator quote";
    case "contact_enquiry":
      return "Contact form";
    default:
      return "Unknown source";
  }
}

function measurementLabel(input: {
  assetCount: number;
  enquiry_channel?: string | null;
  site_measurement_required?: boolean;
}) {
  if (input.site_measurement_required) return "Site measurement required";
  if (input.assetCount === 0) {
    if (
      input.enquiry_channel === "simple_public_rfq" ||
      input.enquiry_channel === "contact_enquiry" ||
      !input.enquiry_channel
    ) {
      return "information not yet confirmed";
    }
    return "No assets yet";
  }
  return "Mixed";
}

describe("simple RFQ soft size parse", () => {
  it("parses area and capacity wording", () => {
    const soft = softParseProjectSize("About 5 000 m² liner or 250 kL tank");
    assert.equal(soft.estimated_area_m2, 5000);
    assert.equal(soft.estimated_capacity_kl, 250);
  });

  it("parses diameter and height", () => {
    const soft = softParseProjectSize("10 m diameter × 3 m high tank");
    assert.equal(soft.estimated_diameter_m, 10);
    assert.equal(soft.estimated_height_m, 3);
  });

  it("returns nulls for free text without units", () => {
    const soft = softParseProjectSize("medium farm dam");
    assert.equal(soft.estimated_area_m2, null);
    assert.equal(soft.estimated_capacity_kl, null);
  });
});

describe("simple vs calculator admin labels", () => {
  it("labels source channels for inbox badges", () => {
    assert.equal(enquiryChannelLabel("simple_public_rfq"), "Simple quote");
    assert.equal(
      enquiryChannelLabel("calculator_quote_preparation"),
      "Calculator quote",
    );
  });

  it("does not treat simple leads as incomplete assets", () => {
    assert.equal(
      measurementLabel({
        assetCount: 0,
        enquiry_channel: "simple_public_rfq",
      }),
      "information not yet confirmed",
    );
    assert.equal(
      measurementLabel({
        assetCount: 0,
        enquiry_channel: "calculator_quote_preparation",
      }),
      "No assets yet",
    );
  });
});
