import { createClient } from "@/lib/supabase/server";
import { formatQuantitySummaries, summariseAssetQuantities } from "@/lib/rfq/quantity-summary";
import { todayIsoDateJohannesburg, addDaysToIsoDate } from "@/lib/quotes/totals";
import {
  DASHBOARD_RANGE_OPTIONS,
  type DashboardActivityItem,
  type DashboardBreakdownRow,
  type DashboardMetrics,
  type DashboardRangeId,
  type DashboardRecentRfq,
  type DashboardStageRow,
} from "./types";

type DateWindow = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  label: string;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function resolveWindow(rangeId: DashboardRangeId): DateWindow {
  const now = new Date();
  const today = startOfDay(now);
  const label =
    DASHBOARD_RANGE_OPTIONS.find((option) => option.id === rangeId)?.label ||
    "Last 30 days";

  if (rangeId === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - 6);
    return {
      from,
      to: endOfDay(now),
      previousFrom,
      previousTo: endOfDay(previousTo),
      label,
    };
  }

  if (rangeId === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - 29);
    return {
      from,
      to: endOfDay(now),
      previousFrom,
      previousTo: endOfDay(previousTo),
      label,
    };
  }

  if (rangeId === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousTo = new Date(from);
    previousTo.setMilliseconds(-1);
    return {
      from,
      to: endOfDay(now),
      previousFrom,
      previousTo,
      label,
    };
  }

  if (rangeId === "prev_month") {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    const previousFrom = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const previousTo = new Date(from);
    previousTo.setMilliseconds(-1);
    return { from, to, previousFrom, previousTo, label };
  }

  // ytd
  const from = new Date(today.getFullYear(), 0, 1);
  const previousFrom = new Date(today.getFullYear() - 1, 0, 1);
  const previousTo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return {
    from,
    to: endOfDay(now),
    previousFrom,
    previousTo,
    label,
  };
}

function percentage(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function toBreakdown(
  rows: Array<{ name: string; count: number }>,
): DashboardBreakdownRow[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((row) => ({
      name: row.name,
      count: row.count,
      percentage: percentage(row.count, total),
    }));
}

function activityLabel(action: string): string {
  const map: Record<string, string> = {
    rfq_created: "RFQ submitted",
    rfq_created_multi_asset: "RFQ submitted",
    rfq_status_updated: "RFQ status updated",
    rfq_assigned: "RFQ assigned",
    rfq_admin_notification_resent: "RFQ notification resent",
    quote_created: "Quote created",
    quote_approved: "Quote approved",
    quote_sent: "Quote sent",
    quote_viewed: "Quote viewed",
    quote_accepted: "Quote accepted",
    quote_rejected: "Quote rejected",
    customer_created: "Customer created",
    pricing_updated: "Pricing updated",
    material_created: "Material price added",
    supplier_created: "Supplier added",
  };
  return map[action] || action.replaceAll("_", " ");
}

function entityHref(
  entityType: string | null,
  entityId: string | null,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "rfq") return `/admin/rfqs/${entityId}/`;
  if (entityType === "quote") return `/admin/quotes/${entityId}/`;
  if (entityType === "customer") return `/admin/customers/${entityId}/`;
  return null;
}

function entityLabel(
  entityType: string | null,
  afterData: Record<string, unknown> | null,
  entityId: string | null,
): string {
  if (afterData?.rfq_number && typeof afterData.rfq_number === "string") {
    return afterData.rfq_number;
  }
  if (afterData?.quote_number && typeof afterData.quote_number === "string") {
    return afterData.quote_number;
  }
  if (afterData?.name && typeof afterData.name === "string") {
    return afterData.name;
  }
  if (entityType && entityId) {
    return `${entityType} ${entityId.slice(0, 8)}`;
  }
  return "Record";
}

