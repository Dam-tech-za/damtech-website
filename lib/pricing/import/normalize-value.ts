/**
 * Stage: value normalisation (item codes, units, booleans, numbers).
 * Delegates to the shared normalisers.
 */

export {
  normaliseImportUnit,
  normaliseItemCode,
  parseOptionalNumber,
  parseBoolean,
  APPROVED_IMPORT_UNITS,
} from "../csv/validate";

/** Normalise an optional ISO date string to YYYY-MM-DD, or null when invalid. */
export function normalizeDate(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const text = String(raw).trim();
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}
