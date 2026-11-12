import type { BalancePoint, FinancialSnapshot, PnlPeriod, QuoteRecord, SaleRecord } from "./financials.ts";

/**
 * Metrics for the Accounting dashboard, worked out from the stored Xero
 * snapshot (plus website enquiries). Pure functions, unit-tested.
 *
 * Every metric says what it is based on. Where Damtech's data cannot support a
 * metric the value is null and `note` says why; nothing is guessed. Health
 * colours use common rules of thumb (named in `rule`), not Damtech targets.
 */

export type Health = "good" | "warning" | "critical" | null;
export type MetricFormat = "rand" | "percent" | "days" | "ratio" | "count" | "months";
export type Basis = "actual" | "forecast" | "estimate";

/**
 * The owner's targets, set 11 Nov 2026. Change them here; the cards and
 * the margins chart follow.
 */
export const ACCOUNTING_TARGETS = {
  grossMarginPercent: { min: 45, max: 60 },
  grossProfitMonthly: { min: 225_000, max: 300_000 },
  netMarginPercent: { min: 20 },
} as const;

export type TargetStatus = "below" | "on" | "above";
export type Target = { label: string; status: TargetStatus | null; detail?: string };

/** Where a value sits against a target range (max optional). */
export function targetStatus(value: number | null, min: number, max?: number): TargetStatus | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value < min) return "below";
  if (max !== undefined && value > max) return "above";
  return "on";
}

