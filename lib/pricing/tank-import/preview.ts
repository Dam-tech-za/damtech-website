import { parseCsvText, simpleHash } from "./csv-lite.ts";
import {
  autoMapTankHeaders,
  summariseTankMapping,
  type TankAutoMapResult,
  type TankCanonicalHeader,
} from "./columns.ts";
import { mapTankRawRow, validateTankRow, type TankRowValidationResult } from "./validate.ts";

export type TankImportPreview = {
  headers: string[];
  delimiter: string;
  hadBom: boolean;
  fileHash: string;
  autoMap: TankAutoMapResult;
  mapping: Record<string, TankCanonicalHeader | "">;
  rows: TankRowValidationResult[];
  summary: {
    rowsFound: number;
    fieldsMatched: number;
    totalColumns: number;
    validRows: number;
    warningRows: number;
    invalidRows: number;
    duplicates: number;
    manualConfirmation: number;
    missingLinerPrice: number;
  };
};

export function buildTankImportPreview(
  csvText: string,
  options: {
    mappingOverride?: Record<string, TankCanonicalHeader | "">;
    existingCodes?: Set<string>;
  } = {},
): TankImportPreview {
  const parsed = parseCsvText(csvText);
  const autoMap = options.mappingOverride
    ? summariseTankMapping(options.mappingOverride, parsed.headers)
    : autoMapTankHeaders(parsed.headers);
  const mapping = autoMap.mapping;

  const seenCodes = new Set<string>();
  const existing = options.existingCodes ?? new Set<string>();

  const rows = parsed.rows.map((cells, index) => {
    const raw = mapTankRawRow(cells, parsed.headers, mapping);
    const result = validateTankRow(raw, index + 2, seenCodes);
    if (result.data && existing.has(result.data.tank_code)) {
      return {
        ...result,
        status: "duplicate" as const,
        warnings: [
          ...result.warnings,
          `tank_code ${result.data.tank_code} already exists; default action is Skip`,
        ],
      };
    }
    return result;
  });

  const summary = {
    rowsFound: rows.length,
    fieldsMatched: autoMap.matchedCount,
    totalColumns: autoMap.totalColumns,
    validRows: rows.filter((r) => r.status === "ready").length,
    warningRows: rows.filter((r) => r.status === "ready_with_warning").length,
    invalidRows: rows.filter((r) => r.status === "invalid").length,
    duplicates: rows.filter((r) => r.status === "duplicate").length,
    manualConfirmation: rows.filter((r) => r.status === "manual_confirmation").length,
    missingLinerPrice: rows.filter((r) =>
      r.warnings.some((w) => w.includes("PVC liner price required")),
    ).length,
  };

  return {
    headers: parsed.headers,
    delimiter: parsed.delimiter,
    hadBom: parsed.hadBom,
    fileHash: simpleHash(csvText),
    autoMap,
    mapping,
    rows,
    summary,
  };
}
