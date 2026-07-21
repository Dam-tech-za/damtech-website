/**
 * Stage: build import preview.
 *
 * Orchestrates parse → template detection → auto-map → row validation →
 * in-file + catalogue duplicate detection into a single structured response
 * suitable for the preview screen.
 */

import { parseCsvText, simpleHash } from "../csv/parse";
import {
  mapRawRow,
  validateCsvAgainstLimits,
  validateMappedRow,
  type RowValidationResult,
} from "../csv/validate";
import type { CanonicalHeader } from "../csv/columns";
import { autoMapColumns } from "./auto-map-columns";
import { detectTemplate } from "./detect-template";
import type { AutoMapResult, TemplateDetection } from "./import-types";

export type ImportPreview = {
  headers: string[];
  delimiter: "," | ";" | "\t";
  hadBom: boolean;
  fileHash: string;
  template: TemplateDetection;
  autoMap: AutoMapResult;
  /** Effective header → target mapping used for validation. */
  mapping: Record<string, CanonicalHeader | "">;
  rows: RowValidationResult[];
  summary: {
    rowsFound: number;
    fieldsMatched: number;
    unmatchedFields: string[];
    requiredFieldsMissing: CanonicalHeader[];
    validRows: number;
    warningRows: number;
    invalidRows: number;
    duplicates: number;
    newItems: number;
    updatedItems: number;
    zeroPriceItems: number;
    manualConfirmationItems: number;
  };
};

function limitInvalid(csvText: string, headers: string[], mapping: Record<string, CanonicalHeader | "">, error: string, template: TemplateDetection, autoMap: AutoMapResult): ImportPreview {
  return {
    headers,
    delimiter: ",",
    hadBom: false,
    fileHash: simpleHash(csvText),
    template,
    autoMap,
    mapping,
    rows: [
      {
        rowNumber: 0,
        status: "invalid",
        data: null,
        raw: {},
        errors: [error],
        warnings: [],
        markupPercent: null,
        marginPercent: null,
      },
    ],
    summary: {
      rowsFound: 0,
      fieldsMatched: autoMap.matchedCount,
      unmatchedFields: autoMap.unmatchedHeaders,
      requiredFieldsMissing: autoMap.missingRequired,
      validRows: 0,
      warningRows: 0,
      invalidRows: 1,
      duplicates: 0,
      newItems: 0,
      updatedItems: 0,
      zeroPriceItems: 0,
      manualConfirmationItems: 0,
    },
  };
}

export function buildImportPreview(
  csvText: string,
  options?: {
    mappingOverride?: Record<string, CanonicalHeader | "">;
    existingCodes?: Set<string>;
  },
): ImportPreview {
  const parsed = parseCsvText(csvText);
  const template = detectTemplate(parsed.headers);
  const autoMap = autoMapColumns(parsed.headers);
  const mapping = options?.mappingOverride ?? autoMap.mapping;

  const limitError = validateCsvAgainstLimits(parsed.rows.length);
  if (limitError) {
    return limitInvalid(csvText, parsed.headers, mapping, limitError, template, autoMap);
  }

  const existingCodes = options?.existingCodes ?? new Set<string>();
  const seen = new Set<string>();
  const rows = parsed.rows.map((cells, index) => {
    const raw = mapRawRow(cells, parsed.headers, mapping);
    const result = validateMappedRow(raw, index + 2, seen);
    if (result.data && existingCodes.has(result.data.item_code)) {
      return {
        ...result,
        status: "duplicate" as const,
        existingPricingItemId: result.existingPricingItemId ?? null,
        warnings: [
          ...result.warnings,
          `item_code ${result.data.item_code} already exists; default action is Skip`,
        ],
      };
    }
    return result;
  });

  const zeroPriceItems = rows.filter(
    (r) =>
      r.data &&
      (r.data.recommended_sell_ex_vat_zar == null || r.data.recommended_sell_ex_vat_zar === 0),
  ).length;

  const duplicates = rows.filter((r) => r.status === "duplicate").length;

  const summary = {
    rowsFound: rows.length,
    fieldsMatched: autoMap.matchedCount,
    unmatchedFields: autoMap.unmatchedHeaders,
    requiredFieldsMissing: autoMap.missingRequired,
    validRows: rows.filter((r) => r.status === "ready").length,
    warningRows: rows.filter(
      (r) => r.status === "ready_with_warning" || r.status === "manual_confirmation",
    ).length,
    invalidRows: rows.filter((r) => r.status === "invalid").length,
    duplicates,
    newItems: rows.filter((r) => r.data && r.status !== "duplicate" && r.status !== "invalid").length,
    updatedItems: duplicates,
    zeroPriceItems,
    manualConfirmationItems: rows.filter((r) => r.status === "manual_confirmation").length,
  };

  return {
    headers: parsed.headers,
    delimiter: parsed.delimiter,
    hadBom: parsed.hadBom,
    fileHash: simpleHash(csvText),
    template,
    autoMap,
    mapping,
    rows,
    summary,
  };
}