export type Metric = {
  id: string;
  label: string;
  value: number | null;
  format: MetricFormat;
  /** Change against the named earlier period, in the same unit (percentage points for percents). */
  delta?: { value: number; vs: string; goodWhenUp: boolean } | null;
  /** Oldest first, for a sparkline. */
  trend?: (number | null)[];
  health?: Health;
  /** Owner's target for this figure, shown beside the label. */
  target?: Target;
  rule?: string;
  note: string;
  basis: Basis;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const VAT = 1.15;

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym} ${ym.slice(2, 4)}`;
const pct = (part: number, whole: number) => (whole !== 0 ? round1((part / whole) * 100) : null);

// ---------------------------------------------------------------------------
// Monthly series
// ---------------------------------------------------------------------------

export type MonthRow = {
  ym: string;
  label: string;
  income: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number | null;
  netMargin: number | null;
  ebitda: number;
  marketing: number;
};

const ebitdaOf = (p: PnlPeriod) => p.netProfit + (p.interest ?? 0) + (p.incomeTax ?? 0) + (p.depreciation ?? 0);

/** Complete months, oldest first (Xero gives them latest first, ending last month). */
export function monthRows(s: Pick<FinancialSnapshot, "months" | "today">): MonthRow[] {
  const current = s.today.slice(0, 7);
  return s.months
    .map((p, i) => {
      const ym = addMonths(current, -(i + 1));
      const income = p.income + p.otherIncome;
      return {
        ym,
        label: monthLabel(ym),
        income: round2(income),
        costOfSales: p.costOfSales,
        grossProfit: p.grossProfit,
        operatingExpenses: p.operatingExpenses,
        netProfit: p.netProfit,
        grossMargin: pct(p.grossProfit, p.income),
        netMargin: pct(p.netProfit, income),
        ebitda: round2(ebitdaOf(p)),
        marketing: p.marketing ?? 0,
      };
    })
    .reverse();
}

/**
 * Operating cash flow per month, indirect method:
 * net profit + depreciation − increase in non-cash current assets + increase in current liabilities.
 * Needs the balance sheet at both month-ends, so the oldest month has none.
 */
export function operatingCashFlow(rows: MonthRow[], monthEnds: BalancePoint[], months: PnlPeriod[]): (number | null)[] {
  // monthEnds and months are latest first and aligned (month-end i closes month i).
  const ends = [...monthEnds].reverse();
  const pnl = [...months].reverse();
  return rows.map((_, i) => {
    const end = ends[i];
    const start = ends[i - 1];
    const p = pnl[i];
    if (!end || !start || !p) return null;
    const workingAssets = (b: BalancePoint) => b.currentAssets - b.cash;
    return round2(p.netProfit + (p.depreciation ?? 0) - (workingAssets(end) - workingAssets(start)) + (end.currentLiabilities - start.currentLiabilities));
  });
}

/**
 * Axis range for the margins chart. Months beyond ±100% (costs more than
 * double the revenue, usually a month with almost no invoicing) are outliers:
 * they are left out of the range and shown as red dots at the edge. The range
 * always covers 0% and the targets, rounded out to 10%.
 */
export function marginDomain(values: (number | null)[], cover: number[] = []): { min: number; max: number; outliers: number } {
  const all = values.filter((v): v is number => v !== null && Number.isFinite(v));
  const normal = all.filter((v) => v >= -100 && v <= 100);
  const pool = [0, ...normal, ...cover];
  const outliers = all.length - normal.length;
  // Room below zero when there are outliers, so their red dots sit clearly under the 0% line.
  const lowest = Math.min(...pool, outliers > 0 ? -1 : 0);
  return {
    // Headroom above the top value so a target is not drawn on the edge.
    min: lowest < 0 ? Math.floor((lowest - 0.01) / 10) * 10 : 0,
    max: Math.ceil((Math.max(...pool) + 0.01) / 10) * 10,
    outliers,
  };
}

// ---------------------------------------------------------------------------
// Forecasts
// ---------------------------------------------------------------------------

export type ForecastPoint = { ym: string; label: string; value: number; low: number; high: number };

/**
 * ESTIMATE: straight-line trend through the monthly values, projected
 * `ahead` months, with a band of ± one standard deviation of the misses.
 * Needs at least 4 months. Never below zero.
 */
export function linearForecast(values: { ym: string; value: number }[], ahead = 3): ForecastPoint[] {
  const n = values.length;
  if (n < 4) return [];
  const xs = values.map((_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v.value, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const sxy = xs.reduce((s, x, i) => s + (x - meanX) * (values[i].value - meanY), 0);
  const slope = sxx ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  const sd = Math.sqrt(values.reduce((s, v, i) => s + (v.value - (intercept + slope * i)) ** 2, 0) / Math.max(1, n - 2));
  const last = values[n - 1].ym;
  return Array.from({ length: ahead }, (_, k) => {
    const x = n + k;
    const value = Math.max(0, intercept + slope * x);
    const ym = addMonths(last, k + 1);
    return { ym, label: monthLabel(ym), value: round2(value), low: round2(Math.max(0, value - sd)), high: round2(value + sd) };
  });
}

// ---------------------------------------------------------------------------
// Sales: enquiries, Xero quotes, customers
// ---------------------------------------------------------------------------

const WON = new Set(["ACCEPTED", "INVOICED"]);

export type PipelineSummary = {
  months: { ym: string; label: string; enquiries: number; quotesSent: number; won: number; wonValue: number }[];
  enquiries: number;
  quotesSent: number;
  won: number;
  declinedOrExpired: number;
  winRate: number | null;
  leadConversion: number | null;
  openValue: number;
  weightedPipeline: number | null;
  wonPerMonth: number;
  averageWonValue: number | null;
};

/** Website enquiries (dates) and Xero quotes over the last `months` complete-or-current months. */
export function pipelineSummary(enquiryDates: string[], quotes: QuoteRecord[], today: string, months = 6): PipelineSummary {
  const current = today.slice(0, 7);
  const window = Array.from({ length: months }, (_, i) => addMonths(current, -(months - 1 - i)));
  const first = window[0];
  const inWindow = (d: string | null) => Boolean(d) && (d as string).slice(0, 7) >= first;
  const rows = window.map((ym) => ({ ym, label: monthLabel(ym), enquiries: 0, quotesSent: 0, won: 0, wonValue: 0 }));
  const byYm = new Map(rows.map((r) => [r.ym, r]));
  for (const d of enquiryDates) {
    const row = byYm.get(d.slice(0, 7));
    if (row) row.enquiries += 1;
  }
  let declinedOrExpired = 0;
  let openValue = 0;
  for (const q of quotes) {
    if (!q.date || q.status === "DRAFT" || q.status === "DELETED") continue;
    const expired = q.status === "SENT" && Boolean(q.expiry) && (q.expiry as string) < today;
    if (q.status === "SENT" && !expired) openValue += q.total;
    if (!inWindow(q.date)) continue;
    const row = byYm.get(q.date.slice(0, 7));
    if (!row) continue;
    row.quotesSent += 1;
    if (WON.has(q.status)) {
      row.won += 1;
      row.wonValue += q.total;
    } else if (q.status === "DECLINED" || expired) declinedOrExpired += 1;
  }
  const enquiries = rows.reduce((s, r) => s + r.enquiries, 0);
  const quotesSent = rows.reduce((s, r) => s + r.quotesSent, 0);
  const won = rows.reduce((s, r) => s + r.won, 0);
  const wonValue = rows.reduce((s, r) => s + r.wonValue, 0);
  const decided = won + declinedOrExpired;
  const winRate = decided ? round1((won / decided) * 100) : null;
  return {
    months: rows.map((r) => ({ ...r, wonValue: round2(r.wonValue) })),
    enquiries,
    quotesSent,
    won,
    declinedOrExpired,
    winRate,
    leadConversion: enquiries ? round1((won / enquiries) * 100) : null,
    openValue: round2(openValue),
    weightedPipeline: winRate === null ? null : round2((openValue * winRate) / 100),
    wonPerMonth: round2(wonValue / months),
    averageWonValue: won ? round2(wonValue / won) : null,
  };
}

export type CustomerSummary = {
  months: { ym: string; label: string; newCustomers: number; returning: number }[];
  activeLast12: number;
  newLast12: number;
  /** Of customers who bought in the 12 months before, the share who bought again in the last 12. */
  retention: number | null;
  /** Average sales per customer over the 24 months on record, excl. VAT. */
  revenuePerCustomer: number | null;
};

/** New vs returning customers per month (last 12), from 24 months of sales invoices. */
export function customerSummary(sales: SaleRecord[], today: string): CustomerSummary {
  const current = today.slice(0, 7);
  const start12 = addMonths(current, -11);
  const start24 = addMonths(current, -23);
  const firstSeen = new Map<string, string>();
  const revenue = new Map<string, number>();
  for (const s of [...sales].sort((a, b) => a.date.localeCompare(b.date))) {
    const key = s.contact.trim().toLowerCase();
    if (!firstSeen.has(key)) firstSeen.set(key, s.date.slice(0, 7));
    revenue.set(key, (revenue.get(key) ?? 0) + s.amount);
  }
  const months = Array.from({ length: 12 }, (_, i) => addMonths(start12, i)).map((ym) => {
    const buyers = new Set(sales.filter((s) => s.date.startsWith(ym)).map((s) => s.contact.trim().toLowerCase()));
    let newCustomers = 0;
    for (const b of buyers) if (firstSeen.get(b) === ym) newCustomers += 1;
    return { ym, label: monthLabel(ym), newCustomers, returning: buyers.size - newCustomers };
  });
  const activeIn = (from: string, to: string) =>
    new Set(sales.filter((s) => s.date.slice(0, 7) >= from && s.date.slice(0, 7) <= to).map((s) => s.contact.trim().toLowerCase()));
  const last12 = activeIn(start12, current);
  const prior12 = activeIn(start24, addMonths(start12, -1));
  const kept = [...prior12].filter((c) => last12.has(c)).length;
  const total = [...revenue.values()].reduce((s, v) => s + v, 0);
  return {
    months,
    activeLast12: last12.size,
    newLast12: [...last12].filter((c) => (firstSeen.get(c) ?? "") >= start12).length,
    retention: prior12.size ? round1((kept / prior12.size) * 100) : null,
    revenuePerCustomer: revenue.size ? round2(total / revenue.size) : null,
  };
}

// ---------------------------------------------------------------------------
// Health rules of thumb
// ---------------------------------------------------------------------------

export function healthAbove(value: number | null, good: number, warning: number): Health {
  if (value === null) return null;
  return value >= good ? "good" : value >= warning ? "warning" : "critical";
}
export function healthBelow(value: number | null, good: number, warning: number): Health {
  if (value === null) return null;
  return value <= good ? "good" : value <= warning ? "warning" : "critical";
}

// ---------------------------------------------------------------------------
// The dashboard
// ---------------------------------------------------------------------------

export type AccountingDashboard = {
  rows: MonthRow[];
  ocf: (number | null)[];
  revenueForecast: ForecastPoint[];
  cashHistory: { ym: string; label: string; value: number }[];
  monthly: Metric[];
  yearEnd: Metric[];
  pipeline: PipelineSummary;
  customers: CustomerSummary;
  notes: string[];
};

const sumBy = (rows: MonthRow[], key: keyof Pick<MonthRow, "income" | "netProfit" | "costOfSales" | "marketing" | "ebitda">) =>
  rows.reduce((s, r) => s + r[key], 0);

export function buildAccountingDashboard(
  s: FinancialSnapshot,
  enquiryDates: string[],
  options: { crewTracked: boolean } = { crewTracked: false },
): AccountingDashboard {
  const rows = monthRows(s);
  const monthEnds = s.balanceMonthEnds ?? [];
  const ocf = operatingCashFlow(rows, monthEnds, s.months);
  const last = rows.at(-1) ?? null;
  const prev = rows.at(-2) ?? null;
  const last3 = rows.slice(-3);
  const last12 = rows.slice(-12);
  const balance = s.balanceToday ?? monthEnds[0] ?? null;
  const notes: string[] = [];
  if (!monthEnds.length) notes.push("Refresh from Xero to load the balance sheet: cash flow and the year-end ratios need it.");

  const cashHistory = [...monthEnds]
    .reverse()
    .map((b, i) => ({ ym: rows[i]?.ym ?? "", label: rows[i]?.label ?? b.label, value: b.cash }))
    .filter((p) => p.ym);

  // Debtor / creditor days over the last three complete months (balances incl. VAT, sales excl.).
  const revenue3 = sumBy(last3, "income");
  const cos3 = sumBy(last3, "costOfSales");
  const days3 = last3.length * 30.4;
  const arDays = revenue3 > 0 ? round1((s.debtors.total / VAT / revenue3) * days3) : null;
  const apDays = cos3 > 0 ? round1((s.creditors.total / VAT / cos3) * days3) : null;

  const lastOcf = ocf.at(-1) ?? null;
  const ocfTrend = ocf.slice(-12);

  const pipeline = pipelineSummary(enquiryDates, s.quotes ?? [], s.today);
  const customers = customerSummary(s.sales ?? [], s.today);
  const marketing12 = sumBy(last12, "marketing");
  const cac = customers.newLast12 > 0 && marketing12 > 0 ? round2(marketing12 / customers.newLast12) : null;
  const ytdGrossMargin = s.ytd?.grossMargin ?? null;
  const ltv = customers.revenuePerCustomer !== null && ytdGrossMargin !== null ? round2((customers.revenuePerCustomer * ytdGrossMargin) / 100) : null;

  const monthly: Metric[] = [
    {
      id: "cash",
      label: "Cash in the bank",
      value: s.cash?.total ?? null,
      format: "rand",
      trend: [...cashHistory.map((c) => c.value), ...(s.cash ? [s.cash.total] : [])],
      delta: cashHistory.length ? { value: round2((s.cash?.total ?? 0) - cashHistory[cashHistory.length - 1].value), vs: `end ${cashHistory.at(-1)?.label}`, goodWhenUp: true } : null,
      note: "All bank accounts today.",
      basis: "actual",
    },
    {
      id: "ocf",
      label: "Operating cash flow",
      value: lastOcf,
      format: "rand",
      trend: ocfTrend,
      health: lastOcf === null ? null : lastOcf >= 0 ? "good" : "critical",
      note: last ? `${last.label}: profit plus depreciation, less cash tied up in debtors and stock, plus bills not yet paid.` : "Needs monthly results.",
      basis: "actual",
    },
    {
      id: "revenue",
      label: "Revenue",
      value: last?.income ?? null,
      format: "rand",
      trend: rows.map((r) => r.income),
      delta: last && prev ? { value: round2(last.income - prev.income), vs: prev.label, goodWhenUp: true } : null,
      note: last ? `${last.label}, excl. VAT.` : "No monthly results yet.",
      basis: "actual",
    },
    {
      id: "gross-margin",
      label: "Gross profit margin",
      value: last?.grossMargin ?? null,
      format: "percent",
      trend: rows.map((r) => r.grossMargin),
      delta: last?.grossMargin != null && prev?.grossMargin != null ? { value: round1(last.grossMargin - prev.grossMargin), vs: prev.label, goodWhenUp: true } : null,
      target: {
        label: `Target ${ACCOUNTING_TARGETS.grossMarginPercent.min}–${ACCOUNTING_TARGETS.grossMarginPercent.max}%`,
        status: targetStatus(last?.grossMargin ?? null, ACCOUNTING_TARGETS.grossMarginPercent.min, ACCOUNTING_TARGETS.grossMarginPercent.max),
        detail: last
          ? `Gross profit ${fmtRand(last.grossProfit)} · target ${fmtRand(ACCOUNTING_TARGETS.grossProfitMonthly.min)}–${fmtRand(ACCOUNTING_TARGETS.grossProfitMonthly.max)} (${
              { below: "below", on: "on target", above: "above" }[targetStatus(last.grossProfit, ACCOUNTING_TARGETS.grossProfitMonthly.min, ACCOUNTING_TARGETS.grossProfitMonthly.max) ?? "below"]
            })`
          : undefined,
      },
      note: last ? `${last.label}: revenue left after materials and subcontractors.` : "",
      basis: "actual",
    },
    {
      id: "net-margin",
      label: "Net profit margin",
      value: last?.netMargin ?? null,
      format: "percent",
      trend: rows.map((r) => r.netMargin),
      delta: last?.netMargin != null && prev?.netMargin != null ? { value: round1(last.netMargin - prev.netMargin), vs: prev.label, goodWhenUp: true } : null,
      health: last?.netMargin == null ? null : last.netMargin < 0 ? "critical" : null,
      target: {
        label: `Target ${ACCOUNTING_TARGETS.netMarginPercent.min}%+`,
        status: targetStatus(last?.netMargin ?? null, ACCOUNTING_TARGETS.netMarginPercent.min),
        detail: last ? `Net profit ${fmtRand(last.netProfit)}; 20% of ${fmtRand(last.income)} revenue is ${fmtRand((last.income * ACCOUNTING_TARGETS.netMarginPercent.min) / 100)}.` : undefined,
      },
      note: last ? `${last.label}: bottom line after all expenses in Xero.` : "",
      basis: "actual",
    },
    {
      id: "ar-days",
      label: "Debtor days",
      value: arDays,
      format: "days",
      health: healthBelow(arDays, 30, 45),
      rule: "Under 30 days is healthy",
      note: "How long customers take to pay: money owed ÷ last 3 months' sales.",
      basis: "actual",
    },
    {
      id: "ap-days",
      label: "Creditor days",
      value: apDays,
      format: "days",
      note: apDays === null ? "Needs cost of sales in the last 3 months." : "How long Damtech takes to pay suppliers: bills owed ÷ last 3 months' cost of sales.",
      basis: "actual",
    },
    {
      id: "lead-conversion",
      label: "Lead conversion",
      value: pipeline.leadConversion,
      format: "percent",
      note: `${pipeline.won} quotes won from ${pipeline.enquiries} website enquiries in 6 months. Quotes for leads from WhatsApp or phone count too, so this can run high.`,
      basis: "actual",
    },
    {
      id: "win-rate",
      label: "Quote win rate",
      value: pipeline.winRate,
      format: "percent",
      note: `Won ÷ decided (won, declined or expired) Xero quotes, last 6 months.`,
      basis: "actual",
    },
    {
      id: "pipeline",
      label: "Pipeline velocity",
      value: pipeline.wonPerMonth,
      format: "rand",
      trend: pipeline.months.map((m) => m.wonValue),
      note: `Quotes won per month (6-month average, incl. VAT). Open quotes ${fmtRand(pipeline.openValue)}${pipeline.weightedPipeline !== null ? `, worth about ${fmtRand(pipeline.weightedPipeline)} at the win rate` : ""}. Xero has no accept date, so the sales cycle length is not measured.`,
      basis: "actual",
    },
    {
      id: "cac",
      label: "Cost to win a customer",
      value: cac,
      format: "rand",
      note:
        cac === null
          ? "Needs advertising spend in Xero and new customers in the last 12 months."
          : `Advertising in the last 12 months ÷ ${customers.newLast12} new customers. Only spend coded to advertising or marketing in Xero.`,
      basis: "actual",
    },
    {
      id: "ltv",
      label: "Customer lifetime value",
      value: ltv,
      format: "rand",
      note: "Average sales per customer over 24 months × gross margin this year. Grows as history builds up.",
      basis: "estimate",
    },
    {
      id: "retention",
      label: "Customer retention",
      value: customers.retention,
      format: "percent",
      note: "Of customers invoiced in the 12 months before, the share invoiced again in the last 12. Project work is often once-off, so low is normal.",
      basis: "actual",
    },
    {
      id: "utilisation",
      label: "Crew utilisation",
      value: null,
      format: "percent",
      note: options.crewTracked
        ? "Not calculated yet."
        : "Not tracked yet: add the crew to the operations calendar and book them on jobs, then booked days ÷ working days shows here.",
      basis: "actual",
    },
  ];

  // Year-end and structural health.
  const equity = balance?.equity ?? null;
  const negativeEquity = equity !== null && equity <= 0;
  const currentRatio = balance && balance.currentLiabilities > 0 ? round2(balance.currentAssets / balance.currentLiabilities) : null;
  const quickRatio = balance && balance.currentLiabilities > 0 ? round2((balance.currentAssets - balance.inventory) / balance.currentLiabilities) : null;
  const debtToEquity = balance && !negativeEquity && equity ? round2(balance.totalLiabilities / equity) : null;
  const ytd = s.ytd;
  const interestYtd = ytd?.interest ?? 0;
  const ebitYtd = ytd ? ytd.netProfit + interestYtd + (ytd.incomeTax ?? 0) : null;
  const interestCover = ebitYtd !== null && interestYtd > 0 ? round1(ebitYtd / interestYtd) : null;
  const net12 = last12.length === 12 ? sumBy(last12, "netProfit") : null;
  const roa = net12 !== null && balance && balance.totalAssets > 0 ? round1((net12 / balance.totalAssets) * 100) : null;
  const roe = net12 !== null && !negativeEquity && equity ? round1((net12 / equity) * 100) : null;
  const yoy = ytd && s.priorYearToDate && s.priorYearToDate.income > 0 ? round1(((ytd.income - s.priorYearToDate.income) / s.priorYearToDate.income) * 100) : null;
  const ebitdaYtd = ytd ? round2(ebitdaOf(ytd)) : null;
  const workingCapital = balance ? round2(balance.currentAssets - balance.currentLiabilities) : null;
  const wcTrend = [...monthEnds].reverse().map((b) => round2(b.currentAssets - b.currentLiabilities));
  const asAt = s.balanceToday ? "today" : monthEnds[0] ? monthEnds[0].label : "";

  const yearEnd: Metric[] = [
    {
      id: "yoy",
      label: "Revenue growth (year on year)",
      value: yoy,
      format: "percent",
      health: yoy === null ? null : yoy >= 0 ? "good" : "critical",
      note:
        yoy === null
          ? "Needs last year's figures from Xero (refresh)."
          : `This financial year to date ${fmtRand(ytd?.income ?? 0)} vs ${fmtRand(s.priorYearToDate?.income ?? 0)} by the same date last year.`,
      basis: "actual",
    },
    {
      id: "ebitda",
      label: "EBITDA, year to date",
      value: ebitdaYtd,
      format: "rand",
      trend: rows.map((r) => r.ebitda),
      delta: ebitdaYtd !== null && s.priorYearToDate ? { value: round2(ebitdaYtd - ebitdaOf(s.priorYearToDate)), vs: "same date last year", goodWhenUp: true } : null,
      note: `Profit before interest, tax, depreciation and amortisation.${s.priorYear ? ` Last full year: ${fmtRand(round2(ebitdaOf(s.priorYear)))}.` : ""}`,
      basis: "actual",
    },
    {
      id: "working-capital",
      label: "Working capital",
      value: workingCapital,
      format: "rand",
      trend: wcTrend,
      health: workingCapital === null ? null : workingCapital > 0 ? "good" : "critical",
      note: `Current assets less current liabilities, ${asAt}. The buffer for next year's growth.`,
      basis: "actual",
    },
    {
      id: "current-ratio",
      label: "Current ratio",
      value: currentRatio,
      format: "ratio",
      health: healthAbove(currentRatio, 1.5, 1),
      rule: "1.5 or more is comfortable; under 1 is tight",
      note: "Current assets ÷ current liabilities.",
      basis: "actual",
    },
    {
      id: "quick-ratio",
      label: "Quick ratio",
      value: quickRatio,
      format: "ratio",
      health: healthAbove(quickRatio, 1, 0.7),
      rule: "1 or more is healthy",
      note: "As the current ratio, without stock.",
      basis: "actual",
    },
    {
      id: "debt-to-equity",
      label: "Debt-to-equity",
      value: debtToEquity,
      format: "ratio",
      health: negativeEquity ? "critical" : healthBelow(debtToEquity, 1, 2),
      rule: "Under 1 is conservative; over 2 is highly geared",
      note: negativeEquity
        ? `Not meaningful: equity is negative (${fmtRand(equity ?? 0)}), so liabilities of ${fmtRand(balance?.totalLiabilities ?? 0)} exceed assets. Often a shareholder or director loan; confirm with your accountant.`
        : "Total liabilities ÷ owners' equity.",
      basis: "actual",
    },
    {
      id: "interest-cover",
      label: "Interest cover",
      value: interestCover,
      format: "ratio",
      health: healthAbove(interestCover, 3, 1.5),
      rule: "3 or more is safe",
      note: interestCover === null ? "No interest expense this year." : "Operating profit (EBIT) ÷ interest, this financial year.",
      basis: "actual",
    },
    {
      id: "roa",
      label: "Return on assets",
      value: roa,
      format: "percent",
      note: roa === null ? "Needs 12 months of results and the balance sheet." : "Net profit over the last 12 months ÷ total assets.",
      basis: "actual",
    },
    {
      id: "roe",
      label: "Return on equity",
      value: roe,
      format: "percent",
      note: negativeEquity ? "Not meaningful while equity is negative." : roe === null ? "Needs 12 months of results and the balance sheet." : "Net profit over the last 12 months ÷ owners' equity.",
      basis: "actual",
    },
    {
      id: "roi",
      label: "Return on investment (projects, capex)",
      value: null,
      format: "percent",
      note: "Not tracked yet: needs each project's or campaign's costs coded to it in Xero (a tracking category per project).",
      basis: "actual",
    },
  ];

  const revenueForecast = linearForecast(rows.slice(-12).map((r) => ({ ym: r.ym, value: r.income })));
  return { rows, ocf, revenueForecast, cashHistory, monthly, yearEnd, pipeline, customers, notes };
}

export function fmtRand(v: number): string {
  const sign = v < 0 ? "−" : "";
  return `${sign}R${Math.round(Math.abs(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}`;
}
