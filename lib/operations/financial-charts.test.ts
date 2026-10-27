import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { axisTicks, cashOutlook, debtorsByAge, incomeAndCosts, shortRand } from "./financial-charts.ts";
import type { FinancialSnapshot, PnlPeriod } from "./financials.ts";

const p = (income: number, costs: number): PnlPeriod => ({
  label: "",
  income,
  costOfSales: costs / 2,
  grossProfit: income - costs / 2,
  grossMargin: null,
  operatingExpenses: costs / 2,
  otherIncome: 0,
  netProfit: income - costs,
});

describe("financial graphs", () => {
  it("orders months oldest first and adds this month so far", () => {
    const bars = incomeAndCosts({ today: "2026-10-27", months: [p(300, 100), p(200, 100)], monthToDate: p(50, 20) });
    assert.deepEqual(bars.map((b) => b.key), ["2026-08", "2026-09", "2026-10"]);
    assert.equal(bars[1].income, 300);
    assert.equal(bars[0].net, 100);
    assert.equal(bars[2].partial, true);
  });

  it("starts the cash outlook at today's balance", () => {
    const s = { cash: { accounts: [], total: 1000 }, forecast: [{ month: "2026-11", opening: 1000, receipts: 0, payments: 1500, closing: -500 }] } as unknown as FinancialSnapshot;
    const bars = cashOutlook(s);
    assert.deepEqual(bars.map((b) => [b.value, b.basis]), [[1000, "actual"], [-500, "forecast"]]);
    assert.deepEqual(cashOutlook({ cash: null, forecast: [] }), []);
  });

  it("splits debtors by age", () => {
    const s = { debtors: { total: 10, top: [], ageing: { current: 4, "1-30": 3, "31-60": 2, "61-90": 1, "90+": 0 } } } as unknown as FinancialSnapshot;
    assert.deepEqual(debtorsByAge(s).map((b) => b.value), [4, 3, 2, 1, 0]);
  });

  it("makes round axis ticks that include zero and negatives", () => {
    assert.deepEqual(axisTicks(0, 180000), [0, 50000, 100000, 150000, 200000]);
    const t = axisTicks(-30000, 90000);
    assert.ok(t[0] <= -30000 && t.includes(0) && t[t.length - 1] >= 90000);
  });

  it("writes short rand labels", () => {
    assert.equal(shortRand(1_250_000), "R1.3m");
    assert.equal(shortRand(250_400), "R250k");
    assert.equal(shortRand(-4_000), "−R4k");
  });
});
