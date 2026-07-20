import type { RFQListFilters, RFQListItem } from "@/lib/rfq/list";
import { listRfqs } from "@/lib/rfq/list";
import { createClient } from "@/lib/supabase/server";
import { enquiryChannelLabel } from "@/lib/rfq/enquiry-channel";
import {
  parseRfqInboxSort,
  requiresPostFetchSort,
  toListSortParams,
} from "./rfq-inbox-query";
import { resolveRfqApproximateSize, sortRowsBySize } from "./rfq-size-summary";
import type { RfqInboxFilters, RfqInboxResult, RfqInboxRow } from "./rfq-inbox-types";

export async function getRfqInbox(filters: RfqInboxFilters): Promise<RfqInboxResult> {
  const sort = parseRfqInboxSort(filters.sort);
  const listFilters: RFQListFilters = {
    ...filters,
    ...toListSortParams(sort),
  };

  if (requiresPostFetchSort(sort)) {
    listFilters.page = "1";
    listFilters.pageSize = "500";
  }

  const [result, totalUnfiltered] = await Promise.all([
    listRfqs(listFilters),
    countAllRfqs(),
  ]);

  if (result.error) {
    return {
      rows: [],
      total: 0,
      totalUnfiltered,
      page: Number(filters.page ?? 1) || 1,
      pageSize: Number(filters.pageSize ?? 25) || 25,
      totalPages: 0,
      error: result.error,
    };
  }

  let rows = result.rows.map(mapToInboxRow);

  if (sort === "size_desc" || sort === "size_asc") {
    rows = sortRowsBySize(rows, sort === "size_asc" ? "asc" : "desc");
    const page = Number(filters.page ?? 1) || 1;
    const pageSize = Number(filters.pageSize ?? 25) || 25;
    const total = rows.length;
    const from = (page - 1) * pageSize;
    rows = rows.slice(from, from + pageSize);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    return {
      rows,
      total,
      totalUnfiltered,
      page,
      pageSize,
      totalPages,
      error: null,
    };
  }

  return {
    rows,
    total: result.total,
    totalUnfiltered,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    error: null,
  };
}

async function countAllRfqs(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("rfqs")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

function mapToInboxRow(row: RFQListItem): RfqInboxRow {
  return {
    id: row.id,
    rfqNumber: row.rfq_number,
    customerName: row.contact_name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    projectLocation: row.project_location,
    province: row.province,
    serviceLabel: row.service_required?.trim() || "Not specified",
    projectSummary: row.project_description?.trim() || null,
    approximateSize: resolveRfqApproximateSize(row),
    source: row.enquiry_channel || row.source_page || "other",
    sourceBadgeLabel: row.source_badge_label || enquiryChannelLabel(row.enquiry_channel),
    status: row.status,
    assignedUserName: row.assignee_name ?? row.assignee_email ?? null,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    hasAttachments: (row.attachment_count ?? 0) > 0,
    hasCalculatorData:
      Boolean(row.has_calculator_data) ||
      Boolean(row.calculator_type) ||
      (row.asset_count ?? 0) > 0,
  };
}
