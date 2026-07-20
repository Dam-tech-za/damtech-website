import { z } from "zod";
import {
  CANONICAL_HEADERS,
  ITEM_TYPE_ALIASES,
  inferItemTypeFromCategory,
  type CanonicalHeader,
} from "./columns";
import { getImportLimits } from "./parse";

export const APPROVED_IMPORT_UNITS = [
  "each",
  "item",
  "roll",
  "pail",
  "bag",
  "box",
  "cartridge",
  "kit",
  "set",
  "litre",
  "kg",
  "m",
  "m²",
  "m³",
  "km",
  "hour",
  "day",
  "crew-day",
  "person-day",
  "person-night",
  "tank",
  "kL",
  "lump sum",
  "percentage",
] as const;

const UNIT_ALIASES: Record<string, (typeof APPROVED_IMPORT_UNITS)[number]> = {
  m2: "m²",
  sqm: "m²",
  "square metre": "m²",
  "square meter": "m²",
  "m²": "m²",
  m3: "m³",
  "m³": "m³",
  kl: "kL",
  "kℓ": "kL",
  ea: "each",
  each: "each",
  ls: "lump sum",
  "lump sum": "lump sum",
  liters: "litre",
  litres: "litre",
  liter: "litre",
  litre: "litre",
  hrs: "hour",
  hr: "hour",
  hour: "hour",
  day: "day",
  days: "day",
  km: "km",
  roll: "roll",
  rolls: "roll",
  pail: "pail",
  bag: "bag",
  box: "box",
  cartridge: "cartridge",
  kit: "kit",
  set: "set",
  kg: "kg",
  m: "m",
  item: "item",
  tank: "tank",
  percentage: "percentage",
  "%": "percentage",
  "crew-day": "crew-day",
  "person-day": "person-day",
  "person-night": "person-night",
};

export function normaliseImportUnit(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const key = String(raw).trim().toLowerCase();
  return UNIT_ALIASES[key] ?? String(raw).trim();
}

export function normaliseItemCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function parseOptionalNumber(raw: unknown): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(/,/g, "").trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseBoolean(raw: unknown, fallback = true): boolean {
  if (raw == null || String(raw).trim() === "") return fallback;
  const v = String(raw).trim().toLowerCase();
  if (["true", "yes", "1", "active", "y"].includes(v)) return true;
  if (["false", "no", "0", "inactive", "n"].includes(v)) return false;
  return fallback;
}

const TAX_ALIASES: Record<string, string> = {
  standard: "standard",
  zero_rated: "zero_rated",
  zero: "zero_rated",
  exempt: "exempt",
  no_vat: "no_vat",
  none: "no_vat",
};

export type InventoryImportRow = {
  item_code: string;
  item_type: string;
  category: string;
  product_name: string;
  quote_description: string;
  purchase_unit: string | null;
  quote_unit: string;
  conversion_factor: number;
  default_cost_ex_vat_zar: number | null;
  recommended_sell_ex_vat_zar: number | null;
  pricing_method: string;
  default_markup_percent: number | null;
  target_margin_percent: number | null;
  tax_category: string;
  waste_percent: number;
  overlap_percent: number;
  coverage_rate: number | null;
  coverage_unit: string | null;
  roll_width_m: number | null;
  roll_length_m: number | null;
  pack_size: number | null;
  thickness_mm: number | null;
  gsm: number | null;
  supplier_name: string | null;
  source_reference: string | null;
  source_url: string | null;
  price_date: string | null;
  confidence: string | null;
  requires_manual_confirmation: boolean;
  is_active: boolean;
  notes: string | null;
};

export type RowValidationResult = {
  rowNumber: number;
  status:
    | "ready"
    | "ready_with_warning"
    | "duplicate"
    | "invalid"
    | "missing_price"
    | "manual_confirmation";
  data: InventoryImportRow | null;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  existingPricingItemId?: string | null;
  markupPercent: number | null;
  marginPercent: number | null;
  excluded?: boolean;
};

const itemCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9_-]*$/, "Item code must be A–Z, 0–9, hyphen or underscore");

export function mapRawRow(
  cells: string[],
  csvHeaders: string[],
  mapping: Record<string, CanonicalHeader | "">,
): Record<string, string> {
  const raw: Record<string, string> = {};
  csvHeaders.forEach((header, index) => {
    const target = mapping[header];
    if (!target) return;
    raw[target] = cells[index] ?? "";
  });
  return raw;
}

