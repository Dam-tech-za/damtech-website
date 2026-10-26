import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageDocuments,
  buildCashForecast,
  completeMonthsRange,
  financialYearStart,
  parseAmount,
  parseBankSummary,
  parseProfitAndLoss,
  type FlatReport,
} from "./financials.ts";
import { composeFinancialSnapshot, fetchFinancialParts } from "./financials-sync.ts";
import type { XeroBridgeClient, XeroInvoiceSummary } from "./xero-bridge.ts";

const TODAY = "2026-10-26";

const report = (columns: string[], rows: [string | null, string, string[], boolean?][]): FlatReport => ({
  columns,
  lines: rows.map(([section, label, vals, total]) => ({
    section,
    label,
    values: Object.fromEntries(columns.map((c, i) => [c, vals[i]])),
    is_total: total ?? false,
  })),
});

const XERO_PNL = report(
  ["Sep 2026", "Aug 2026"],
  [
    ["Income", "Sales", ["461597.62", "300000.00"]],
    ["Income", "Total Income", ["461597.62", "300000.00"], true],
    ["Less Cost of Sales", "BUILDING MATERIAL", ["126691.27", "100000.00"]],
    ["Less Cost of Sales", "Total Cost of Sales", ["126691.27", "100000.00"], true],
    [null, "Gross Profit", ["334906.35", "200000.00"]],
    ["Less Operating Expenses", "Wages and Salaries", ["9100.00", "9000.00"]],
    ["Less Operating Expenses", "Total Operating Expenses", ["46573.04", "40000.00"], true],
    [null, "Net Profit", ["288333.31", "160000.00"]],
  ],
);

const invoice = (extra: Partial<XeroInvoiceSummary>): XeroInvoiceSummary => ({
  id: "i-1",
  number: "INV0144",
  type: "ACCREC",
  contact: "Hire Engineering",
  date: "2026-10-21",
  due_date: "2026-10-28",
  status: "AUTHORISED",
  currency: "ZAR",
  subtotal: null,
  tax: null,
  total: 71311.73,
  amount_due: 16311.73,
  amount_paid: 55000,
  reference: null,
  ...extra,
});

