import Link from "next/link";
import {
  RFQ_INBOX_SORT_OPTIONS,
  type RfqInboxFilters,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import {
  countActiveAdvancedFilters,
} from "@/lib/admin/rfqs/rfq-inbox-utils";
import { RFQ_STATUSES } from "@/lib/rfq/statuses";
import { RfqAdvancedFiltersTrigger } from "./RfqAdvancedFilters";

type RfqToolbarProps = {
  filters: RfqInboxFilters;
  staff: { id: string; email: string; full_name: string | null }[];
};

function hasActiveFilters(filters: RfqInboxFilters): boolean {
  return Boolean(
    filters.q ||
      filters.status ||
      countActiveAdvancedFilters(filters) > 0 ||
      (filters.sort && filters.sort !== "submitted_desc"),
  );
}

export function RfqToolbar({ filters, staff }: RfqToolbarProps) {
  const advancedCount = countActiveAdvancedFilters(filters);
  const showClear = hasActiveFilters(filters);

  return (
    <div className="rfq-toolbar">
      <form className="rfq-toolbar__form" method="get">
        {filters.pageSize ? (
          <input type="hidden" name="pageSize" value={filters.pageSize} />
        ) : null}
        {Object.entries(filters)
          .filter(
            ([key, value]) =>
              Boolean(value?.trim()) &&
              !["q", "status", "sort", "page"].includes(key),
          )
          .map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

        <label className="rfq-toolbar__search">
          <span className="sr-only">Search RFQs</span>
          <svg
            className="rfq-toolbar__search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            className="form-input rfq-toolbar__input"
            name="q"
            type="search"
            placeholder="Search customer, phone, email, RFQ or location"
            defaultValue={filters.q ?? ""}
            aria-label="Search customer, phone, email, RFQ or location"
          />
        </label>

        <label className="rfq-toolbar__field">
          <span className="sr-only">Status</span>
          <select
            name="status"
            className="form-input rfq-toolbar__input"
            defaultValue={filters.status ?? ""}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {RFQ_STATUSES.filter((s) => s !== "archived").map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="rfq-toolbar__field">
          <span className="sr-only">Sort</span>
          <select
            name="sort"
            className="form-input rfq-toolbar__input"
            defaultValue={filters.sort ?? "submitted_desc"}
            aria-label="Sort"
            title="Largest/smallest project sorts lining by m² and tanks by kL separately."
          >
            {RFQ_INBOX_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn--md btn--primary rfq-toolbar__apply">
          Apply
        </button>

        {showClear ? (
          <Link href="/admin/rfqs/" className="btn btn--md btn--secondary">
            Clear
          </Link>
        ) : null}
      </form>

      <RfqAdvancedFiltersTrigger
        filters={filters}
        staff={staff}
        advancedCount={advancedCount}
      />
    </div>
  );
}