export function validateMappedRow(
  raw: Record<string, string>,
  rowNumber: number,
  seenCodes: Set<string>,
): RowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const codeRaw = raw.item_code ?? "";
  const normalisedCode = codeRaw ? normaliseItemCode(codeRaw) : "";
  if (!normalisedCode) {
    errors.push("item_code is required");
  } else {
    const parsed = itemCodeSchema.safeParse(normalisedCode);
    if (!parsed.success) errors.push(parsed.error.issues[0]?.message ?? "Invalid item_code");
    if (codeRaw.trim() !== normalisedCode) {
      warnings.push(`Item code normalised to ${normalisedCode}`);
    }
    if (seenCodes.has(normalisedCode)) {
      errors.push(`Duplicate item_code within CSV: ${normalisedCode}`);
    } else {
      seenCodes.add(normalisedCode);
    }
  }

  const category = (raw.category ?? "").trim();
  if (!category) errors.push("category is required");

  const productName = (raw.product_name ?? "").trim();
  if (!productName) errors.push("product_name / name is required");

  let itemTypeRaw = (raw.item_type ?? "").trim().toLowerCase();
  if (!itemTypeRaw && category) itemTypeRaw = inferItemTypeFromCategory(category);
  const itemType = ITEM_TYPE_ALIASES[itemTypeRaw] ?? "";
  if (!itemType) errors.push(`Unknown item_type: ${raw.item_type || "(empty)"}`);

  const quoteDescription = (raw.quote_description ?? productName).trim();
  if (!quoteDescription && itemType !== "other") {
    errors.push("quote_description is required for quotable items");
  }

  const quoteUnit = normaliseImportUnit(raw.quote_unit);
  if (!quoteUnit) errors.push("quote_unit is required");
  else if (!(APPROVED_IMPORT_UNITS as readonly string[]).includes(quoteUnit)) {
    errors.push(`Unsupported quote_unit: ${raw.quote_unit}`);
  }

  const purchaseUnit = normaliseImportUnit(raw.purchase_unit);

  const conversion = parseOptionalNumber(raw.conversion_factor);
  const conversionFactor = conversion == null ? 1 : conversion;
  if (conversionFactor <= 0) errors.push("conversion_factor must be > 0");

  const cost = parseOptionalNumber(raw.default_cost_ex_vat_zar);
  const sell = parseOptionalNumber(raw.recommended_sell_ex_vat_zar);
  if (cost != null && cost < 0) errors.push("cost must be ≥ 0");
  if (sell != null && sell < 0) errors.push("sell price must be ≥ 0");

  const markup = parseOptionalNumber(raw.default_markup_percent);
  const margin = parseOptionalNumber(raw.target_margin_percent);
  if (markup != null && markup < 0) errors.push("markup must be ≥ 0");
  if (margin != null && margin >= 100) errors.push("margin must be below 100%");

  const waste = parseOptionalNumber(raw.waste_percent) ?? 0;
  const overlap = parseOptionalNumber(raw.overlap_percent) ?? 0;
  if (waste < 0 || waste > 50) warnings.push("waste_percent outside typical 0–50% range");
  if (overlap < 0 || overlap > 50) warnings.push("overlap_percent outside typical 0–50% range");

  const taxRaw = (raw.tax_category ?? "standard").trim().toLowerCase() || "standard";
  const taxCategory = TAX_ALIASES[taxRaw] ?? "";
  if (!taxCategory) errors.push(`Unknown tax_category: ${raw.tax_category}`);

  const rollWidth = parseOptionalNumber(raw.roll_width_m);
  const rollLength = parseOptionalNumber(raw.roll_length_m);
  const packSize = parseOptionalNumber(raw.pack_size);
  const thickness = parseOptionalNumber(raw.thickness_mm);
  const gsm = parseOptionalNumber(raw.gsm);
  const coverage = parseOptionalNumber(raw.coverage_rate);

  for (const [label, value] of [
    ["roll_width_m", rollWidth],
    ["roll_length_m", rollLength],
    ["pack_size", packSize],
    ["thickness_mm", thickness],
    ["gsm", gsm],
  ] as const) {
    if (value != null && value <= 0) errors.push(`${label} must be > 0 when provided`);
  }

  const categoryLower = category.toLowerCase();
  const isHdpe = categoryLower.includes("hdpe") || normalisedCode.includes("HDPE");
  const isGeotex = categoryLower.includes("geotextile");
  const isTorch = categoryLower.includes("torch");
  const isLiquid = categoryLower.includes("liquid");

  if (isHdpe) {
    if (quoteUnit && quoteUnit !== "m²") {
      warnings.push("HDPE quote unit is normally m²");
    }
    if (thickness == null && !/HDPE-\d+/.test(normalisedCode)) {
      warnings.push("HDPE thickness_mm not supplied");
    }
    if (rollWidth != null && rollLength != null) {
      const gross = Math.round(rollWidth * rollLength * 100) / 100;
      if (conversionFactor > gross * 1.01) {
        warnings.push(`Usable conversion_factor ${conversionFactor} exceeds gross roll area ${gross}`);
      }
    }
  }
  if (isGeotex && gsm == null) warnings.push("Geotextile GSM not supplied");
  if (isTorch && thickness == null) warnings.push("Torch-on thickness_mm not supplied");
  if (isLiquid && packSize == null && purchaseUnit === "pail") {
    warnings.push("Liquid pack_size not supplied");
  }

  const confidence = (raw.confidence ?? "").trim().toLowerCase() || null;
  const requiresManual = parseBoolean(raw.requires_manual_confirmation, false);
  const isActive = parseBoolean(raw.is_active, true);

  let markupPercent: number | null = null;
  let marginPercent: number | null = null;
  if (cost != null && cost > 0 && sell != null) {
    markupPercent = Math.round(((sell - cost) / cost) * 10000) / 100;
    marginPercent = sell > 0 ? Math.round(((sell - cost) / sell) * 10000) / 100 : null;
  }
  if (markup != null && markupPercent != null && Math.abs(markup - markupPercent) > 2) {
    warnings.push(
      `Imported markup ${markup}% differs from calculated ${markupPercent}% — selling price takes precedence`,
    );
  }
  if (margin != null && marginPercent != null && Math.abs(margin - marginPercent) > 2) {
    warnings.push(
      `Imported margin ${margin}% differs from calculated ${marginPercent}% — selling price takes precedence`,
    );
  }

  const missingPrice =
    (sell == null || sell === 0) && (cost == null || cost === 0);
  if (missingPrice) {
    warnings.push("Missing or zero price — Supplier or model-specific price required");
  }
  if (confidence === "low") {
    warnings.push("Low confidence — not approved supplier pricing");
  }
  if (confidence === "none" && (sell == null || sell === 0)) {
    warnings.push("Supplier or model-specific price required");
  }
  if (requiresManual) {
    warnings.push("Provisional starting price — confirm before live quotation");
  }

  const pricingMethod =
    (raw.pricing_method ?? "").trim() ||
    (itemType === "travel"
      ? "travel_calculation"
      : itemType === "labour" || itemType === "installation_service"
        ? "labour_productivity"
        : "unit_rate");

  const data: InventoryImportRow | null =
    errors.length === 0
      ? {
          item_code: normalisedCode,
          item_type: itemType,
          category,
          product_name: productName,
          quote_description: quoteDescription || productName,
          purchase_unit: purchaseUnit,
          quote_unit: quoteUnit!,
          conversion_factor: conversionFactor,
          default_cost_ex_vat_zar: cost,
          recommended_sell_ex_vat_zar: sell,
          pricing_method: pricingMethod,
          default_markup_percent: markup,
          target_margin_percent: margin,
          tax_category: taxCategory || "standard",
          waste_percent: waste,
          overlap_percent: overlap,
          coverage_rate: coverage,
          coverage_unit: normaliseImportUnit(raw.coverage_unit),
          roll_width_m: rollWidth,
          roll_length_m: rollLength,
          pack_size: packSize,
          thickness_mm: thickness,
          gsm,
          supplier_name: (raw.supplier_name ?? "").trim() || null,
          source_reference: (raw.source_reference ?? "").trim() || null,
          source_url: (raw.source_url ?? "").trim() || null,
          price_date: (raw.price_date ?? "").trim() || null,
          confidence,
          requires_manual_confirmation: requiresManual || missingPrice,
          is_active: isActive,
          notes: (raw.notes ?? "").trim() || null,
        }
      : null;

  let status: RowValidationResult["status"] = "ready";
  if (errors.length) status = "invalid";
  else if (requiresManual || missingPrice) status = "manual_confirmation";
  else if (missingPrice) status = "missing_price";
  else if (warnings.length) status = "ready_with_warning";

  return {
    rowNumber,
    status,
    data,
    raw,
    errors,
    warnings,
    markupPercent,
    marginPercent,
  };
}

export function validateCsvAgainstLimits(rowCount: number): string | null {
  const { maxRows } = getImportLimits();
  if (rowCount > maxRows) return `CSV exceeds maximum of ${maxRows} data rows.`;
  return null;
}

export { CANONICAL_HEADERS };
