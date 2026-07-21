/**
 * Stage: header normalisation.
 *
 * Rules (applied in order):
 *   - strip UTF-8 BOM from the first header
 *   - trim surrounding whitespace
 *   - lowercase
 *   - replace spaces and hyphens with underscores
 *   - collapse duplicate underscores
 *   - remove leading/trailing underscores
 */

import { normaliseHeaderKey } from "../csv/columns";

export function normalizeHeader(raw: string): string {
  return normaliseHeaderKey(raw);
}

export function normalizeHeaders(headers: string[]): string[] {
  return headers.map(normalizeHeader);
}
