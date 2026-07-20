import type { RfqInboxSort } from "./rfq-inbox-types";

export const RFQ_INBOX_SORTS: RfqInboxSort[] = [
  "submitted_desc",
  "submitted_asc",
  "updated_desc",
  "customer_asc",
  "location_asc",
  "size_desc",
  "size_asc",
];

const DEFAULT_SORT: RfqInboxSort = "submitted_desc";

export function parseRfqInboxSort(value: string | undefined): RfqInboxSort {
  if (!value) return DEFAULT_SORT;
  if (value === "submitted_at_desc") return "submitted_desc";
  if (value === "submitted_at_asc") return "submitted_asc";
  if (value === "updated_at_desc") return "updated_desc";
  if ((RFQ_INBOX_SORTS as readonly string[]).includes(value)) {
    return value as RfqInboxSort;
  }
  return DEFAULT_SORT;
}

export function requiresPostFetchSort(sort: RfqInboxSort): boolean {
  return sort === "size_desc" || sort === "size_asc";
}

export function toListSortParams(sort: RfqInboxSort): {
  sort?: string;
  sortField?: string;
  sortDirection?: string;
} {
  switch (sort) {
    case "submitted_desc":
      return { sort: "submitted_at_desc" };
    case "submitted_asc":
      return { sort: "submitted_at_asc" };
    case "updated_desc":
      return { sort: "updated_at_desc" };
    case "customer_asc":
      return { sortField: "contact_name", sortDirection: "asc" };
    case "location_asc":
      return { sortField: "project_location", sortDirection: "asc" };
    default:
      return { sort: "submitted_at_desc" };
  }
}

export function validateRfqInboxPage(value: unknown): number {
  const n = Number(value ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function validateRfqInboxPageSize(value: unknown): number {
  const n = Number(value ?? 25);
  if (!Number.isFinite(n) || n < 1) return 25;
  const allowed = [25, 50, 100];
  if (allowed.includes(n)) return n;
  return 25;
}
