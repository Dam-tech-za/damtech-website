/**
 * Stage: duplicate detection.
 *
 * In-file duplicate item codes are caught during row validation. This module
 * marks rows whose item_code already exists in the catalogue (active or
 * archived) so the preview can apply the chosen duplicate behaviour.
 */

import type { RowValidationResult } from "../csv/validate";

export type ExistingItem = { id: string; itemCode: string; isActive?: boolean };

export function markCatalogueDuplicates(
  rows: RowValidationResult[],
  existing: Map<string, ExistingItem>,
): { rows: RowValidationResult[]; duplicates: number } {
  let duplicates = 0;
  const mapped = rows.map((row) => {
    if (!row.data) return row;
    const match = existing.get(row.data.item_code);
    if (!match) return row;
    duplicates += 1;
    return {
      ...row,
      status: "duplicate" as const,
      existingPricingItemId: match.id,
      warnings: [
        ...row.warnings,
        `item_code ${row.data.item_code} already exists; default action is Skip`,
      ],
    };
  });
  return { rows: mapped, duplicates };
}
