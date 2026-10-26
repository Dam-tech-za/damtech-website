import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { loadLatestFinancials } from "@/lib/operations/financials-store";
import type { FigureBasis, PnlPeriod } from "@/lib/operations/financials";
import { xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { refreshFinancialsAction } from "@/app/admin/operations/actions";
import {
  AdminActionForm,
  AdminDataList,
  AdminEmptyState,
  AdminErrorState,
  AdminInfoBanner,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminSubmitButton,
  AdminTable,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Financials" };

const BASIS: Record<FigureBasis, { label: string; tone: string; help: string }> = {
  actual: { label: "Actual", tone: "ops-good", help: "From Xero reports, open invoices and bills." },
  forecast: { label: "Forecast", tone: "ops-info", help: "Open invoices and bills by due date. Leaves out anything not yet in Xero." },
  estimate: { label: "Estimate", tone: "ops-warn", help: "Average of past actuals, for reference only." },
};

function Basis({ basis }: { basis: FigureBasis }) {
  return <AdminStatusBadge status={BASIS[basis].tone} label={BASIS[basis].label} />;
}

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);
const monthLabel = (ym: string) =>
  new Intl.DateTimeFormat("en-ZA", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

function PnlStrip({ period, label }: { period: PnlPeriod; label: string }) {
  return (
    <AdminMetricStrip label={label}>
      <AdminMetricCard label="Revenue" value={formatOpsMoney(period.income)} />
      <AdminMetricCard label="Gross profit" value={formatOpsMoney(period.grossProfit)} hint={`Margin ${pct(period.grossMargin)}`} />
      <AdminMetricCard label="Operating expenses" value={formatOpsMoney(period.operatingExpenses)} />
      <AdminMetricCard
        label="Net profit (Xero)"
        value={formatOpsMoney(period.netProfit)}
        tone={period.netProfit < 0 ? "warning" : "default"}
      />
    </AdminMetricStrip>
  );
}

export default async function FinancialsPage() {
  await requireAdmin({ permission: "viewFinancials" });
  const { db } = await adminOpsDb({ permission: "viewFinancials" });
  const load = await loadLatestFinancials(db);
  const bridgeConfigured = xeroBridgeConfigFromEnv() !== null;

  const refresh = bridgeConfigured ? (
    <AdminActionForm action={refreshFinancialsAction} className="ops-sync__form">
      <AdminSubmitButton variant="secondary" pendingLabel="Reading Xero…">Refresh from Xero</AdminSubmitButton>
    </AdminActionForm>
  ) : null;

  if (load.state !== "ready") {
    return (
      <div className="admin-stack--page ops">
        <AdminPageHeader title="Financials" description="Company results from Xero. Nothing here is typed in by hand." primaryActionNode={refresh} />
        <OpsSetupBanners setup={{ tablesReady: load.state !== "tables_missing", bridgeConfigured }} />
        {load.state === "error" ? <AdminErrorState title="Financials could not be loaded." message={load.message} /> : null}
        {load.state === "empty" ? (
          <AdminPanel>
            <AdminEmptyState
              compact
              title="No Xero figures yet."
              description={bridgeConfigured ? "Refresh from Xero to load the first set." : "Figures appear after the Xero bridge key is set."}
            />
          </AdminPanel>
        ) : null}
      </div>
    );
  }

  const s = load.snapshot;
  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Financials"
        description={`From Xero, last refreshed ${formatOpsDateTime(s.fetchedAt)}. Change figures in Xero, not here.`}
        primaryActionNode={refresh}
      />

      <p className="ops-basis">
        {(Object.keys(BASIS) as FigureBasis[]).map((b) => (
          <span key={b}>
            <Basis basis={b} /> {BASIS[b].help}
          </span>
        ))}
      </p>

      {s.warnings.map((w) => (
        <AdminInfoBanner key={w} tone="warning">
          {w}
        </AdminInfoBanner>
      ))}

      {s.ytd ? (
        <AdminPanel title="This financial year" description={`From ${formatOpsDate(s.financialYearStart)} to ${formatOpsDate(s.today)}.`} actions={<Basis basis="actual" />}>
          <PnlStrip period={s.ytd} label="Financial year to date" />
        </AdminPanel>
      ) : null}

      {s.monthToDate ? (
        <AdminPanel title="This month so far" actions={<Basis basis="actual" />}>
          <PnlStrip period={s.monthToDate} label="Month to date" />
        </AdminPanel>
      ) : null}

      <div className="ops-fin-grid">
        <AdminPanel title="Cash in the bank" actions={<Basis basis="actual" />} compact>
          {s.cash && s.cash.accounts.length ? (
            <AdminDataList
              items={[
                ...s.cash.accounts.map((a) => ({ label: a.account, value: formatOpsMoney(a.closing) })),
                { label: "Total", value: <strong>{formatOpsMoney(s.cash.total)}</strong> },
              ]}
            />
          ) : (
            <p className="ops-table__meta">No bank accounts returned.</p>
          )}
        </AdminPanel>

        <AdminPanel title="Owed to Damtech (debtors)" actions={<Basis basis="actual" />} compact>
          <AdminDataList
            items={[
              { label: "Total outstanding", value: <strong>{formatOpsMoney(s.debtors.total)}</strong> },
              { label: "Not yet due", value: formatOpsMoney(s.debtors.ageing.current) },
              { label: "1–30 days overdue", value: formatOpsMoney(s.debtors.ageing["1-30"]) },
              { label: "31–60 days", value: formatOpsMoney(s.debtors.ageing["31-60"]) },
              { label: "Over 60 days", value: formatOpsMoney(s.debtors.ageing["61-90"] + s.debtors.ageing["90+"]) },
            ]}
          />
          {s.debtors.top.length ? (
            <p className="ops-table__meta">Largest: {s.debtors.top.map((t) => `${t.contact} ${formatOpsMoney(t.amount)}`).join(" · ")}</p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Owed by Damtech (creditors)" actions={<Basis basis="actual" />} compact>
          <AdminDataList
            items={[
              { label: "Total outstanding", value: <strong>{formatOpsMoney(s.creditors.total)}</strong> },
              { label: "Not yet due", value: formatOpsMoney(s.creditors.ageing.current) },
              { label: "Overdue", value: formatOpsMoney(s.creditors.total - s.creditors.ageing.current) },
            ]}
          />
          {s.creditors.top.length ? (
            <p className="ops-table__meta">Largest: {s.creditors.top.map((t) => `${t.contact} ${formatOpsMoney(t.amount)}`).join(" · ")}</p>
          ) : null}
        </AdminPanel>
      </div>

      <AdminPanel title="Last six complete months" actions={<Basis basis="actual" />}>
        {s.months.length ? (
          <AdminTable caption="Monthly results" className="ops-table">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Revenue</th>
                <th scope="col">Gross profit</th>
                <th scope="col">Margin</th>
                <th scope="col">Operating expenses</th>
                <th scope="col">Net profit</th>
              </tr>
            </thead>
            <tbody>
              {s.months.map((m) => (
                <tr key={m.label}>
                  <td data-label="Month">{m.label}</td>
                  <td data-label="Revenue">{formatOpsMoney(m.income)}</td>
                  <td data-label="Gross profit">{formatOpsMoney(m.grossProfit)}</td>
                  <td data-label="Margin">{pct(m.grossMargin)}</td>
                  <td data-label="Operating expenses">{formatOpsMoney(m.operatingExpenses)}</td>
                  <td data-label="Net profit">{formatOpsMoney(m.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : (
          <p className="ops-table__meta">Xero returned no monthly figures.</p>
        )}
      </AdminPanel>

      <AdminPanel
        title="Cash flow, next three months"
        description="Today's bank balance, plus open customer invoices, minus open supplier bills, each in the month it falls due. Overdue items count in this month. Future sales, wages and overheads not yet in Xero are not included."
        actions={<Basis basis="forecast" />}
      >
        <AdminTable caption="Cash flow forecast" className="ops-table">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Opening</th>
              <th scope="col">Expected in</th>
              <th scope="col">Due out</th>
              <th scope="col">Closing</th>
            </tr>
          </thead>
          <tbody>
            {s.forecast.map((f) => (
              <tr key={f.month}>
                <td data-label="Month">{monthLabel(f.month)}</td>
                <td data-label="Opening">{formatOpsMoney(f.opening)}</td>
                <td data-label="Expected in">{formatOpsMoney(f.receipts)}</td>
                <td data-label="Due out">{formatOpsMoney(f.payments)}</td>
                <td data-label="Closing">{formatOpsMoney(f.closing)}</td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        {s.averageMonthlyOpex !== null ? (
          <p className="ops-table__meta">
            <Basis basis="estimate" /> Average operating expenses over the last three complete months:{" "}
            <strong>{formatOpsMoney(s.averageMonthlyOpex)}</strong> a month. This is not deducted above, because some of it may
            already be in the bills.
          </p>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Profit per project" compact>
        <p className="ops-table__meta">
          Not shown yet. Real job profit needs each job&apos;s costs coded to it in Xero, for example with a tracking
          category per project. Until then any per-project figure would be a guess, so the page leaves it out.
        </p>
      </AdminPanel>
    </div>
  );
}
