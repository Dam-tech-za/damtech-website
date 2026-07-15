import {
  CALCULATORS,
  type CalculatorConfig,
  type CalculatorField,
} from "@/lib/calculators-config";
import { PROVINCE_OPTIONS, type ServiceOption } from "@/lib/form";
import type { CalculatorResult } from "@/lib/calculators-logic";

export const QUOTE_PREFILL_STORAGE_KEY = "damtech.quotePrefill";

export type QuotePrefill = {
  serviceRequired?: ServiceOption;
  projectSize?: string;
  projectLocation?: string;
  province?: string;
  company?: string;
  message: string;
  sourceCalculatorId: string;
  sourceCalculatorName: string;
  /** Structured calculator data for RFQ import (JSON string for form hidden field). */
  calculatorJson?: string;
};

type BuildQuotePrefillArgs = {
  calculatorId: string;
  formValues: Record<string, string>;
  result?: CalculatorResult | null;
};

function clean(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function getCalculator(id: string): CalculatorConfig | undefined {
  return CALCULATORS.find((calc) => calc.id === id);
}

function optionLabel(field: CalculatorField, raw: string): string {
  if (field.type === "select" && field.options?.length) {
    return field.options.find((option) => option.value === raw)?.label ?? raw;
  }
  return raw;
}

function formatFieldPair(field: CalculatorField, raw: string): string | null {
  const value = clean(raw);
  if (!value) return null;
  const display = optionLabel(field, value);
  const withUnit =
    field.unit && field.type === "number" && !display.includes(field.unit)
      ? `${display} ${field.unit}`
      : display;
  return `${field.label}: ${withUnit}`;
}

function detectProvince(location: string): string | undefined {
  const haystack = location.toLowerCase();
  for (const province of PROVINCE_OPTIONS) {
    if (province === "Other / outside South Africa") continue;
    if (haystack.includes(province.toLowerCase())) return province;
  }
  if (/\b(cape town|stellenbosch|paarl|worcester|grabouw|tulbagh|villiersdorp|george|mossel)\b/i.test(location)) {
    return "Western Cape";
  }
  if (/\b(pretoria|centurion|johannesburg|midrand|sandton)\b/i.test(location)) {
    return "Gauteng";
  }
  if (/\b(polokwane|tzaneen|hoedspruit|phalaborwa)\b/i.test(location)) {
    return "Limpopo";
  }
  if (/\b(nelspruit|mbombela|witbank|emalahleni)\b/i.test(location)) {
    return "Mpumalanga";
  }
  if (/\b(zeerust|rustenburg|mafikeng|marico)\b/i.test(location)) {
    return "North West";
  }
  return undefined;
}

function mapServiceFromCalculator(
  calculator: CalculatorConfig,
  formValues: Record<string, string>,
): ServiceOption {
  switch (calculator.id) {
    case "dam-lining-area":
      return "HDPE dam liner";
    case "hdpe-pvc-material":
      return formValues.materialType === "pvc" ? "PVC dam liner" : "HDPE dam liner";
    case "steel-tank-size":
    case "rainwater-harvesting":
      return "Steel water tank";
    case "waterproofing-area":
      return "Bitumen waterproofing";
    case "leaking-dam-repair":
      return "Dam leak repair";
    case "project-budget": {
      const service = clean(formValues.serviceRequired);
      if (service === "steel-tank") return "Steel water tank";
      if (service === "waterproofing") return "Bitumen waterproofing";
      if (service === "repair") return "Dam leak repair";
      if (service === "reservoir") return "Reservoir repair";
      return "HDPE dam liner";
    }
    case "irrigation-water":
    case "water-by-land-size":
      return "HDPE dam liner";
    case "annual-water-requirement": {
      const usage = clean(formValues.usageType);
      if (usage === "household" || usage === "commercial") return "Steel water tank";
      if (usage === "mine") return "Other";
      return "HDPE dam liner";
    }
    default:
      return "Other";
  }
}

function resultValue(
  result: CalculatorResult | null | undefined,
  label: string,
): string {
  if (!result) return "";
  const value = result.values[label];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function buildProjectSize(
  calculator: CalculatorConfig,
  formValues: Record<string, string>,
  result?: CalculatorResult | null,
): string {
  switch (calculator.id) {
    case "dam-lining-area": {
      const estimated = resultValue(
        result,
        "Estimated material area (incl. overlap & wastage)",
      );
      if (estimated) return estimated;
      const topL = clean(formValues.topLength);
      const topW = clean(formValues.topWidth);
      const depth = clean(formValues.depth);
      if (topL && topW && depth) return `${topL} m × ${topW} m × ${depth} m deep`;
      if (topL && topW) return `${topL} m × ${topW} m dam`;
      return "";
    }
    case "hdpe-pvc-material": {
      const total = resultValue(result, "Total area (m²)");
      if (total) return total.includes("m") ? total : `${total} m²`;
      const topL = clean(formValues.topLength);
      const topW = clean(formValues.topWidth);
      const depth = clean(formValues.depth);
      if (topL && topW && depth) return `${topL} m × ${topW} m × ${depth} m deep`;
      return "";
    }
    case "steel-tank-size": {
      const litres = resultValue(result, "Recommended storage volume (litres)");
      if (litres) return litres;
      const band = resultValue(result, "Suggested tank size band");
      return band;
    }
    case "annual-water-requirement":
      return (
        resultValue(result, "Annual requirement (m³)") ||
        resultValue(result, "Annual requirement (litres)")
      );
    case "water-by-land-size":
      return resultValue(result, "Annual estimate");
    case "irrigation-water":
      return resultValue(result, "Total m³ required");
    case "rainwater-harvesting":
      return (
        resultValue(result, "Estimated storage requirement") ||
        resultValue(result, "Annual harvestable water")
      );
    case "waterproofing-area":
      return (
        resultValue(result, "Estimated material area") ||
        resultValue(result, "Waterproofing area")
      );
    case "project-budget":
      return clean(formValues.damSize);
    case "leaking-dam-repair":
      return "";
    default:
      return "";
  }
}

/** Fields that map onto dedicated RFQ inputs and should not be duplicated in the message. */
function isMappedToFormField(
  calculatorId: string,
  fieldName: string,
): boolean {
  if (calculatorId === "project-budget") {
    return fieldName === "siteLocation" || fieldName === "damSize" || fieldName === "serviceRequired";
  }
  return false;
}

function buildMessageNotes(
  calculator: CalculatorConfig,
  formValues: Record<string, string>,
  result: CalculatorResult | null | undefined,
  mappedProjectSize: string,
): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (pair: string) => {
    const key = pair.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    notes.push(pair);
  };

  for (const field of calculator.fields) {
    if (isMappedToFormField(calculator.id, field.name)) continue;
    const pair = formatFieldPair(field, formValues[field.name] ?? "");
    if (pair) pushUnique(pair);
  }

  if (result) {
    for (const [label, value] of Object.entries(result.values)) {
      if (/next step|recommended action|recommended next step/i.test(label)) continue;
      const text = String(value ?? "").trim();
      if (!text || text === "—") continue;
      // Already captured in the dedicated project-size RFQ field.
      if (mappedProjectSize && text === mappedProjectSize) continue;
      if (
        mappedProjectSize &&
        /estimated material area|total area|recommended storage|annual requirement|annual estimate|total m³|waterproofing area/i.test(
          label,
        )
      ) {
        continue;
      }
      pushUnique(`${label}: ${text}`);
    }

    if (result.warnings?.length) {
      pushUnique(`Warnings: ${result.warnings.join("; ")}`);
    }
  }

  return notes;
}

/**
 * Build RFQ prefill from calculator inputs/results.
 * Dedicated form fields get mapped values; remaining details go into the message
 * as compact "Label: value" pairs.
 */
export function buildQuotePrefill({
  calculatorId,
  formValues,
  result,
}: BuildQuotePrefillArgs): QuotePrefill | null {
  const calculator = getCalculator(calculatorId);
  if (!calculator) return null;

  const serviceRequired = mapServiceFromCalculator(calculator, formValues);
  const projectSize = buildProjectSize(calculator, formValues, result);

  let projectLocation = "";
  if (calculator.id === "project-budget") {
    projectLocation = clean(formValues.siteLocation);
  }

  const province = projectLocation ? detectProvince(projectLocation) : undefined;

  const notes = buildMessageNotes(
    calculator,
    formValues,
    result,
    projectSize,
  );
  const messageParts = [
    `Prepared from Damtech ${calculator.name}.`,
    notes.length > 0 ? notes.join(", ") : "",
  ].filter(Boolean);

  const calculatorPayload = {
    calculatorType: calculator.id,
    inputs: Object.fromEntries(
      Object.entries(formValues).map(([key, value]) => [key, value]),
    ),
    results: Object.fromEntries(
      Object.entries(result?.values ?? {}).map(([label, value]) => [
        label,
        value,
      ]),
    ),
  };

  return {
    serviceRequired,
    projectSize: projectSize || undefined,
    projectLocation: projectLocation || undefined,
    province,
    message: messageParts.join(" "),
    sourceCalculatorId: calculator.id,
    sourceCalculatorName: calculator.name,
    calculatorJson: JSON.stringify(calculatorPayload),
  };
}

export function storeQuotePrefill(prefill: QuotePrefill): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      QUOTE_PREFILL_STORAGE_KEY,
      JSON.stringify(prefill),
    );
  } catch {
    // Ignore quota / private-mode failures — user can still open /quote manually.
  }
}

export function peekQuotePrefill(): QuotePrefill | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(QUOTE_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuotePrefill;
    if (!parsed || typeof parsed.message !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuotePrefill(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(QUOTE_PREFILL_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

/** @deprecated Prefer peekQuotePrefill + clearQuotePrefill for Strict Mode safety. */
export function readAndClearQuotePrefill(): QuotePrefill | null {
  const prefill = peekQuotePrefill();
  clearQuotePrefill();
  return prefill;
}
