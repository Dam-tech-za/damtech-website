import type { RfqApproximateSize } from "./rfq-inbox-types";

const SORT_TYPE_RANK: Record<RfqApproximateSize["sortType"], number> = {
  area: 0,
  capacity: 1,
  dimension: 2,
  none: 3,
};

export function compareRfqSize(
  a: RfqApproximateSize,
  b: RfqApproximateSize,
  direction: "asc" | "desc",
): number {
  const aMissing = a.source === "missing" || a.numericValue == null;
  const bMissing = b.source === "missing" || b.numericValue == null;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  const typeDiff = SORT_TYPE_RANK[a.sortType] - SORT_TYPE_RANK[b.sortType];
  if (typeDiff !== 0) return typeDiff;

  const diff = a.numericValue! - b.numericValue!;
  return direction === "asc" ? diff : -diff;
}

export function sortRowsBySize<T extends { approximateSize: RfqApproximateSize }>(
  rows: T[],
  direction: "asc" | "desc",
): T[] {
  return [...rows].sort((a, b) =>
    compareRfqSize(a.approximateSize, b.approximateSize, direction),
  );
}
