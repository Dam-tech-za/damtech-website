import { createClient } from "@/lib/supabase/server";
import { summariseCalculatorSize } from "@/lib/rfq/calculator";
import {
  enquiryChannelLabel,
  inferEnquiryChannel,
  isSimpleEnquiryChannel,
} from "@/lib/rfq/enquiry-channel";
import {
  formatQuantitySummaries,
  summariseAssetQuantities,
  type AssetQuantitySummary,
} from "@/lib/rfq/quantity-summary";
import type { RfqStatus } from "@/lib/rfq/schema";
import { RFQ_STATUSES } from "@/lib/rfq/statuses";
import {
  parseRfqSort,
  sanitiseRfqSearch,
  validateRfqPage,
  validateRfqPageSize,
} from "./list-query";

export {
  RFQ_SORT_FIELDS,
  validateRfqPage,
  validateRfqPageSize,
  validateRfqSortField,
  type RFQSortDirection,
  type RFQSortField,
} from "./list-query";

export type RFQListFilters = {
  q?: string;
  status?: string;
  service?: string;
  province?: string;
  assigned?: string;
  from?: string;
  to?: string;
  hasCalculator?: string;
  hasAttachments?: string;
  hasDrawings?: string;
  assetType?: string;
  materialPreference?: string;
  measurementMethod?: string;
  measurementRequired?: string;
  sourcePage?: string;
  minMaterialArea?: string;
  maxMaterialArea?: string;
  minTankCapacity?: string;
  maxTankCapacity?: string;
  sort?: string;
  sortField?: string;
  sortDirection?: string;
  page?: string;
  pageSize?: string;
};

/** @deprecated Prefer RFQListFilters */
export type RfqListFilters = RFQListFilters;

export type RFQListItem = {
  id: string;
  rfq_number: string;
  status: RfqStatus;
  submitted_at: string;
  updated_at: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  service_required: string | null;
  province: string | null;
  project_location: string | null;
  approximate_project_size: string | null;
  approximate_project_size_text?: string | null;
  calculator_type: string | null;
  calculator_result: Record<string, unknown> | null;
  assigned_to: string | null;
  source_page: string | null;
  enquiry_channel?: string | null;
  has_calculator_data?: boolean | null;
  measurement_status?: string | null;
  site_measurement_required?: boolean | null;
  assignee_email?: string | null;
  attachment_count?: number;
  asset_count?: number;
  asset_types?: string[];
  quantity_lines?: string[];
  quantity_summary?: AssetQuantitySummary;
  measurement_status_label?: string;
  source_badge_label?: string;
};

/** @deprecated Prefer RFQListItem */
export type RfqListRow = RFQListItem;

export type PaginatedRFQResult = {
  data: RFQListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  error: string | null;
  /** Back-compat for existing admin UI */
  rows: RFQListItem[];
};

export type RfqStatusCounts = Record<string, number>;

const STATUS_CARD_KEYS = [
  "new",
  "reviewing",
  "site_measurement_required",
  "information_required",
  "ready_for_quote",
  "converted",
  "closed",
] as const;

function publicErrorMessage(message: string | undefined): string {
  console.error("[rfq.list]", message);
  return "Unable to load RFQs.";
}

export async function getRfqStatusCounts(): Promise<RfqStatusCounts> {
  const supabase = await createClient();
  const counts: RfqStatusCounts = Object.fromEntries(
    RFQ_STATUSES.map((s) => [s, 0]),
  );

  await Promise.all(
    STATUS_CARD_KEYS.map(async (status) => {
      const { count } = await supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      counts[status] = count ?? 0;
    }),
  );

  return counts;
}

