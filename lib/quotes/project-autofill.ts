import type { QuoteLineType } from "./types";

/** How template content is merged into an existing quote. */
export type ApplyStrategy = "fill_blank" | "append" | "replace";

export type TemplateProjectFieldDef = {
  fieldKey: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isRecommended: boolean;
  options: string[];
  unit: string | null;
  helpText: string | null;
};

/** Origin of a populated project field, used for discreet source badges/audit. */
export type FieldSource = "manual" | "rfq" | "template" | "customer" | "calculated";

/**
 * Fallback service mapping when a template does not define a default service
 * type. Values must match QUOTE_SERVICE_OPTIONS. Template default service type
 * always takes precedence over this map.
 */
export const CATEGORY_SERVICE_FALLBACK: Record<string, string> = {
  "Dam lining": "HDPE dam lining",
  "Dam lining repair": "Leak repair",
  Waterproofing: "Torch-on waterproofing",
  "Waterproofing repair": "Torch-on waterproofing",
  "Steel tanks": "Corrugated steel reservoir",
  Reservoirs: "Concrete reservoir repair",
  "Reservoir refurbishment": "Concrete reservoir repair",
};

export function mapCategoryToService(
  category: string | null | undefined,
): string {
  if (!category) return "";
  return CATEGORY_SERVICE_FALLBACK[category] ?? "";
}

/** Return the first non-empty candidate (trimmed), else an empty string. */
export function pickByPriority(
  ...candidates: (string | null | undefined)[]
): string {
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) return candidate.trim();
  }
  return "";
}

type MinimalLine = {
  lineType: QuoteLineType | string;
  description: string;
  sellUnitPrice: number;
  itemCode?: string | null;
};

/** True when the quote has no user-entered project content or priced lines. */
export function isEmptyDraft(input: {
  title: string;
  projectDescription: string;
  scopeSummary: string;
  lines: MinimalLine[];
}): boolean {
  if (input.title.trim()) return false;
  if (input.projectDescription.trim()) return false;
  if (input.scopeSummary.trim()) return false;
  const hasContentLine = input.lines.some(
    (line) =>
      line.lineType !== "heading" &&
      line.lineType !== "note" &&
      (line.description.trim() ||
        line.sellUnitPrice > 0 ||
        (line.itemCode ?? "").trim()),
  );
  return !hasContentLine;
}

/** Merge a single text field according to the chosen apply strategy. */
export function mergeField(
  existing: string,
  incoming: string,
  strategy: ApplyStrategy,
): string {
  const ex = existing ?? "";
  const inc = incoming ?? "";
  if (strategy === "replace") return inc;
  if (strategy === "fill_blank") return ex.trim() ? ex : inc;
  // append
  if (!ex.trim()) return inc;
  if (!inc.trim()) return ex;
  return `${ex.trim()}\n${inc.trim()}`;
}

/** Completion summary for a template's required/recommended project fields. */
export function computeFieldCompletion(
  fields: { fieldKey: string; isRecommended: boolean; isRequired: boolean }[],
  values: Record<string, string>,
): { completed: number; total: number; missingRequired: string[] } {
  const relevant = fields.filter((f) => f.isRecommended || f.isRequired);
  let completed = 0;
  const missingRequired: string[] = [];
  for (const field of relevant) {
    const value = values[field.fieldKey];
    const filled = typeof value === "string" && value.trim().length > 0;
    if (filled) {
      completed += 1;
    } else if (field.isRequired) {
      missingRequired.push(field.fieldKey);
    }
  }
  return { completed, total: relevant.length, missingRequired };
}
