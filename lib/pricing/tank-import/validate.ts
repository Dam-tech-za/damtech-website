import { z } from "zod";
import { parseOptionalNumber, parseBoolean } from "./csv-lite.ts";
import type { TankCanonicalHeader } from "./columns.ts";
import {
  CAPACITY_TOLERANCE,
  DEFAULT_USABLE_FACTOR,
  computeGeometry,
  computeNominalCapacityKl,
  computeTotalSell,
  expectedRingCount,
  pricePerUsableKl,
  withinTolerance,
} from "./geometry.ts";

export const CONFIDENCE_VALUES = ["high", "medium", "low", "none"] as const;

export type TankImportRow = {
  tank_code: string;
  model_name: string;
  diameter_m: number;
  height_m: number;
  ring_count: number;
  nominal_capacity_kl: number;
  usable_capacity_kl: number;
  usable_capacity_generated: boolean;
  steel_tank_cost_ex_vat_zar: number | null;
  steel_tank_sell_ex_vat_zar: number | null;
  pvc_liner_cost_ex_vat_zar: number | null;
  pvc_liner_sell_ex_vat_zar: number | null;
  total_sell_ex_vat_zar: number;
  roof_included: boolean;
  roof_sell_ex_vat_zar: number | null;
  foundation_included: boolean;
  foundation_sell_ex_vat_zar: number | null;
  installation_included: boolean;
  installation_sell_ex_vat_zar: number | null;
  default_inlet_mm: number | null;
  default_outlet_mm: number | null;
  default_overflow_mm: number | null;
  default_drain_mm: number | null;
  supplier_name: string | null;
  supplier_model_code: string | null;
  lead_time_days: number | null;
  price_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  confidence: string | null;
  requires_manual_confirmation: boolean;
  is_active: boolean;
  notes: string | null;
  wall_area_m2: number;
  floor_area_m2: number;
  liner_area_m2: number;
  steel_price_per_usable_kl: number | null;
  combined_price_per_usable_kl: number | null;
};

export type TankRowStatus =
  | "ready"
  | "ready_with_warning"
  | "duplicate"
  | "invalid"
  | "manual_confirmation";

export type TankRowValidationResult = {
  rowNumber: number;
  status: TankRowStatus;
  data: TankImportRow | null;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  existingTankModelId?: string | null;
  excluded?: boolean;
};

const tankCodeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Tank code must be uppercase letters, numbers and hyphens");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normaliseTankCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function mapTankRawRow(
  cells: string[],
  csvHeaders: string[],
  mapping: Record<string, TankCanonicalHeader | "">,
): Record<string, string> {
  const raw: Record<string, string> = {};
  csvHeaders.forEach((header, index) => {
    const target = mapping[header];
    if (!target) return;
    raw[target] = cells[index] ?? "";
  });
  return raw;
}

function optInt(raw: unknown): number | null {
  const n = parseOptionalNumber(raw);
  if (n == null) return null;
  return Math.round(n);
}