export async function listRfqs(
  filters: RFQListFilters,
): Promise<PaginatedRFQResult> {
  const supabase = await createClient();
  const page = validateRfqPage(filters.page);
  const pageSize = validateRfqPageSize(filters.pageSize);
  const { field: sortField, direction } = parseRfqSort(filters);

  const needsAssetFilter =
    Boolean(filters.assetType) ||
    Boolean(filters.materialPreference) ||
    Boolean(filters.measurementMethod) ||
    filters.measurementRequired === "1" ||
    filters.hasDrawings === "1" ||
    Boolean(filters.minMaterialArea) ||
    Boolean(filters.maxMaterialArea) ||
    Boolean(filters.minTankCapacity) ||
    Boolean(filters.maxTankCapacity);

  let assetMatchedIds: string[] | null = null;
  let assetNameSearchIds: string[] = [];

  if (needsAssetFilter) {
    assetMatchedIds = await resolveAssetMatchedRfqIds(supabase, filters);
  }
  if (filters.q?.trim()) {
    assetNameSearchIds = await resolveAssetNameSearchIds(
      supabase,
      filters.q.trim(),
    );
  }

  let query = supabase
    .from("rfqs")
    .select(
      "id, rfq_number, status, submitted_at, updated_at, contact_name, company_name, email, phone, service_required, province, project_location, approximate_project_size, approximate_project_size_text, calculator_type, calculator_result, assigned_to, source_page, enquiry_channel, has_calculator_data, measurement_status, site_measurement_required",
      { count: "exact" },
    );

  if (filters.status && (RFQ_STATUSES as readonly string[]).includes(filters.status)) {
    query = query.eq("status", filters.status);
  }
  if (filters.service) query = query.eq("service_required", filters.service);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.assigned === "unassigned") query = query.is("assigned_to", null);
  else if (filters.assigned) query = query.eq("assigned_to", filters.assigned);
  if (filters.from) query = query.gte("submitted_at", filters.from);
  if (filters.to) query = query.lte("submitted_at", `${filters.to}T23:59:59.999Z`);
  if (filters.hasCalculator === "0") query = query.is("calculator_type", null);
  if (filters.sourcePage) {
    const source = sanitiseRfqSearch(filters.sourcePage);
    if (source) query = query.ilike("source_page", `%${source}%`);
  }
  if (filters.measurementRequired === "1") {
    query = query.eq("site_measurement_required", true);
  }

  if (filters.q?.trim()) {
    const q = sanitiseRfqSearch(filters.q);
    if (q) {
      const headerOr = [
        `rfq_number.ilike.%${q}%`,
        `contact_name.ilike.%${q}%`,
        `company_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
        `project_location.ilike.%${q}%`,
        `service_required.ilike.%${q}%`,
        `province.ilike.%${q}%`,
      ].join(",");
      if (assetNameSearchIds.length) {
        query = query.or(
          `${headerOr},id.in.(${assetNameSearchIds.join(",")})`,
        );
      } else {
        query = query.or(headerOr);
      }
    }
  }

  if (assetMatchedIds !== null) {
    if (assetMatchedIds.length === 0) {
      return emptyResult(page, pageSize);
    }
    query = query.in("id", assetMatchedIds);
  }

  query = query.order(sortField, { ascending: direction === "asc" });

  const quantityFilterActive =
    Boolean(filters.minMaterialArea) ||
    Boolean(filters.maxMaterialArea) ||
    Boolean(filters.minTankCapacity) ||
    Boolean(filters.maxTankCapacity) ||
    filters.hasCalculator === "1" ||
    filters.hasAttachments === "1" ||
    filters.hasAttachments === "0" ||
    filters.hasDrawings === "1";

  const fetchFrom = quantityFilterActive ? 0 : (page - 1) * pageSize;
  const fetchTo = quantityFilterActive ? 499 : fetchFrom + pageSize - 1;

  const { data, error, count } = await query.range(fetchFrom, fetchTo);

  if (error) {
    return {
      data: [],
      rows: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      error: publicErrorMessage(error.message),
    };
  }

  const ids = (data ?? []).map((r) => r.id as string);
  const [emailById, attachmentCounts, assetsByRfq] = await Promise.all([
    loadAssigneeEmails(supabase, data as RFQListItem[]),
    loadAttachmentCounts(supabase, ids),
    loadAssetsByRfq(supabase, ids),
  ]);

  let enriched: RFQListItem[] = ((data ?? []) as RFQListItem[]).map((r) => {
    const assets = assetsByRfq[r.id] ?? [];
    const summary = summariseAssetQuantities(assets);
    const channel =
      r.enquiry_channel ||
      inferEnquiryChannel({
        enquiry_channel: r.enquiry_channel,
        source_page: r.source_page,
        has_calculator_data: r.has_calculator_data,
        calculator_type: r.calculator_type,
        asset_count: summary.assetCount,
      });
    return {
      ...r,
      enquiry_channel: channel,
      assignee_email: r.assigned_to ? emailById[r.assigned_to] ?? null : null,
      attachment_count: attachmentCounts[r.id] ?? 0,
      asset_count: summary.assetCount,
      asset_types: summary.assetTypes,
      quantity_lines: formatQuantitySummaries(summary),
      quantity_summary: summary,
      measurement_status_label: measurementLabel(summary, {
        ...r,
        enquiry_channel: channel,
        asset_count: summary.assetCount,
      }),
      source_badge_label: enquiryChannelLabel(channel),
    };
  });

  if (filters.hasAttachments === "1") {
    enriched = enriched.filter((r) => (r.attachment_count ?? 0) > 0);
  }
  if (filters.hasAttachments === "0") {
    enriched = enriched.filter((r) => (r.attachment_count ?? 0) === 0);
  }
  if (filters.hasDrawings === "1") {
    enriched = enriched.filter((r) =>
      (assetsByRfq[r.id] ?? []).some(
        (a) =>
          a.measurement_method === "drawings" ||
          a.measurement_status === "drawing_received",
      ),
    );
  }
  if (filters.hasCalculator === "1") {
    enriched = enriched.filter(
      (r) => Boolean(r.calculator_type) || (r.asset_count ?? 0) > 0,
    );
  }
  if (filters.minMaterialArea) {
    const min = Number(filters.minMaterialArea);
    if (Number.isFinite(min)) {
      enriched = enriched.filter(
        (r) => (r.quantity_summary?.liningMaterialM2 ?? 0) >= min,
      );
    }
  }
  if (filters.maxMaterialArea) {
    const max = Number(filters.maxMaterialArea);
    if (Number.isFinite(max)) {
      enriched = enriched.filter(
        (r) => (r.quantity_summary?.liningMaterialM2 ?? 0) <= max,
      );
    }
  }
  if (filters.minTankCapacity) {
    const min = Number(filters.minTankCapacity);
    if (Number.isFinite(min)) {
      enriched = enriched.filter(
        (r) => (r.quantity_summary?.steelCapacityKL ?? 0) >= min,
      );
    }
  }
  if (filters.maxTankCapacity) {
    const max = Number(filters.maxTankCapacity);
    if (Number.isFinite(max)) {
      enriched = enriched.filter(
        (r) => (r.quantity_summary?.steelCapacityKL ?? 0) <= max,
      );
    }
  }

  let total = count ?? enriched.length;
  if (quantityFilterActive) {
    total = enriched.length;
    const from = (page - 1) * pageSize;
    enriched = enriched.slice(from, from + pageSize);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return {
    data: enriched,
    rows: enriched,
    total,
    page,
    pageSize,
    totalPages,
    error: null,
  };
}

function emptyResult(page: number, pageSize: number): PaginatedRFQResult {
  return {
    data: [],
    rows: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
    error: null,
  };
}

async function resolveAssetNameSearchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  qRaw: string,
): Promise<string[]> {
  const q = sanitiseRfqSearch(qRaw);
  if (!q) return [];
  const { data } = await supabase
    .from("rfq_assets")
    .select("rfq_id")
    .ilike("asset_name", `%${q}%`)
    .limit(500);
  return [...new Set((data ?? []).map((r) => r.rfq_id as string))];
}

async function resolveAssetMatchedRfqIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: RFQListFilters,
): Promise<string[]> {
  let assetQuery = supabase
    .from("rfq_assets")
    .select(
      "rfq_id, asset_type, measurement_method, material_preference, measurement_status, calculated_outputs, confirmed_material_area_m2, confirmed_capacity_kl, quantity",
    );

  if (filters.assetType) assetQuery = assetQuery.eq("asset_type", filters.assetType);
  if (filters.measurementMethod) {
    assetQuery = assetQuery.eq("measurement_method", filters.measurementMethod);
  }
  if (filters.materialPreference) {
    const material = sanitiseRfqSearch(filters.materialPreference);
    if (material) {
      assetQuery = assetQuery.ilike("material_preference", `%${material}%`);
    }
  }
  if (filters.measurementRequired === "1") {
    assetQuery = assetQuery.or(
      "measurement_status.eq.site_measurement_required,measurement_method.eq.site_measurement_required",
    );
  }
  if (filters.hasDrawings === "1") {
    assetQuery = assetQuery.or(
      "measurement_method.eq.drawings,measurement_status.eq.drawing_received",
    );
  }

  const { data } = await assetQuery.limit(2000);
  if (!data?.length) return [];

  const rows = data as Array<{
    rfq_id: string;
    asset_type: string;
    calculated_outputs: Record<string, unknown> | null;
    confirmed_material_area_m2: number | null;
    confirmed_capacity_kl: number | null;
    quantity: number;
    measurement_status: string;
  }>;

  if (
    filters.minMaterialArea ||
    filters.maxMaterialArea ||
    filters.minTankCapacity ||
    filters.maxTankCapacity
  ) {
    const byRfq = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byRfq.get(row.rfq_id) ?? [];
      list.push(row);
      byRfq.set(row.rfq_id, list);
    }
    const kept: string[] = [];
    for (const [rfqId, assets] of byRfq) {
      const summary = summariseAssetQuantities(assets);
      if (
        filters.minMaterialArea &&
        summary.liningMaterialM2 < Number(filters.minMaterialArea)
      ) {
        continue;
      }
      if (
        filters.maxMaterialArea &&
        summary.liningMaterialM2 > Number(filters.maxMaterialArea)
      ) {
        continue;
      }
      if (
        filters.minTankCapacity &&
        summary.steelCapacityKL < Number(filters.minTankCapacity)
      ) {
        continue;
      }
      if (
        filters.maxTankCapacity &&
        summary.steelCapacityKL > Number(filters.maxTankCapacity)
      ) {
        continue;
      }
      kept.push(rfqId);
    }
    return kept;
  }

  return [...new Set(rows.map((r) => r.rfq_id))];
}

async function loadAssigneeEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RFQListItem[],
) {
  const assigneeIds = [
    ...new Set(rows.map((r) => r.assigned_to).filter(Boolean)),
  ] as string[];
  if (!assigneeIds.length) return {} as Record<string, string>;
  const { data: profiles } = await supabase
    .from("admin_profiles")
    .select("id, email")
    .in("id", assigneeIds);
  return Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]));
}

async function loadAttachmentCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
) {
  const attachmentCounts: Record<string, number> = {};
  if (!ids.length) return attachmentCounts;
  const { data: attachments } = await supabase
    .from("rfq_attachments")
    .select("rfq_id")
    .in("rfq_id", ids);
  for (const row of attachments ?? []) {
    attachmentCounts[row.rfq_id] = (attachmentCounts[row.rfq_id] ?? 0) + 1;
  }
  return attachmentCounts;
}

async function loadAssetsByRfq(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
) {
  const assetsByRfq: Record<
    string,
    Array<{
      asset_type: string;
      quantity?: number;
      measurement_status?: string | null;
      measurement_method?: string | null;
      calculated_outputs?: Record<string, unknown> | null;
      confirmed_material_area_m2?: number | null;
      confirmed_installation_area_m2?: number | null;
      confirmed_capacity_kl?: number | null;
      estimator_confirmed?: boolean | null;
    }>
  > = {};
  if (!ids.length) return assetsByRfq;
  const { data: assets } = await supabase
    .from("rfq_assets")
    .select(
      "rfq_id, asset_type, quantity, measurement_status, measurement_method, calculated_outputs, confirmed_material_area_m2, confirmed_installation_area_m2, confirmed_capacity_kl, estimator_confirmed",
    )
    .in("rfq_id", ids);
  for (const asset of assets ?? []) {
    const list = assetsByRfq[asset.rfq_id] ?? [];
    list.push(asset);
    assetsByRfq[asset.rfq_id] = list;
  }
  return assetsByRfq;
}

function measurementLabel(
  summary: AssetQuantitySummary,
  row: RFQListItem,
): string {
  if (row.site_measurement_required || summary.needsSiteMeasurement) {
    return "Site measurement required";
  }
  if (summary.allConfirmed) return "Confirmed for quote";
  if (summary.assetCount === 0) {
    if (isSimpleEnquiryChannel(row.enquiry_channel)) {
      return (row.measurement_status || "information_not_yet_confirmed").replace(
        /_/g,
        " ",
      );
    }
    return "No assets yet";
  }
  const unique = [...new Set(summary.measurementStatuses)];
  if (unique.length === 1) return unique[0].replace(/_/g, " ");
  return "Mixed";
}

export function rfqSizeLabel(row: RFQListItem): string {
  if (row.quantity_lines?.length) return row.quantity_lines.join(" · ");
  const text =
    row.approximate_project_size_text || row.approximate_project_size;
  return summariseCalculatorSize(
    row.calculator_type,
    row.calculator_result,
    text,
  );
}
