import {
  RFQ_STATUS_LABELS,
  type RfqInboxFilters,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import {
  buildFilterParams,
  countActiveAdvancedFilters,
} from "@/lib/admin/rfqs/rfq-inbox-utils";
import { enquiryChannelLabel } from "@/lib/rfq/enquiry-channel";
import {
  AdminActiveFilterChips,
  type AdminFilterChip,
} from "@/components/admin/ui";

type Chip = { key: string; label: string; omit: string[] };

function buildChips(filters: RfqInboxFilters): Chip[] {
  const chips: Chip[] = [];

  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${RFQ_STATUS_LABELS[filters.status] ?? filters.status}`,
      omit: ["status"],
    });
  }
  if (filters.province) {
    chips.push({
      key: "province",
      label: `Province: ${filters.province}`,
      omit: ["province"],
    });
  }
  if (filters.service) {
    chips.push({
      key: "service",
      label: `Service: ${filters.service}`,
      omit: ["service"],
    });
  }
  if (filters.source) {
    chips.push({
      key: "source",
      label: `Source: ${enquiryChannelLabel(filters.source)}`,
      omit: ["source"],
    });
  }
  if (filters.assigned) {
    chips.push({
      key: "assigned",
      label: `Assigned: ${filters.assigned === "unassigned" ? "Unassigned" : filters.assigned}`,
      omit: ["assigned"],
    });
  }
  if (filters.from || filters.to) {
    chips.push({
      key: "dates",
      label: `Submitted: ${filters.from || "…"} – ${filters.to || "…"}`,
      omit: ["from", "to"],
    });
  }
  if (filters.q) {
    chips.push({
      key: "q",
      label: `Search: ${filters.q}`,
      omit: ["q"],
    });
  }
  if (filters.hasAttachments === "1") {
    chips.push({ key: "attachments", label: "Has attachments", omit: ["hasAttachments"] });
  }
  if (filters.hasDrawings === "1") {
    chips.push({ key: "drawings", label: "Has drawings", omit: ["hasDrawings"] });
  }
  if (filters.hasCalculator === "1") {
    chips.push({ key: "calculator", label: "Has calculator data", omit: ["hasCalculator"] });
  }
  if (filters.materialPreference) {
    chips.push({
      key: "material",
      label: `Material: ${filters.materialPreference}`,
      omit: ["materialPreference"],
    });
  }
  if (filters.assetType) {
    chips.push({
      key: "assetType",
      label: `Asset: ${filters.assetType.replace(/_/g, " ")}`,
      omit: ["assetType"],
    });
  }

  return chips;
}

type RfqActiveFiltersProps = {
  filters: RfqInboxFilters;
};

export function RfqActiveFilters({ filters }: RfqActiveFiltersProps) {
  const chips = buildChips(filters);
  const hasAdvanced = countActiveAdvancedFilters(filters) > 0;

  if (!chips.length && !hasAdvanced) return null;
  if (!chips.length) return null;

  const filterChips: AdminFilterChip[] = chips.map((chip) => ({
    key: chip.key,
    label: chip.label,
    clearHref: `/admin/rfqs/?${buildFilterParams(filters, [...chip.omit, "page"]).toString()}`,
  }));

  return (
    <AdminActiveFilterChips
      chips={filterChips}
      clearHref="/admin/rfqs/"
      clearLabel="Clear all"
    />
  );
}
