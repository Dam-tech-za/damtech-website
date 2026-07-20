import {
  RFQ_INBOX_SORT_OPTIONS,
  type RfqInboxFilters,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import { countActiveAdvancedFilters } from "@/lib/admin/rfqs/rfq-inbox-utils";
import { RFQ_STATUSES } from "@/lib/rfq/statuses";
import {
  AdminButton,
  AdminFilterToolbar,
  AdminSearchField,
  AdminSelect,
  AdminSortSelect,
} from "@/components/admin/ui";
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
    <AdminFilterToolbar
      aside={
        <RfqAdvancedFiltersTrigger
          filters={filters}
          staff={staff}
          advancedCount={advancedCount}
        />
      }
    >
      <form className="admin-filter-toolbar__form" method="get">
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

        <AdminSearchField
          name="q"
          placeholder="Search customer, phone, email, RFQ or location"
          defaultValue={filters.q ?? ""}
          label="Search RFQs"
        />

        <label className="admin-filter-field">
          <span className="sr-only">Status</span>
          <AdminSelect
            name="status"
            defaultValue={filters.status ?? ""}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {RFQ_STATUSES.filter((s) => s !== "archived").map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </AdminSelect>
        </label>

        <AdminSortSelect
          name="sort"
          defaultValue={filters.sort ?? "submitted_desc"}
          label="Sort"
          title="Largest/smallest project sorts lining by m² and tanks by kL separately."
        >
          {RFQ_INBOX_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSortSelect>

        <AdminButton type="submit" variant="primary">
          Apply
        </AdminButton>

        {showClear ? (
          <AdminButton href="/admin/rfqs/" variant="secondary">
            Clear
          </AdminButton>
        ) : null}
      </form>
    </AdminFilterToolbar>
  );
}