export function validateTankRow(
  raw: Record<string, string>,
  rowNumber: number,
  seenCodes: Set<string>,
): TankRowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Code ---
  const codeRaw = raw.tank_code ?? "";
  const code = codeRaw ? normaliseTankCode(codeRaw) : "";
  if (!code) {
    errors.push("tank_code is required");
  } else {
    const parsed = tankCodeSchema.safeParse(code);
    if (!parsed.success) errors.push(parsed.error.issues[0]?.message ?? "Invalid tank_code");
    if (codeRaw.trim() !== code) warnings.push(`Tank code normalised to ${code}`);
    if (seenCodes.has(code)) errors.push(`Duplicate tank_code within CSV: ${code}`);
    else seenCodes.add(code);
  }

  const modelName = (raw.model_name ?? "").trim();
  if (!modelName) errors.push("model_name is required");

  // --- Geometry ---
  const diameter = parseOptionalNumber(raw.diameter_m);
  const height = parseOptionalNumber(raw.height_m);
  const ringCount = optInt(raw.ring_count);

  if (diameter == null || diameter <= 0) errors.push("diameter_m must be a positive number");
  if (height == null || height <= 0) errors.push("height_m must be a positive number");
  if (ringCount == null || ringCount <= 0) errors.push("ring_count must be a positive integer");

  // --- Capacity ---
  let nominal = parseOptionalNumber(raw.nominal_capacity_kl);
  if (nominal == null || nominal <= 0) {
    if (diameter != null && height != null && diameter > 0 && height > 0) {
      nominal = computeNominalCapacityKl(diameter, height);
      warnings.push(`nominal_capacity_kl derived from geometry (${nominal} kL)`);
    } else {
      errors.push("nominal_capacity_kl must be a positive number");
    }
  } else if (diameter != null && height != null && diameter > 0 && height > 0) {
    const expected = computeNominalCapacityKl(diameter, height);
    if (!withinTolerance(nominal, expected)) {
      warnings.push(
        `nominal_capacity_kl ${nominal} differs from calculated ${expected} kL by more than ${Math.round(
          CAPACITY_TOLERANCE * 100,
        )}%`,
      );
    }
  }

  let usable = parseOptionalNumber(raw.usable_capacity_kl);
  let usableGenerated = false;
  if (usable == null || usable <= 0) {
    if (nominal != null && nominal > 0) {
      usable = Math.round(nominal * DEFAULT_USABLE_FACTOR * 10) / 10;
      usableGenerated = true;
      warnings.push(
        `usable_capacity_kl generated at ${Math.round(DEFAULT_USABLE_FACTOR * 100)}% of nominal (${usable} kL)`,
      );
    } else {
      errors.push("usable_capacity_kl must be a positive number");
    }
  }
  if (usable != null && nominal != null && usable > nominal) {
    errors.push("usable_capacity_kl cannot exceed nominal_capacity_kl");
  }

  // --- Ring/height consistency ---
  if (height != null && ringCount != null) {
    const expectedRings = expectedRingCount(height);
    if (expectedRings != null && expectedRings !== ringCount) {
      warnings.push(
        `ring_count ${ringCount} does not match expected ${expectedRings} for ${height} m height`,
      );
    }
  }

  // --- Prices ---
  const steelCost = parseOptionalNumber(raw.steel_tank_cost_ex_vat_zar);
  const steelSell = parseOptionalNumber(raw.steel_tank_sell_ex_vat_zar);
  const linerCost = parseOptionalNumber(raw.pvc_liner_cost_ex_vat_zar);
  const linerSell = parseOptionalNumber(raw.pvc_liner_sell_ex_vat_zar);
  const roofSell = parseOptionalNumber(raw.roof_sell_ex_vat_zar);
  const foundationSell = parseOptionalNumber(raw.foundation_sell_ex_vat_zar);
  const installationSell = parseOptionalNumber(raw.installation_sell_ex_vat_zar);
  const suppliedTotal = parseOptionalNumber(raw.total_sell_ex_vat_zar);

  const roofIncluded = parseBoolean(raw.roof_included, false);
  const foundationIncluded = parseBoolean(raw.foundation_included, false);
  const installationIncluded = parseBoolean(raw.installation_included, false);

  for (const [label, value] of [
    ["steel_tank_cost_ex_vat_zar", steelCost],
    ["steel_tank_sell_ex_vat_zar", steelSell],
    ["pvc_liner_cost_ex_vat_zar", linerCost],
    ["pvc_liner_sell_ex_vat_zar", linerSell],
    ["roof_sell_ex_vat_zar", roofSell],
    ["foundation_sell_ex_vat_zar", foundationSell],
    ["installation_sell_ex_vat_zar", installationSell],
  ] as const) {
    if (value != null && value < 0) errors.push(`${label} must be ≥ 0`);
  }

  const requiresManual = parseBoolean(raw.requires_manual_confirmation, false);
  const isActive = parseBoolean(raw.is_active, true);

  // Steel sell is required; zero only with manual confirmation.
  if (steelSell == null) {
    errors.push("steel_tank_sell_ex_vat_zar is required");
  } else if (steelSell === 0 && !requiresManual) {
    warnings.push("Steel tank sell price is zero — requires manual confirmation before quotation");
  }

  if (steelCost != null && steelSell != null && steelSell > 0 && steelSell < steelCost) {
    warnings.push("Steel tank sell price is below cost");
  }
  if (linerCost != null && linerSell != null && linerSell > 0 && linerSell < linerCost) {
    warnings.push("PVC liner sell price is below cost");
  }

  // PVC liner price may be zero only with manual confirmation.
  const linerMissing = linerSell == null || linerSell === 0;
  if (linerMissing) {
    warnings.push("PVC liner price required before quotation.");
  }

  const total = computeTotalSell({
    steelSell,
    linerSell,
    roofIncluded,
    roofSell,
    foundationIncluded,
    foundationSell,
    installationIncluded,
    installationSell,
  });
  if (suppliedTotal != null && Math.abs(suppliedTotal - total) > 1) {
    warnings.push(
      `total_sell_ex_vat_zar ${suppliedTotal} differs from calculated ${total}; calculated total will be used`,
    );
  }

  // --- Dates ---
  for (const [label, value] of [
    ["price_date", raw.price_date],
    ["valid_from", raw.valid_from],
    ["valid_to", raw.valid_to],
  ] as const) {
    const v = (value ?? "").trim();
    if (v && !ISO_DATE.test(v)) errors.push(`${label} must be ISO format YYYY-MM-DD`);
  }
  const validFrom = (raw.valid_from ?? "").trim() || null;
  const validTo = (raw.valid_to ?? "").trim() || null;
  if (validFrom && validTo && ISO_DATE.test(validFrom) && ISO_DATE.test(validTo) && validTo < validFrom) {
    errors.push("valid_to must not precede valid_from");
  }

  // --- Confidence ---
  const confidenceRaw = (raw.confidence ?? "").trim().toLowerCase();
  let confidence: string | null = confidenceRaw || null;
  if (confidence && !(CONFIDENCE_VALUES as readonly string[]).includes(confidence)) {
    warnings.push(`Unknown confidence "${confidence}" — defaulting to medium`);
    confidence = "medium";
  }
  if (confidence === "low" || confidence === "none") {
    warnings.push("Low/none confidence — confirm before live quotation");
  }
  if (requiresManual) {
    warnings.push("Provisional pricing — confirm before final customer quotation");
  }

  // --- Fittings & misc ---
  const inlet = optInt(raw.default_inlet_mm);
  const outlet = optInt(raw.default_outlet_mm);
  const overflow = optInt(raw.default_overflow_mm);
  const drain = optInt(raw.default_drain_mm);
  for (const [label, value] of [
    ["default_inlet_mm", inlet],
    ["default_outlet_mm", outlet],
    ["default_overflow_mm", overflow],
    ["default_drain_mm", drain],
    ["lead_time_days", optInt(raw.lead_time_days)],
  ] as const) {
    if (value != null && value < 0) errors.push(`${label} must be ≥ 0 when provided`);
  }

  const geometry =
    diameter != null && height != null ? computeGeometry(diameter, height) : {
      wallAreaM2: 0,
      floorAreaM2: 0,
      linerAreaM2: 0,
    };

  const data: TankImportRow | null =
    errors.length === 0 && diameter != null && height != null && ringCount != null && nominal != null && usable != null
      ? {
          tank_code: code,
          model_name: modelName,
          diameter_m: diameter,
          height_m: height,
          ring_count: ringCount,
          nominal_capacity_kl: nominal,
          usable_capacity_kl: usable,
          usable_capacity_generated: usableGenerated,
          steel_tank_cost_ex_vat_zar: steelCost,
          steel_tank_sell_ex_vat_zar: steelSell,
          pvc_liner_cost_ex_vat_zar: linerCost,
          pvc_liner_sell_ex_vat_zar: linerSell,
          total_sell_ex_vat_zar: total,
          roof_included: roofIncluded,
          roof_sell_ex_vat_zar: roofSell,
          foundation_included: foundationIncluded,
          foundation_sell_ex_vat_zar: foundationSell,
          installation_included: installationIncluded,
          installation_sell_ex_vat_zar: installationSell,
          default_inlet_mm: inlet,
          default_outlet_mm: outlet,
          default_overflow_mm: overflow,
          default_drain_mm: drain,
          supplier_name: (raw.supplier_name ?? "").trim() || null,
          supplier_model_code: (raw.supplier_model_code ?? "").trim() || null,
          lead_time_days: optInt(raw.lead_time_days),
          price_date: (raw.price_date ?? "").trim() || null,
          valid_from: validFrom,
          valid_to: validTo,
          confidence,
          requires_manual_confirmation: requiresManual || linerMissing,
          is_active: isActive,
          notes: (raw.notes ?? "").trim() || null,
          wall_area_m2: geometry.wallAreaM2,
          floor_area_m2: geometry.floorAreaM2,
          liner_area_m2: geometry.linerAreaM2,
          steel_price_per_usable_kl: pricePerUsableKl(steelSell, usable),
          combined_price_per_usable_kl: pricePerUsableKl(total, usable),
        }
      : null;

  let status: TankRowStatus = "ready";
  if (errors.length) status = "invalid";
  else if (requiresManual || linerMissing || (steelSell != null && steelSell === 0)) {
    status = "manual_confirmation";
  } else if (warnings.length) status = "ready_with_warning";

  return { rowNumber, status, data, raw, errors, warnings };
}
