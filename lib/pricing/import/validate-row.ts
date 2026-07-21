/**
 * Stage: single-row validation and mapping.
 * Delegates to the shared row validator (category rules, required fields,
 * derived markup/margin, manual-confirmation flags).
 */

export {
  mapRawRow,
  validateMappedRow,
  validateCsvAgainstLimits,
  type InventoryImportRow,
  type RowValidationResult,
} from "../csv/validate";