export async function getDashboardMetrics(
  rangeId: DashboardRangeId = "30d",
): Promise<DashboardMetrics> {
  const window = resolveWindow(rangeId);
  const empty: DashboardMetrics = {
    rangeId,
    rangeLabel: window.label,
    primary: {
      newRfqs: 0,
      newRfqsDelta: null,
      readyForQuote: 0,
      awaitingApproval: 0,
      acceptedValue: 0,
    },
    rfqStages: [],
    quotePipeline: [],
    provisional: {
      linerAreaM2: 0,
      tankCapacityKl: 0,
      torchOnAreaM2: 0,
    },
    services: [],
    provinces: [],
    recentRfqs: [],
    recentActivity: [],
    expiringQuotesCount: 0,
  };

  try {
    const supabase = await createClient();
    const fromIso = window.from.toISOString();
    const toIso = window.to.toISOString();
    const prevFromIso = window.previousFrom.toISOString();
    const prevToIso = window.previousTo.toISOString();
    const today = todayIsoDateJohannesburg();
    const in7 = addDaysToIsoDate(today, 7);

    const [
      newInPeriod,
      newPrevious,
      readyCount,
      reviewCount,
      stageRows,
      quoteRows,
      assets,
      periodRfqs,
      recentRfqsResult,
      activityResult,
      expiring,
    ] = await Promise.all([
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", fromIso)
        .lte("submitted_at", toIso),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", prevFromIso)
        .lte("submitted_at", prevToIso),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", "ready_for_quote"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "internal_review")
        .eq("is_latest_revision", true),
      supabase.from("rfqs").select("status").limit(5000),
      supabase
        .from("quotes")
        .select("status, total_inc_vat")
        .eq("is_latest_revision", true)
        .limit(5000),
      supabase
        .from("rfq_assets")
        .select(
          "rfq_id, asset_type, quantity, measurement_status, measurement_method, calculated_outputs, confirmed_material_area_m2, confirmed_installation_area_m2, confirmed_capacity_kl, estimator_confirmed",
        )
        .limit(3000),
      supabase
        .from("rfqs")
        .select("service_required, province")
        .gte("submitted_at", fromIso)
        .lte("submitted_at", toIso)
        .limit(2000),
      supabase
        .from("rfqs")
        .select(
          "id, rfq_number, contact_name, company_name, service_required, project_location, province, status, submitted_at",
        )
        .order("submitted_at", { ascending: false })
        .limit(8),
      supabase
        .from("audit_log")
        .select(
          "id, action, entity_type, entity_id, actor_email, after_data, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "viewed"])
        .eq("is_latest_revision", true)
        .gte("valid_until", today)
        .lte("valid_until", in7),
    ]);

    const stageOrder: Array<{ status: string; label: string }> = [
      { status: "new", label: "New" },
      { status: "reviewing", label: "Reviewing" },
      { status: "information_required", label: "Information Required" },
      { status: "site_measurement_required", label: "Site Measurement Needed" },
      { status: "ready_for_quote", label: "Ready for Quote" },
      { status: "converted", label: "Converted" },
    ];

    const stageCounts = new Map<string, number>();
    for (const row of stageRows.data ?? []) {
      const status = String(row.status || "");
      stageCounts.set(status, (stageCounts.get(status) ?? 0) + 1);
    }
    const stageTotal = stageOrder.reduce(
      (sum, stage) => sum + (stageCounts.get(stage.status) ?? 0),
      0,
    );
    const rfqStages: DashboardStageRow[] = stageOrder.map((stage) => {
      const count = stageCounts.get(stage.status) ?? 0;
      return {
        status: stage.status,
        label: stage.label,
        count,
        percentage: percentage(count, stageTotal),
        href: `/admin/rfqs/?status=${encodeURIComponent(stage.status)}`,
      };
    });

    const quoteBuckets: Array<{
      status: string;
      label: string;
      match: string[];
    }> = [
      { status: "draft", label: "Draft", match: ["draft"] },
      {
        status: "internal_review",
        label: "Awaiting Approval",
        match: ["internal_review"],
      },
      { status: "sent", label: "Sent", match: ["sent"] },
      { status: "viewed", label: "Viewed", match: ["viewed"] },
      { status: "accepted", label: "Accepted", match: ["accepted"] },
      {
        status: "rejected",
        label: "Rejected",
        match: ["rejected", "declined"],
      },
    ];

    const quotePipeline = quoteBuckets.map((bucket) => {
      const rows = (quoteRows.data ?? []).filter((row) =>
        bucket.match.includes(String(row.status)),
      );
      return {
        status: bucket.status,
        label: bucket.label,
        count: rows.length,
        value: rows.reduce((sum, row) => sum + Number(row.total_inc_vat || 0), 0),
        href: `/admin/quotes/?status=${encodeURIComponent(bucket.status)}`,
      };
    });

    const acceptedValue =
      quotePipeline.find((row) => row.status === "accepted")?.value ?? 0;

    const pipelineSummary = summariseAssetQuantities(assets.data ?? []);
    void formatQuantitySummaries(pipelineSummary);

    const serviceMap = new Map<string, number>();
    const provinceMap = new Map<string, number>();
    for (const row of periodRfqs.data ?? []) {
      const service = row.service_required?.trim() || "Unspecified";
      const province = row.province?.trim() || "Unspecified";
      serviceMap.set(service, (serviceMap.get(service) ?? 0) + 1);
      provinceMap.set(province, (provinceMap.get(province) ?? 0) + 1);
    }

    const recentRfqs: DashboardRecentRfq[] = (recentRfqsResult.data ?? []).map(
      (row) => ({
        id: row.id,
        rfqNumber: row.rfq_number,
        customer: row.company_name || row.contact_name || "—",
        service: row.service_required || "—",
        location: row.project_location || row.province || "—",
        status: row.status,
        submittedAt: row.submitted_at,
      }),
    );

    const recentActivity: DashboardActivityItem[] = (
      activityResult.data ?? []
    ).map((row) => ({
      id: row.id,
      action: activityLabel(String(row.action || "")),
      entityLabel: entityLabel(
        row.entity_type,
        (row.after_data as Record<string, unknown> | null) ?? null,
        row.entity_id,
      ),
      entityHref: entityHref(row.entity_type, row.entity_id),
      actor: row.actor_email || "System",
      createdAt: row.created_at,
    }));

    const newRfqs = newInPeriod.count ?? 0;
    const previous = newPrevious.count ?? 0;

    return {
      rangeId,
      rangeLabel: window.label,
      primary: {
        newRfqs,
        newRfqsDelta: newRfqs - previous,
        readyForQuote: readyCount.count ?? 0,
        awaitingApproval: reviewCount.count ?? 0,
        acceptedValue,
      },
      rfqStages,
      quotePipeline,
      provisional: {
        linerAreaM2: pipelineSummary.liningMaterialM2,
        tankCapacityKl: pipelineSummary.steelCapacityKL,
        torchOnAreaM2: pipelineSummary.torchOnM2,
      },
      services: toBreakdown(
        [...serviceMap.entries()].map(([name, count]) => ({ name, count })),
      ),
      provinces: toBreakdown(
        [...provinceMap.entries()].map(([name, count]) => ({ name, count })),
      ),
      recentRfqs,
      recentActivity,
      expiringQuotesCount: expiring.count ?? 0,
    };
  } catch (error) {
    console.error(
      "[dashboard] metrics failed:",
      error instanceof Error ? error.message : error,
    );
    return empty;
  }
}
