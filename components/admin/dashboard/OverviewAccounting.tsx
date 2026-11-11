import Link from "next/link";
import type { DashboardMetrics } from "@/lib/admin/dashboard/types";
import type { FinancialSnapshot } from "@/lib/operations/financials";
import { buildAccountingDashboard, monthLabel, type Metric } from "@/lib/operations/financial-metrics";
import { MetricCard } from "@/components/admin/operations/accounting/MetricCard";
import { TrendChart } from "@/components/admin/operations/accounting/AcctCharts";

/**
 * Overview in the Accounting style: the main money figures (with the owner's
 * targets) and the work figures as cards, then revenue and cash as graphs.
 * Roles that may not see financials get the work cards only.
 */

const FIN = "/admin/operations/financials/";

function workMetrics(metrics: DashboardMetrics, activeProjects: number | null): { m: Metric; href: string }[] {
  const p = metrics.primary;
  const enquiryNote =
    p.newRfqsDelta == null
      ? metrics.rangeLabel
      : p.newRfqsDelta === 0
        ? `Same as the period before (${metrics.rangeLabel.toLowerCase()}).`
        : `${p.newRfqsDelta > 0 ? "+" : ""}${p.newRfqsDelta} on the period before (${metrics.rangeLabel.toLowerCase()}).`;
  const cards: { m: Metric; href: string }[] = [
    { m: { id: "enquiries", label: "New enquiries", value: p.newRfqs, format: "count", note: enquiryNote, basis: "actual" }, href: "/admin/rfqs/" },
  ];
  if (activeProjects !== null) {
    cards.push({
      m: { id: "projects", label: "Active projects", value: activeProjects, format: "count", note: "Won jobs not yet completed.", basis: "actual" },
      href: "/admin/operations/projects/",
    });
  }
  cards.push(
    {
      m: { id: "ready", label: "Ready to quote", value: p.readyForQuote, format: "count", note: "Open enquiries with everything in.", basis: "actual" },
      href: "/admin/rfqs/?status=ready_for_quote",
    },
    {
      m: { id: "approve", label: "Quotations to approve", value: p.awaitingApproval, format: "count", note: "Before they go to the customer.", basis: "actual" },
      href: "/admin/quotes/?status=internal_review",
    },
  );
  return cards;
}

export function OverviewAccounting({
  metrics,
  activeProjects,
  financials,
}: {
  metrics: DashboardMetrics;
  activeProjects: number | null;
  financials: FinancialSnapshot | null;
}) {
  const work = workMetrics(metrics, activeProjects);
  if (!financials) {
    return (
      <div className="acct">
        <section className="acct-kpis acct-kpis--4" aria-label="Key figures">
          {work.map(({ m, href }) => (
            <MetricCard key={m.id} m={m} href={href} large />
          ))}
        </section>
      </div>
    );
  }

  const d = buildAccountingDashboard(financials, []);
  const pick = (id: string) => d.monthly.find((m) => m.id === id) as Metric;
  const owed: Metric = {
    id: "owed",
    label: "Owed to Damtech",
    value: financials.debtors.total,
    format: "rand",
    health: pick("ar-days").health,
    note: `${pick("ar-days").value !== null ? `${Math.round(pick("ar-days").value as number)} debtor days. ` : ""}${
      financials.debtors.total - financials.debtors.ageing.current > 0
        ? `R${Math.round(financials.debtors.total - financials.debtors.ageing.current).toLocaleString("en-ZA").replace(/,/g, " ")} is overdue.`
        : "Nothing overdue."
    }`,
    basis: "actual",
  };
  const money: { m: Metric; href: string }[] = [
    { m: pick("cash"), href: FIN },
    { m: pick("revenue"), href: FIN },
    { m: pick("gross-margin"), href: FIN },
    { m: pick("net-margin"), href: FIN },
    { m: owed, href: FIN },
  ];
  const cards = [...money, ...work].slice(0, 8);
  const labels = d.rows.map((r) => r.label);
  const refreshed = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }).format(
    new Date(financials.fetchedAt),
  );

  return (
    <div className="acct">
      <section className="acct-kpis acct-kpis--4" aria-label="Key figures">
        {cards.map(({ m, href }) => (
          <MetricCard key={m.id} m={m} href={href} large />
        ))}
      </section>

      <div className="acct-grid acct-grid--overview">
        <section className="acct-panel">
          <header className="acct-panel__head acct-panel__head--row">
            <div>
              <h3>Revenue and net profit</h3>
              <p>Last 12 months from Xero (refreshed {refreshed}), with a 3-month trend estimate.</p>
            </div>
            <Link href={FIN} className="acct-panel__link">
              Accounting
            </Link>
          </header>
          <TrendChart
            title="Revenue and net profit per month"
            labels={labels}
            forecastLabels={d.revenueForecast.map((f) => f.label)}
            fmt="rand"
            series={[
              { name: "Revenue", color: "var(--acct-series-1)", kind: "bar", values: d.rows.map((r) => r.income), forecast: d.revenueForecast.map((f) => f.value) },
              { name: "Net profit", color: "var(--acct-series-2)", kind: "line", values: d.rows.map((r) => r.netProfit) },
            ]}
          />
        </section>
        <section className="acct-panel">
          <header className="acct-panel__head acct-panel__head--row">
            <div>
              <h3>Cash in the bank</h3>
              <p>Month-end balances, today, then the forecast from open invoices and bills.</p>
            </div>
            <Link href={FIN} className="acct-panel__link">
              Accounting
            </Link>
          </header>
          <TrendChart
            title="Cash at month end and forecast"
            labels={[...d.cashHistory.map((c) => c.label), ...(financials.cash ? ["Today"] : [])]}
            forecastLabels={financials.forecast.map((f) => monthLabel(f.month))}
            fmt="rand"
            legend={false}
            series={[
              {
                name: "Cash",
                color: "var(--acct-series-1)",
                kind: "area",
                values: [...d.cashHistory.map((c) => c.value), ...(financials.cash ? [financials.cash.total] : [])],
                forecast: financials.forecast.map((f) => f.closing),
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
