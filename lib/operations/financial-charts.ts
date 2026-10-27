import type { FinancialSnapshot } from "./financials.ts";

/**
 * Chart data for the Financials page, built from the stored Xero snapshot so
 * the graphs refresh whenever Xero is refreshed. Pure functions; the SVG is
 * drawn in components/admin/operations/FinancialCharts.tsx.
 */

export type MonthBar = { key: string; label: string; income: number; costs: number; net: number; partial: boolean };
export type ValueBar = { key: string; label: string; value: number; basis: "actual" | "forecast" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym} ${ym.slice(2, 4)}`;

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Last complete months (oldest first) plus this month so far. Months come from Xero latest first. */
export function incomeAndCosts(s: Pick<FinancialSnapshot, "months" | "monthToDate" | "today">): MonthBar[] {
  const current = s.today.slice(0, 7);
  const bars: MonthBar[] = s.months
    .slice(0, 6)
    .map((p, i) => {
      const ym = addMonths(current, -(i + 1));
      return { key: ym, label: monthLabel(ym), income: p.income + p.otherIncome, costs: p.costOfSales + p.operatingExpenses, net: p.netProfit, partial: false };
    })
    .reverse();
  if (s.monthToDate) {
    const p = s.monthToDate;
    bars.push({ key: current, label: `${monthLabel(current)} so far`, income: p.income + p.otherIncome, costs: p.costOfSales + p.operatingExpenses, net: p.netProfit, partial: true });
  }
  return bars;
}

/** Bank balance today, then the forecast closing balance for each month. */
export function cashOutlook(s: Pick<FinancialSnapshot, "cash" | "forecast">): ValueBar[] {
  if (!s.cash) return [];
  return [
    { key: "today", label: "Today", value: s.cash.total, basis: "actual" as const },
    ...s.forecast.map((f) => ({ key: f.month, label: `End ${monthLabel(f.month)}`, value: f.closing, basis: "forecast" as const })),
  ];
}

/** What customers owe, by how late it is. */
export function debtorsByAge(s: Pick<FinancialSnapshot, "debtors">): ValueBar[] {
  const a = s.debtors.ageing;
  return [
    { key: "current", label: "Not yet due", value: a.current, basis: "actual" },
    { key: "1-30", label: "1–30 days late", value: a["1-30"], basis: "actual" },
    { key: "31-60", label: "31–60 days late", value: a["31-60"], basis: "actual" },
    { key: "61-90", label: "61–90 days late", value: a["61-90"], basis: "actual" },
    { key: "90+", label: "Over 90 days late", value: a["90+"], basis: "actual" },
  ];
}

/** A round axis maximum and evenly spaced ticks (0 included) covering [min, max]. */
export function axisTicks(min: number, max: number, count = 4): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  if (hi === lo) return [0];
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= hi + step * 0.999; t += step) ticks.push(Math.round(t * 100) / 100);
  return ticks;
}

/** Short rand label for axes: R 1.2m, R 250k, R 900. */
export function shortRand(v: number): string {
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${sign}R${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  if (a >= 1_000) return `${sign}R${Math.round(a / 1_000)}k`;
  return `${sign}R${Math.round(a)}`;
}
