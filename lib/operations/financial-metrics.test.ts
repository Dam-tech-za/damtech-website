import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBalanceSheet, parseProfitAndLoss, type BalancePoint, type FinancialSnapshot, type FlatReport, type PnlPeriod } from "./financials.ts";
import {
  buildAccountingDashboard,
  customerSummary,
  healthAbove,
  healthBelow,
  linearForecast,
  targetStatus,
  monthRows,
  operatingCashFlow,
  pipelineSummary,
} from "./financial-metrics.ts";

const report = (columns: string[], rows: [string | null, string, string[], boolean?][]): FlatReport => ({
  columns,
  lines: rows.map(([section, label, vals, total]) => ({
    section,
    label,
    values: Object.fromEntries(columns.map((c, i) => [c, vals[i]])),
    is_total: total ?? false,
  })),
});

const pnl = (income: number, extra: Partial<PnlPeriod> = {}): PnlPeriod => ({
  label: "",
  income,
  costOfSales: income * 0.45,
  grossProfit: income * 0.55,
  grossMargin: 55,
  operatingExpenses: income * 0.25,
  otherIncome: 0,
  netProfit: income * 0.3,
  interest: 0,
  depreciation: 0,
  incomeTax: 0,
  marketing: 0,
  ...extra,
});

const point = (p: Partial<BalancePoint>): BalancePoint => ({
  label: "",
  cash: 0,
  currentAssets: 0,
  inventory: 0,
  totalAssets: 0,
  currentLiabilities: 0,
  totalLiabilities: 0,
  equity: 0,
  ...p,
});

describe("Xero reports for the Accounting dashboard", () => {
  it("reads interest, depreciation, tax and advertising accounts from the profit and loss", () => {
    const [p] = parseProfitAndLoss(
      report(
        ["YTD"],
        [
          ["Income", "Sales", ["1992234.78"]],
          ["Income", "Interest Income", ["100"]],
          ["Income", "Total Income", ["1992334.78"], true],
          ["Less Cost of Sales", "Total Cost of Sales", ["885054.08"], true],
          ["Less Operating Expenses", "Interest Expense", ["6035.54"]],
          ["Less Operating Expenses", "Depreciation", ["1200"]],
          ["Less Operating Expenses", "Income Tax Expense", ["0.00"]],
          ["Less Operating Expenses", "Advertising", ["1971.19"]],
          ["Less Operating Expenses", "Total Operating Expenses", ["532337.28"], true],
          [null, "Net Profit", ["574943.42"]],
        ],
      ),
    );
    assert.equal(p.interest, 6035.54);
    assert.equal(p.depreciation, 1200);
    assert.equal(p.incomeTax, 0);
    assert.equal(p.marketing, 1971.19);
  });

  it("reads Xero's balance sheet: current assets include the bank section", () => {
    const [today, before] = parseBalanceSheet(
      report(
        ["11 Nov 2026", "31 Oct 2026"],
        [
          ["Bank", "FNB Business", ["206919.10", "150000"]],
          ["Bank", "Total Bank", ["206919.10", "150000"], true],
          ["Current Assets", "Accounts Receivable", ["361532.16", "300000"]],
          ["Current Assets", "Inventory", ["0", "0"]],
          ["Current Assets", "Total Current Assets", ["361532.16", "300000"], true],
          [null, "Total Assets", ["568451.26", "450000"], true],
          ["Current Liabilities", "Total Current Liabilities", ["4815.76", "10000"], true],
          ["Non-current Liabilities", "Total Non-current Liabilities", ["2174535.09", "2174535.09"], true],
          [null, "Total Liabilities", ["2179350.85", "2184535.09"], true],
          [null, "Net Assets", ["-1610899.59", "-1734535.09"], true],
          ["Equity", "Total Equity", ["-1610899.59", "-1734535.09"], true],
        ],
      ),
    );
    assert.equal(today.cash, 206919.1);
    assert.equal(today.currentAssets, 568451.26);
    assert.equal(today.equity, -1610899.59);
    assert.equal(before.currentLiabilities, 10000);
  });
});

