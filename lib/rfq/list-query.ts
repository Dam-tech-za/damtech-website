export const RFQ_SORT_FIELDS = [
  "submitted_at",
  "updated_at",
  "rfq_number",
] as const;

export type RFQSortField = (typeof RFQ_SORT_FIELDS)[number];
export type RFQSortDirection = "asc" | "desc";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function validateRfqSortField(value: string): RFQSortField {
  return (RFQ_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as RFQSortField)
    : "submitted_at";
}

export function validateRfqPage(value: unknown): number {
  const n = Number(value ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function validateRfqPageSize(value: unknown): number {
  const n = Number(value ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(n));
}

export function parseRfqSort(input: {
  sort?: string;
  sortField?: string;
  sortDirection?: string;
}): { field: RFQSortField; direction: RFQSortDirection } {
  if (input.sort === "submitted_at_asc") {
    return { field: "submitted_at", direction: "asc" };
  }
  if (input.sort === "updated_at_desc") {
    return { field: "updated_at", direction: "desc" };
  }
  if (input.sort === "rfq_number_asc") {
    return { field: "rfq_number", direction: "asc" };
  }
  const field = validateRfqSortField(input.sortField || "submitted_at");
  const direction: RFQSortDirection =
    input.sortDirection === "asc" ? "asc" : "desc";
  return { field, direction };
}

export function sanitiseRfqSearch(raw: string): string {
  return raw.trim().replace(/[%_,]/g, "").slice(0, 120);
}
