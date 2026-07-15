import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { formatZar } from "@/lib/estimating/money";
import { sumPipelineValue } from "@/lib/quotes/list";
import { addDaysToIsoDate, todayIsoDateJohannesburg } from "@/lib/quotes/totals";
import {
  formatQuantitySummaries,
  summariseAssetQuantities,
} from "@/lib/rfq/quantity-summary";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const metrics = await getDashboardMetrics();
  const rfqMetrics = await getRfqPipelineMetrics();
  const recent = await getRecentRfqs();

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard__intro">
        <p>
          Operational overview for Damtech quoting. Accepted quote value is not
          cash received. RFQ pipeline quantities are provisional estimates.
        </p>
      </section>

      <section className="admin-metric-grid" aria-label="RFQ pipeline metrics">
        {rfqMetrics.map((metric) => (
          <article key={metric.label} className="admin-metric-card">
            <p className="admin-metric-card__label">{metric.label}</p>
            <p className="admin-metric-card__value">{metric.value}</p>
            <p className="admin-metric-card__hint">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="admin-metric-grid" aria-label="Quote pipeline metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="admin-metric-card">
            <p className="admin-metric-card__label">{metric.label}</p>
            <p className="admin-metric-card__value">{metric.value}</p>
            <p className="admin-metric-card__hint">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-panels">
        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Quick actions</h2>
          </header>
          <div className="admin-panel__actions">
            <Link href="/admin/rfqs/" className="btn btn--md btn--primary">
              Review RFQs
            </Link>
            <Link href="/admin/quotes/" className="btn btn--md btn--primary">
              Quotes
            </Link>
            <Link href="/admin/quotes/new/" className="btn btn--md btn--secondary">
              New quote
            </Link>
            <Link href="/admin/customers/" className="btn btn--md btn--secondary">
              Customers
            </Link>
          </div>
        </article>

        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Recent RFQs</h2>
          </header>
          {recent.length === 0 ? (
            <div className="admin-empty">
              <p>No RFQs yet.</p>
            </div>
          ) : (
            <ul className="admin-list">
              {recent.map((rfq) => (
                <li key={rfq.id}>
                  <Link href={`/admin/rfqs/${rfq.id}/`}>{rfq.rfq_number}</Link>
                  {" · "}
                  {rfq.contact_name}
                  {" · "}
                  <span className={`admin-status admin-status--${rfq.status}`}>
                    {rfq.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Settings</h2>
          </header>
          <div className="admin-panel__actions">
            <Link href="/admin/settings/quotes/" className="btn btn--md btn--secondary">
              Quote settings
            </Link>
            <Link href="/admin/settings/company/" className="btn btn--md btn--secondary">
              Company
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

type Metric = { label: string; value: string | number; hint: string };

async function getRfqPipelineMetrics(): Promise<Metric[]> {
  const defaults: Metric[] = [
    { label: "New website RFQs", value: 0, hint: "Status: new" },
    { label: "RFQs with calculator data", value: 0, hint: "Assets or calculator" },
    { label: "Site measurement needed", value: 0, hint: "Estimate workflow" },
    { label: "Awaiting customer info", value: 0, hint: "Information required" },
    { label: "Ready for quote", value: 0, hint: "Estimator queue" },
    { label: "Converted this month", value: 0, hint: "Calendar month" },
    { label: "Avg response time", value: "—", hint: "Submitted → first review" },
    { label: "Provisional HDPE area", value: "0 m²", hint: "Estimate — not confirmed" },
    { label: "Provisional tank capacity", value: "0 kL", hint: "Estimate — not confirmed" },
  ];

  try {
    const supabase = await createClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      newCount,
      siteMeas,
      infoReq,
      ready,
      convertedMonth,
      openRfqs,
      assets,
    ] = await Promise.all([
      supabase.from("rfqs").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .or("status.eq.site_measurement_required,site_measurement_required.eq.true"),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", "information_required"),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", "ready_for_quote"),
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", "converted")
        .gte("updated_at", monthStart.toISOString()),
      supabase
        .from("rfqs")
        .select("id, submitted_at, reviewed_at, calculator_type, status, service_required, province")
        .order("submitted_at", { ascending: false })
        .limit(200),
      supabase
        .from("rfq_assets")
        .select(
          "rfq_id, asset_type, quantity, measurement_status, measurement_method, calculated_outputs, confirmed_material_area_m2, confirmed_installation_area_m2, confirmed_capacity_kl, estimator_confirmed",
        )
        .limit(2000),
    ]);

    const rfqRows = openRfqs.data ?? [];
    const withCalc = rfqRows.filter(
      (r) =>
        Boolean(r.calculator_type) ||
        (assets.data ?? []).some((a) => a.rfq_id === r.id),
    ).length;

    const reviewed = rfqRows.filter((r) => r.reviewed_at);
    let avgHours = "—";
    if (reviewed.length) {
      const hours =
        reviewed.reduce((sum, r) => {
          const start = new Date(r.submitted_at).getTime();
          const end = new Date(r.reviewed_at as string).getTime();
          return sum + (end - start) / 36e5;
        }, 0) / reviewed.length;
      avgHours = `${hours.toFixed(1)} h`;
    }

    const pipelineSummary = summariseAssetQuantities(assets.data ?? []);
    const qtyLines = formatQuantitySummaries(pipelineSummary);

    const byService: Record<string, number> = {};
    const byProvince: Record<string, number> = {};
    for (const row of rfqRows) {
      const service = row.service_required || "Unspecified";
      const province = row.province || "Unspecified";
      byService[service] = (byService[service] ?? 0) + 1;
      byProvince[province] = (byProvince[province] ?? 0) + 1;
    }
    const topService = Object.entries(byService).sort((a, b) => b[1] - a[1])[0];
    const topProvince = Object.entries(byProvince).sort((a, b) => b[1] - a[1])[0];

    return [
      {
        label: "New website RFQs",
        value: newCount.count ?? 0,
        hint: "Status: new",
      },
      {
        label: "RFQs with calculator data",
        value: withCalc,
        hint: "Among latest 200 RFQs",
      },
      {
        label: "Site measurement needed",
        value: siteMeas.count ?? 0,
        hint: "Flagged or status",
      },
      {
        label: "Awaiting customer info",
        value: infoReq.count ?? 0,
        hint: "Information required",
      },
      {
        label: "Ready for quote",
        value: ready.count ?? 0,
        hint: "Estimator queue",
      },
      {
        label: "Converted this month",
        value: convertedMonth.count ?? 0,
        hint: "Calendar month",
      },
      {
        label: "Avg response time",
        value: avgHours,
        hint: "Submitted → first review",
      },
      {
        label: "RFQs by service (top)",
        value: topService ? `${topService[0]} (${topService[1]})` : "—",
        hint: "Latest 200 RFQs",
      },
      {
        label: "RFQs by province (top)",
        value: topProvince ? `${topProvince[0]} (${topProvince[1]})` : "—",
        hint: "Latest 200 RFQs",
      },
      {
        label: "Provisional HDPE/PVC area",
        value: `${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(pipelineSummary.liningMaterialM2)} m²`,
        hint: "Estimate — not a booked order",
      },
      {
        label: "Provisional tank capacity",
        value: `${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(pipelineSummary.steelCapacityKL)} kL`,
        hint: "Estimate — separate from m²",
      },
      {
        label: "Provisional torch-on area",
        value: `${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(pipelineSummary.torchOnM2)} m²`,
        hint: qtyLines.find((l) => l.includes("Torch")) || "Estimate only",
      },
    ];
  } catch {
    return defaults;
  }
}

async function getDashboardMetrics(): Promise<Metric[]> {
  const defaults: Metric[] = [
    { label: "Draft quotes", value: 0, hint: "In progress" },
    { label: "Awaiting approval", value: 0, hint: "Internal review" },
    { label: "Sent value", value: formatZar(0), hint: "Pipeline" },
    { label: "Viewed value", value: formatZar(0), hint: "Awaiting response" },
    { label: "Accepted value", value: formatZar(0), hint: "Not cash received" },
    { label: "Rejected value", value: formatZar(0), hint: "Lost / declined" },
    { label: "Expiring in 7 days", value: 0, hint: "Sent or viewed" },
    { label: "Conversion rate", value: "—", hint: "Accepted / sent+viewed+accepted" },
    { label: "Average quote value", value: formatZar(0), hint: "Accepted average" },
  ];

  try {
    const supabase = await createClient();
    const today = todayIsoDateJohannesburg();
    const in7 = addDaysToIsoDate(today, 7);

    const [
      drafts,
      review,
      rejectedCount,
      expiring,
      sentValue,
      viewedValue,
      acceptedValue,
      rejectedValue,
      acceptedRows,
      sentLikeCount,
    ] = await Promise.all([
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft")
        .eq("is_latest_revision", true),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "internal_review")
        .eq("is_latest_revision", true),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .in("status", ["rejected", "declined"])
        .eq("is_latest_revision", true),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "viewed"])
        .eq("is_latest_revision", true)
        .gte("valid_until", today)
        .lte("valid_until", in7),
      sumPipelineValue(["sent"]),
      sumPipelineValue(["viewed"]),
      sumPipelineValue(["accepted"]),
      sumPipelineValue(["rejected"]),
      supabase
        .from("quotes")
        .select("total_inc_vat")
        .eq("status", "accepted")
        .eq("is_latest_revision", true),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "viewed", "accepted"])
        .eq("is_latest_revision", true),
    ]);

    const acceptedList = acceptedRows.data ?? [];
    const acceptedCount = acceptedList.length;
    const denom = sentLikeCount.count ?? 0;
    const conversion =
      denom > 0 ? `${((acceptedCount / denom) * 100).toFixed(1)}%` : "—";
    const avgAccepted =
      acceptedCount > 0
        ? acceptedList.reduce((s, r) => s + Number(r.total_inc_vat || 0), 0) /
          acceptedCount
        : 0;

    return [
      { label: "Draft quotes", value: drafts.count ?? 0, hint: "In progress" },
      {
        label: "Awaiting approval",
        value: review.count ?? 0,
        hint: "Internal review",
      },
      { label: "Sent value", value: formatZar(sentValue), hint: "Pipeline" },
      {
        label: "Viewed value",
        value: formatZar(viewedValue),
        hint: "Awaiting response",
      },
      {
        label: "Accepted value",
        value: formatZar(acceptedValue),
        hint: "Not cash received",
      },
      {
        label: "Rejected value",
        value: formatZar(rejectedValue),
        hint: `${rejectedCount.count ?? 0} quotes`,
      },
      {
        label: "Expiring in 7 days",
        value: expiring.count ?? 0,
        hint: "Sent or viewed",
      },
      {
        label: "Conversion rate",
        value: conversion,
        hint: "Accepted / (sent + viewed + accepted)",
      },
      {
        label: "Average quote value",
        value: formatZar(avgAccepted),
        hint: "Accepted average",
      },
    ];
  } catch {
    return defaults;
  }
}

async function getRecentRfqs() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rfqs")
      .select("id, rfq_number, contact_name, status")
      .order("submitted_at", { ascending: false })
      .limit(6);
    return data ?? [];
  } catch {
    return [];
  }
}
