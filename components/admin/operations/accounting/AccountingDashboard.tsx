"use client";

import { useState } from "react";
import type { FinancialSnapshot } from "@/lib/operations/financials";
import { ACCOUNTING_TARGETS, marginDomain, monthLabel, type AccountingDashboard as Dashboard, type Metric } from "@/lib/operations/financial-metrics";
import { MetricCard } from "./MetricCard";
import { fmtValue, SegmentedBar, TrendChart } from "./AcctCharts";

/** Chart colours: categorical slots 1–3 and the diverging pole, as CSS variables (see .acct in admin-layout.css). */
const C = {
  blue: "var(--acct-series-1)",
  orange: "var(--acct-series-2)",
  aqua: "var(--acct-series-3)",
  negative: "var(--acct-negative)",
  age: ["var(--acct-seq-250)", "var(--acct-seq-350)", "var(--acct-seq-450)", "var(--acct-seq-550)", "var(--acct-seq-650)"],
};

function Panel({ title, sub, children, wide }: { title: string; sub?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`acct-panel${wide ? " acct-panel--wide" : ""}`}>
      <header className="acct-panel__head">
        <h3>{title}</h3>
        {sub ? <p>{sub}</p> : null}
      </header>
      {children}
    </section>
  );
}

function AgeList({ title, total, parts }: { title: string; total: number; parts: { name: string; value: number; color: string }[] }) {
  return (
    <div className="acct-age">
      <div className="acct-age__head">
        <span>{title}</span>
        <strong>{fmtValue(total, "rand")}</strong>
      </div>
      <SegmentedBar parts={parts} label={title} />
      <ul className="acct-age__list">
        {parts.map((p) => (
          <li key={p.name}>
            <span className="acct-age__swatch" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="acct-age__amt">{fmtValue(p.value, "rand")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const byId = (list: Metric[], id: string) => list.find((m) => m.id === id) as Metric;

export function AccountingDashboard({ d, s }: { d: Dashboard; s: FinancialSnapshot }) {
  const [view, setView] = useState<"monthly" | "year">("monthly");
  const labels = d.rows.map((r) => r.label);
  const forecastLabels = d.revenueForecast.map((f) => f.label);
  const cashForecastLabels = s.forecast.map((f) => monthLabel(f.month));
  const fyStart = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${s.financialYearStart}T00:00:00Z`));
  const ageParts = (a: FinancialSnapshot["debtors"]["ageing"]) => [
    { name: "Not yet due", value: a.current, color: C.age[0] },
    { name: "1–30 days late", value: a["1-30"], color: C.age[1] },
    { name: "31–60 days late", value: a["31-60"], color: C.age[2] },
    { name: "61–90 days late", value: a["61-90"], color: C.age[3] },
    { name: "Over 90 days late", value: a["90+"], color: C.age[4] },
  ];
  const m = (id: string) => byId(d.monthly, id);
  const marginRange = marginDomain(
    d.rows.flatMap((r) => [r.grossMargin, r.netMargin]),
    [ACCOUNTING_TARGETS.grossMarginPercent.max, ACCOUNTING_TARGETS.grossMarginPercent.min, ACCOUNTING_TARGETS.netMarginPercent.min],
  );
  const outlierMonths = d.rows
    .filter((r) => [r.grossMargin, r.netMargin].some((v) => v !== null && (v < marginRange.min || v > marginRange.max)))
    .map((r) => r.label);
  const y = (id: string) => byId(d.yearEnd, id);

  return (
    <div className="acct">
      <div className="acct-switch" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "monthly"} className={view === "monthly" ? "is-active" : ""} onClick={() => setView("monthly")}>
          Every month
        </button>
        <button type="button" role="tab" aria-selected={view === "year"} className={view === "year" ? "is-active" : ""} onClick={() => setView("year")}>
          Financial year
        </button>
      </div>

      {d.notes.map((n) => (
        <p key={n} className="acct-notice">
          {n}
        </p>
      ))}

      {view === "monthly" ? (
        <>
          <p className="acct-lede">Catch margin squeeze, cash crunches and a stalling sales pipeline early. Figures from Xero; enquiries from the website.</p>

          <div className="acct-kpis">
            {["cash", "ocf", "revenue", "gross-margin", "net-margin", "ar-days"].map((id) => (
              <MetricCard key={id} m={m(id)} large />
            ))}
          </div>

          <div className="acct-grid">
            <Panel title="Revenue and net profit" sub="Last 12 complete months, excl. VAT, with a 3-month revenue trend (estimate)." wide>
              <TrendChart
                title="Revenue and net profit per month"
                labels={labels}
                forecastLabels={forecastLabels}
                fmt="rand"
                width={1240}
                height={300}
                series={[
                  {
                    name: "Revenue",
                    color: C.blue,
                    kind: "bar",
                    values: d.rows.map((r) => r.income),
                    forecast: d.revenueForecast.map((f) => f.value),
                  },
                  { name: "Net profit", color: C.orange, kind: "line", values: d.rows.map((r) => r.netProfit) },
                ]}
              />
            </Panel>

            <Panel title="Cash in the bank" sub="Month-end balances, today, then the forecast month-ends from open invoices and bills.">
              <TrendChart
                title="Cash at month end and forecast"
                labels={[...d.cashHistory.map((c) => c.label), ...(s.cash ? ["Today"] : [])]}
                forecastLabels={cashForecastLabels}
                fmt="rand"
                legend={false}
                series={[
                  {
                    name: "Cash",
                    color: C.blue,
                    kind: "area",
                    values: [...d.cashHistory.map((c) => c.value), ...(s.cash ? [s.cash.total] : [])],
                    forecast: s.forecast.map((f) => f.closing),
                  },
                ]}
              />
            </Panel>

            <Panel title="Operating cash flow" sub="Cash the work itself produced each month (profit adjusted for debtors, stock and unpaid bills).">
              <TrendChart
                title="Operating cash flow per month"
                labels={labels}
                fmt="rand"
                legend={false}
                series={[{ name: "Operating cash flow", color: C.blue, kind: "bar", values: d.ocf, barColor: (v) => (v < 0 ? C.negative : C.blue) }]}
              />
            </Panel>

            <Panel title="Margins" sub="Gross and net profit as a share of revenue, against your targets.">
              <TrendChart
                title="Gross and net margin per month"
                labels={labels}
                fmt="percent"
                domain={marginRange}
                refBands={[
                  {
                    from: ACCOUNTING_TARGETS.grossMarginPercent.min,
                    to: ACCOUNTING_TARGETS.grossMarginPercent.max,
                    label: `Gross target ${ACCOUNTING_TARGETS.grossMarginPercent.min}–${ACCOUNTING_TARGETS.grossMarginPercent.max}%`,
                  },
                ]}
                refLines={[{ value: ACCOUNTING_TARGETS.netMarginPercent.min, label: `Net target ${ACCOUNTING_TARGETS.netMarginPercent.min}%` }]}
                series={[
                  { name: "Gross margin", color: C.blue, kind: "line", values: d.rows.map((r) => r.grossMargin) },
                  { name: "Net margin", color: C.orange, kind: "line", values: d.rows.map((r) => r.netMargin) },
                ]}
              />
              {outlierMonths.length ? (
                <p className="acct-chart-note">
                  <span className="acct-outlier-key" aria-hidden="true" /> {outlierMonths.join(" and ")}: off the scale (costs far above revenue that month), shown at the
                  edge with the real figure.
                </p>
              ) : null}
            </Panel>

            <Panel title="Money owed" sub="Open invoices and bills in Xero, by how late they are.">
              <div className="acct-ages">
                <AgeList title="Customers owe Damtech" total={s.debtors.total} parts={ageParts(s.debtors.ageing)} />
                <AgeList title="Damtech owes suppliers" total={s.creditors.total} parts={ageParts(s.creditors.ageing)} />
              </div>
              <div className="acct-mini">
                <MetricCard m={m("ar-days")} />
                <MetricCard m={m("ap-days")} />
              </div>
            </Panel>

            <Panel title="Sales pipeline" sub="Website enquiries and Xero quotes, last 6 months.">
              <TrendChart
                title="Enquiries, quotes sent and quotes won per month"
                labels={d.pipeline.months.map((p) => p.label)}
                fmt="count"
                height={210}
                series={[
                  { name: "Enquiries", color: C.blue, kind: "bar", values: d.pipeline.months.map((p) => p.enquiries) },
                  { name: "Quotes sent", color: C.orange, kind: "bar", values: d.pipeline.months.map((p) => p.quotesSent) },
                  { name: "Won", color: C.aqua, kind: "bar", values: d.pipeline.months.map((p) => p.won) },
                ]}
              />
              <div className="acct-mini acct-mini--3">
                <MetricCard m={m("lead-conversion")} />
                <MetricCard m={m("win-rate")} />
                <MetricCard m={m("pipeline")} />
              </div>
            </Panel>

            <Panel title="Customers" sub="New and returning customers invoiced each month (Xero).">
              <TrendChart
                title="New and returning customers per month"
                labels={d.customers.months.map((c) => c.label)}
                fmt="count"
                height={210}
                series={[
                  { name: "New", color: C.blue, kind: "bar", stack: "c", values: d.customers.months.map((c) => c.newCustomers) },
                  { name: "Returning", color: C.orange, kind: "bar", stack: "c", values: d.customers.months.map((c) => c.returning) },
                ]}
              />
              <div className="acct-mini acct-mini--3">
                <MetricCard m={m("cac")} />
                <MetricCard m={m("ltv")} />
                <MetricCard m={m("retention")} />
              </div>
            </Panel>

            <Panel title="Operations" sub="Productive time of the team." wide>
              <div className="acct-mini acct-mini--solo">
                <MetricCard m={m("utilisation")} />
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <p className="acct-lede">
            Structural health for the year-end review: solvency, returns and growth. Financial year from {fyStart}. Ratios use the balance
            sheet {s.balanceToday ? "today" : "at the last month-end"}.
          </p>
          <div className="acct-kpis">
            {["yoy", "ebitda", "working-capital", "current-ratio", "quick-ratio", "debt-to-equity"].map((id) => (
              <MetricCard key={id} m={y(id)} large />
            ))}
          </div>
          <div className="acct-grid">
            <Panel title="Working capital" sub="Current assets less current liabilities at each month-end.">
              <TrendChart
                title="Working capital at month end"
                labels={d.cashHistory.map((c) => c.label)}
                fmt="rand"
                legend={false}
                series={[{ name: "Working capital", color: C.blue, kind: "area", values: (y("working-capital").trend ?? []) as (number | null)[] }]}
              />
            </Panel>
            <Panel title="EBITDA by month" sub="Core operating profit before interest, tax, depreciation and amortisation.">
              <TrendChart
                title="EBITDA per month"
                labels={labels}
                fmt="rand"
                legend={false}
                series={[{ name: "EBITDA", color: C.blue, kind: "bar", values: d.rows.map((r) => r.ebitda), barColor: (v) => (v < 0 ? C.negative : C.blue) }]}
              />
            </Panel>
            <Panel title="Returns and debt" wide>
              <div className="acct-mini acct-mini--4">
                {["interest-cover", "roa", "roe", "roi"].map((id) => (
                  <MetricCard key={id} m={y(id)} />
                ))}
              </div>
            </Panel>
            <Panel title="This year against last year" wide>
              <table className="acct-table">
                <thead>
                  <tr>
                    <th scope="col">Figure</th>
                    <th scope="col">This year to date</th>
                    <th scope="col">Same date last year</th>
                    <th scope="col">Last full year</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Revenue", "income"],
                      ["Gross profit", "grossProfit"],
                      ["Operating expenses", "operatingExpenses"],
                      ["Net profit", "netProfit"],
                    ] as const
                  ).map(([label, key]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{fmtValue(s.ytd?.[key] ?? null, "rand")}</td>
                      <td>{fmtValue(s.priorYearToDate?.[key] ?? null, "rand")}</td>
                      <td>{fmtValue(s.priorYear?.[key] ?? null, "rand")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
