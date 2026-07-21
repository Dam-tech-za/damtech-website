/**
 * Stage: structured, field-contextual error helpers.
 * Produces messages like "Row 22: roll_width_m is required for a roll-based
 * HDPE product" instead of generic "Import failed" text.
 */

export class ImportError extends Error {
  readonly rowNumber?: number;
  readonly field?: string;

  constructor(message: string, opts?: { rowNumber?: number; field?: string }) {
    super(message);
    this.name = "ImportError";
    this.rowNumber = opts?.rowNumber;
    this.field = opts?.field;
  }
}

export function rowError(rowNumber: number, message: string): string {
  return `Row ${rowNumber}: ${message}`;
}

export function fieldError(rowNumber: number, field: string, message: string): string {
  return `Row ${rowNumber}: ${field} ${message}`;
}