describe("Accounting metrics", () => {
  it("lists complete months oldest first with margins and EBITDA", () => {
    const rows = monthRows({ today: "2026-11-11", months: [pnl(200_000, { interest: 1000, depreciation: 500 }), pnl(100_000)] });
    assert.deepEqual(rows.map((r) => r.ym), ["2026-09", "2026-10"]);
    assert.equal(rows[1].grossMargin, 55);
    assert.equal(rows[1].netMargin, 30);
    assert.equal(rows[1].ebitda, 61_500);
  });

  it("works out operating cash flow from profit and working-capital changes", () => {
    const months = [pnl(100_000), pnl(100_000)]; // latest first
    const rows = monthRows({ today: "2026-11-11", months });
    // Month-ends latest first: debtors grew by 20k and unpaid bills by 5k in October.
    const ends = [point({ cash: 50_000, currentAssets: 130_000, currentLiabilities: 15_000 }), point({ cash: 40_000, currentAssets: 100_000, currentLiabilities: 10_000 })];
    // 30 000 profit − 20 000 more debtors + 5 000 more unpaid bills.
    assert.deepEqual(operatingCashFlow(rows, ends, months), [null, 15_000]);
  });

  it("projects a straight-line trend with a band, never below zero", () => {
    const rising = [100, 200, 300, 400, 500].map((value, i) => ({ ym: `2026-0${i + 1}`, value }));
    const f = linearForecast(rising, 2);
    assert.deepEqual(f.map((p) => [p.ym, p.value]), [["2026-06", 600], ["2026-07", 700]]);
    assert.equal(f[0].low, 600);
    assert.equal(linearForecast(rising.slice(0, 3)).length, 0);
    const falling = [500, 300, 100, 50].map((value, i) => ({ ym: `2026-0${i + 1}`, value }));
    assert.ok(linearForecast(falling, 3).every((p) => p.value >= 0 && p.low >= 0));
  });

  it("summarises enquiries and Xero quotes into conversion, win rate and pipeline", () => {
    const today = "2026-11-11";
    const p = pipelineSummary(
      ["2026-10-02", "2026-10-05", "2026-11-01", "2026-03-01"],
      [
        { status: "ACCEPTED", date: "2026-10-03", expiry: "2026-11-03", total: 100_000, contact: "A" },
        { status: "INVOICED", date: "2026-09-01", expiry: null, total: 50_000, contact: "B" },
        { status: "DECLINED", date: "2026-10-10", expiry: null, total: 20_000, contact: "C" },
        { status: "SENT", date: "2026-08-01", expiry: "2026-09-01", total: 30_000, contact: "D" }, // expired
        { status: "SENT", date: "2026-11-01", expiry: "2026-12-01", total: 80_000, contact: "E" }, // open
        { status: "DRAFT", date: "2026-11-02", expiry: null, total: 1, contact: "F" },
      ],
      today,
    );
    assert.equal(p.enquiries, 3); // the March enquiry is outside 6 months
    assert.equal(p.quotesSent, 5);
    assert.equal(p.won, 2);
    assert.equal(p.declinedOrExpired, 2);
    assert.equal(p.winRate, 50);
    assert.equal(p.leadConversion, 66.7);
    assert.equal(p.openValue, 80_000);
    assert.equal(p.weightedPipeline, 40_000);
    assert.equal(p.wonPerMonth, 25_000);
  });

  it("counts new vs returning customers, retention and revenue per customer", () => {
    const c = customerSummary(
      [
        { contact: "Old Farm", date: "2025-03-10", amount: 10_000 },
        { contact: "Old Farm", date: "2026-10-10", amount: 20_000 },
        { contact: "Gone Ltd", date: "2025-05-01", amount: 5_000 },
        { contact: "New Co", date: "2026-10-20", amount: 30_000 },
        { contact: "new co ", date: "2026-11-01", amount: 5_000 },
      ],
      "2026-11-11",
    );
    const oct = c.months.find((m) => m.ym === "2026-10");
    assert.deepEqual([oct?.newCustomers, oct?.returning], [1, 1]);
    const nov = c.months.find((m) => m.ym === "2026-11");
    assert.deepEqual([nov?.newCustomers, nov?.returning], [0, 1]);
    assert.equal(c.activeLast12, 2);
    assert.equal(c.newLast12, 1);
    assert.equal(c.retention, 50); // Old Farm came back, Gone Ltd did not
    assert.equal(c.revenuePerCustomer, 23_333.33);
  });

  it("rates health by rule of thumb", () => {
    assert.equal(healthAbove(1.6, 1.5, 1), "good");
    assert.equal(healthAbove(1.2, 1.5, 1), "warning");
    assert.equal(healthAbove(0.8, 1.5, 1), "critical");
    assert.equal(healthBelow(28, 30, 45), "good");
    assert.equal(healthBelow(60, 30, 45), "critical");
    assert.equal(healthAbove(null, 1, 0), null);
  });

  it("builds the dashboard and refuses equity ratios when equity is negative", () => {
    const months = Array.from({ length: 12 }, (_, i) => pnl(100_000 + i * 1000, { interest: 500, marketing: 1000 }));
    const s: FinancialSnapshot = {
      fetchedAt: "2026-11-11T10:00:00Z",
      financialYearStart: "2026-03-01",
      today: "2026-11-11",
      ytd: pnl(900_000, { interest: 6000 }),
      monthToDate: pnl(20_000),
      months,
      cash: { accounts: [{ account: "FNB", closing: 206_919.1 }], total: 206_919.1 },
      debtors: { total: 115_000, ageing: { current: 115_000, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }, top: [] },
      creditors: { total: 11_500, ageing: { current: 11_500, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }, top: [] },
      forecast: [],
      averageMonthlyOpex: 25_000,
      balanceToday: point({ cash: 206_919.1, currentAssets: 568_451.26, totalAssets: 568_451.26, currentLiabilities: 4815.76, totalLiabilities: 2_179_350.85, equity: -1_610_899.59 }),
      balanceMonthEnds: Array.from({ length: 12 }, () => point({ cash: 100_000, currentAssets: 200_000, currentLiabilities: 10_000, totalAssets: 200_000 })),
      priorYear: pnl(1_000_000),
      priorYearToDate: pnl(600_000),
      sales: [{ contact: "A", date: "2026-10-01", amount: 100_000 }],
      quotes: [],
      warnings: [],
    };
    const d = buildAccountingDashboard(s, []);
    const m = (id: string) => [...d.monthly, ...d.yearEnd].find((x) => x.id === id);
    assert.equal(m("current-ratio")?.value, 118.04);
    assert.equal(m("current-ratio")?.health, "good");
    assert.equal(m("debt-to-equity")?.value, null);
    assert.equal(m("debt-to-equity")?.health, "critical");
    assert.match(m("debt-to-equity")?.note ?? "", /equity is negative/);
    assert.equal(m("roe")?.value, null);
    assert.equal(m("yoy")?.value, 50);
    // Debtor days: 115 000 / 1.15 = 100 000 owed vs the last three months' sales.
    assert.equal(m("ar-days")?.value, round1((100_000 / (100_000 + 101_000 + 102_000)) * 91.2));
    assert.equal(m("utilisation")?.value, null);
    assert.equal(m("roi")?.value, null);
    assert.equal(m("cac")?.value, 12_000); // 12 × 1 000 advertising ÷ 1 new customer
    assert.equal(d.revenueForecast.length, 3);
    assert.equal(d.cashHistory.length, 12);
    assert.equal(m("interest-cover")?.value, round1((270_000 + 6000) / 6000));
  });
});

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

