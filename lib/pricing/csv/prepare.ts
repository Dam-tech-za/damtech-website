import { autoMapHeaders, type CanonicalHeader } from "./columns";
import { getImportLimits, parseCsvText, simpleHash, validateUploadMeta } from "./parse";
import {
  mapRawRow,
  validateCsvAgainstLimits,
  validateMappedRow,
  type RowValidationResult,
} from "./validate";

export type PreparedImport = {
  headers: string[];
  mapping: Record<string, CanonicalHeader | "">;
  delimiter: "," | ";" | "\t";
  hadBom: boolean;
  fileHash: string;
  rows: RowValidationResult[];
  summary: {
    total: number;
    ready: number;
    warnings: number;
    invalid: number;
    missingPrice: number;
    manual: number;
  };
};

export function prepareImportFromCsvText(
  csvText: string,
  mappingOverride?: Record<string, CanonicalHeader | "">,
): PreparedImport {
  const parsed = parseCsvText(csvText);
  const mapping = mappingOverride ?? autoMapHeaders(parsed.headers);
  const limitError = validateCsvAgainstLimits(parsed.rows.length);
  if (limitError) {
    return {
      headers: parsed.headers,
      mapping,
      delimiter: parsed.delimiter,
      hadBom: parsed.hadBom,
      fileHash: simpleHash(csvText),
      rows: [
        {
          rowNumber: 0,
          status: "invalid",
          data: null,
          raw: {},
          errors: [limitError],
          warnings: [],
          markupPercent: null,
          marginPercent: null,
        },
      ],
      summary: {
        total: parsed.rows.length,
        ready: 0,
        warnings: 0,
        invalid: 1,
        missingPrice: 0,
        manual: 0,
      },
    };
  }

  const seen = new Set<string>();
  const rows = parsed.rows.map((cells, index) => {
    const raw = mapRawRow(cells, parsed.headers, mapping);
    return validateMappedRow(raw, index + 2, seen);
  });

  const summary = {
    total: rows.length,
    ready: rows.filter((r) => r.status === "ready").length,
    warnings: rows.filter((r) => r.status === "ready_with_warning").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    missingPrice: rows.filter((r) => r.status === "missing_price").length,
    manual: rows.filter((r) => r.status === "manual_confirmation").length,
  };

  return {
    headers: parsed.headers,
    mapping,
    delimiter: parsed.delimiter,
    hadBom: parsed.hadBom,
    fileHash: simpleHash(csvText),
    rows,
    summary,
  };
}

export { validateUploadMeta, getImportLimits, autoMapHeaders, simpleHash };
export type { CanonicalHeader, RowValidationResult };