describe("financials from Xero reports", () => {
  it("reads Xero's standard profit and loss layout per column", () => {
    const [sep, aug] = parseProfitAndLoss(XERO_PNL);
    assert.equal(sep.label, "Sep 2026");
    assert.equal(sep.income, 461597.62);
    assert.equal(sep.costOfSales, 126691.27);
    assert.equal(sep.grossProfit, 334906.35);
    assert.equal(sep.operatingExpenses, 46573.04);
    assert.equal(sep.netProfit, 288333.31);
    assert.equal(sep.grossMargin, 72.6);
    assert.equal(aug.netProfit, 160000);
  });

  it("works out gross and net when Xero leaves the summary lines out", () => {
    const [p] = parseProfitAndLoss(
      report(["Oct"], [["Income", "Total Income", ["1000"]], ["x", "Total Cost of Sales", ["400"]], ["y", "Total Operating Expenses", ["100"]]]),
    );
    assert.equal(p.grossProfit, 600);
    assert.equal(p.netProfit, 500);
  });

  it("parses Xero amount strings, including brackets for negatives", () => {
    assert.equal(parseAmount("1,234.50"), 1234.5);
    assert.equal(parseAmount("(250.00)"), -250);
    assert.equal(parseAmount(""), 0);
  });

  it("reads closing balances from the bank summary and skips the total row", () => {
    const bank = report(["Opening Balance", "Cash Received", "Cash Spent", "Closing Balance"], [
      [null, "FNB Business", ["10000", "5000", "2000", "13000"]],
      [null, "FNB Savings", ["500", "0", "0", "500"]],
      [null, "Total", ["10500", "5000", "2000", "13500"], true],
    ]);
    assert.deepEqual(parseBankSummary(bank), {
      accounts: [
        { account: "FNB Business", closing: 13000 },
        { account: "FNB Savings", closing: 500 },
      ],
      total: 13500,
    });
  });

  it("ages open invoices by days overdue", () => {
    const a = ageDocuments(
      [
        { number: "INV0143", contact: "Clinton", due_date: "2026-10-27", amount_due: 100000 },
        { number: "INV0139", contact: "Pexmart", due_date: "2026-10-31", amount_due: 11247 },
        { number: "INV0100", contact: "Old", due_date: "2026-09-01", amount_due: 500 },
        { number: "INV0101", contact: "Paid", due_date: "2026-09-01", amount_due: 0 },
      ],
      TODAY,
    );
    assert.equal(a.total, 111747);
    assert.equal(a.ageing.current, 111247);
    assert.equal(a.ageing["1-30"], 0);
    assert.equal(a.ageing["31-60"], 500);
    assert.equal(a.top[0].contact, "Clinton");
  });

  it("forecasts cash by due month, with overdue items in the current month", () => {
    const f = buildCashForecast(
      50000,
      [
        { number: "A", contact: "x", due_date: "2026-10-01", amount_due: 1000 },
        { number: "B", contact: "x", due_date: "2026-11-15", amount_due: 2000 },
        { number: "C", contact: "x", due_date: "2027-03-01", amount_due: 9999 },
      ],
      [{ number: "BILL", contact: "Gundle", due_date: "2026-12-05", amount_due: 30000 }],
      TODAY,
    );
    assert.deepEqual(f.map((m) => m.month), ["2026-10", "2026-11", "2026-12"]);
    assert.deepEqual(f.map((m) => m.closing), [51000, 53000, 23000]);
    assert.equal(f[1].opening, 51000);
  });

  it("finds the financial year start from Xero's year end", () => {
    assert.equal(financialYearStart("2026-10-26", 28, 2), "2026-03-01");
    assert.equal(financialYearStart("2027-01-15", 28, 2), "2026-03-01");
    assert.equal(financialYearStart("2026-02-10", 28, 2), "2025-03-01");
    assert.equal(financialYearStart("2028-02-29", 28, 2), "2027-03-01");
    assert.equal(financialYearStart("2028-03-01", 28, 2), "2028-03-01");
    assert.equal(financialYearStart("2026-10-26", 30, 6), "2026-07-01");
  });

  it("gives the range of the last complete months", () => {
    assert.deepEqual(completeMonthsRange(TODAY, 1), { from: "2026-09-01", to: "2026-09-30" });
    assert.deepEqual(completeMonthsRange("2026-03-10", 1), { from: "2026-02-01", to: "2026-02-28" });
  });

  it("reads Xero with read tools only and keeps estimates out of totals", async () => {
    const calls: { tool: string; args: Record<string, unknown> }[] = [];
    const bridge: XeroBridgeClient = {
      async status() {
        return { connected: true };
      },
      async call<T>(tool: string, args: Record<string, unknown> = {}) {
        calls.push({ tool, args });
        if (tool === "get_organisation") return { FinancialYearEndDay: 28, FinancialYearEndMonth: 2 } as T;
        if (tool === "get_profit_and_loss") return XERO_PNL as T;
        if (tool === "get_bank_summary") return report(["Closing Balance"], [[null, "FNB", ["20000"]], [null, "Total", ["20000"], true]]) as T;
        if (tool === "get_invoices") {
          return (args.kind === "sales"
            ? [invoice({})]
            : [invoice({ id: "b1", number: "BILL1", contact: "Youngman", amount_due: 5000, due_date: "2026-11-10" })]) as T;
        }
        throw new Error(`unexpected ${tool}`);
      },
    };
    const parts = await fetchFinancialParts(bridge, TODAY);
    assert.ok(calls.every((c) => ["get_organisation", "get_profit_and_loss", "get_bank_summary", "get_invoices"].includes(c.tool)));
    assert.equal(calls.length, 7);
    assert.deepEqual(calls.find((c) => c.args.periods)?.args, { date_from: "2026-09-01", date_to: "2026-09-30", periods: 5, timeframe: "MONTH" });
    assert.equal(calls.find((c) => c.tool === "get_profit_and_loss")?.args.date_from, "2026-03-01");

    const snap = composeFinancialSnapshot(parts, "2026-10-26T10:00:00Z", TODAY);
    assert.equal(snap.cash?.total, 20000);
    assert.equal(snap.debtors.total, 16311.73);
    assert.equal(snap.creditors.total, 5000);
    // Forecast = bank + open invoices − open bills; the opex estimate is not deducted.
    assert.deepEqual(snap.forecast.map((m) => m.closing), [36311.73, 31311.73, 31311.73]);
    assert.equal(snap.averageMonthlyOpex, 43286.52);
    assert.deepEqual(snap.warnings, []);
  });
});