describe("Owner targets", () => {
  it("places a value against a target range", () => {
    assert.equal(targetStatus(52, 45, 60), "on");
    assert.equal(targetStatus(40, 45, 60), "below");
    assert.equal(targetStatus(65, 45, 60), "above");
    assert.equal(targetStatus(25, 20), "on");
    assert.equal(targetStatus(null, 20), null);
  });

  it("shows the gross and net margin targets on the monthly cards", () => {
    // Last month: R400 000 revenue, 55% gross margin (R220 000 GP), 30% net.
    const s = {
      fetchedAt: "", financialYearStart: "2026-03-01", today: "2026-11-11", ytd: null, monthToDate: null,
      months: [pnl(400_000)], cash: null,
      debtors: { total: 0, ageing: { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }, top: [] },
      creditors: { total: 0, ageing: { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 }, top: [] },
      forecast: [], averageMonthlyOpex: null, warnings: [],
    } as FinancialSnapshot;
    const d = buildAccountingDashboard(s, []);
    const gross = d.monthly.find((m) => m.id === "gross-margin");
    assert.equal(gross?.target?.label, "Target 45–60%");
    assert.equal(gross?.target?.status, "on");
    assert.match(gross?.target?.detail ?? "", /Gross profit R220\u00a0000 · target R225\u00a0000–R300\u00a0000 \(below\)/);
    const net = d.monthly.find((m) => m.id === "net-margin");
    assert.equal(net?.target?.label, "Target 20%+");
    assert.equal(net?.target?.status, "on");
  });
});
