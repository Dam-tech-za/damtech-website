import {
  ageDocuments,
  averageOperatingExpenses,
  buildCashForecast,
  completeMonthsRange,
  financialYearStart,
  parseBalanceSheet,
  parseBankSummary,
  parseProfitAndLoss,
  type BalancePoint,
  type BankBalance,
  type FinancialSnapshot,
  type FlatReport,
  type OpenDocument,
  type PnlPeriod,
  type QuoteRecord,
  type SaleRecord,
} from "./financials.ts";
import { readAllPages, type XeroBridgeClient, type XeroInvoiceSummary, type XeroQuoteSummary } from "./xero-bridge.ts";

/**
 * Reads Xero reports through the bridge (about 7 calls) and stores them as
 * ops_financial_snapshots rows. The dashboard composes the snapshot on read.
 */

export type FinancialParts = {
  profitAndLoss: {
    financialYearStart: string;
    ytd: PnlPeriod | null;
    monthToDate: PnlPeriod | null;
    months: PnlPeriod[];
    /** Added Nov 2026; missing on older refreshes. */
    priorYear?: PnlPeriod | null;
    priorYearToDate?: PnlPeriod | null;
  };
  bank: { accounts: BankBalance[]; total: number };
  receivables: OpenDocument[];
  payables: OpenDocument[];
  /** Added Nov 2026; missing on older refreshes. Month-ends latest first. */
  balances?: { today: BalancePoint | null; monthEnds: BalancePoint[] };
  sales?: SaleRecord[];
  quotes?: QuoteRecord[];
};

/** The same calendar date `years` earlier (29 Feb becomes 28 Feb). */
export function shiftYears(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return `${y + years}-${String(m).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

const dayBefore = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Extra reports for the Accounting dashboard. A failure here leaves them out instead of failing the refresh. */
async function optional<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read();
  } catch (error) {
    console.error("[financials] optional Xero read failed:", error instanceof Error ? error.message : error);
    return undefined;
  }
}

const toDoc = (i: XeroInvoiceSummary): OpenDocument => ({
  number: i.number,
  contact: i.contact,
  due_date: i.due_date,
  amount_due: Number(i.amount_due) || 0,
});

export async function fetchFinancialParts(bridge: XeroBridgeClient, today: string): Promise<FinancialParts> {
  const org = await bridge.call<{ FinancialYearEndDay: number | null; FinancialYearEndMonth: number | null }>("get_organisation");
  const fyStart = financialYearStart(today, Number(org.FinancialYearEndDay ?? 28), Number(org.FinancialYearEndMonth ?? 2));
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonth = completeMonthsRange(today, 1);

  const [ytd, mtd, monthly, bank] = await Promise.all([
    bridge.call<FlatReport>("get_profit_and_loss", { date_from: fyStart, date_to: today }),
    bridge.call<FlatReport>("get_profit_and_loss", { date_from: monthStart, date_to: today }),
    // Last complete month plus the 11 before it: 12 months (Xero's maximum comparison is 11).
    bridge.call<FlatReport>("get_profit_and_loss", { date_from: lastMonth.from, date_to: lastMonth.to, periods: 11, timeframe: "MONTH" }),
    bridge.call<FlatReport>("get_bank_summary", { date_from: monthStart, date_to: today }),
  ]);
  const sales = await readAllPages((page) => bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "sales", status: "AUTHORISED", page }));
  const bills = await readAllPages((page) => bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "bills", status: "AUTHORISED", page }));

  const priorStart = financialYearStart(dayBefore(fyStart), Number(org.FinancialYearEndDay ?? 28), Number(org.FinancialYearEndMonth ?? 2));
  const [priorYear, priorYearToDate, balanceToday, balanceMonthEnds] = await Promise.all([
    optional(() => bridge.call<FlatReport>("get_profit_and_loss", { date_from: priorStart, date_to: dayBefore(fyStart) })),
    optional(() => bridge.call<FlatReport>("get_profit_and_loss", { date_from: priorStart, date_to: shiftYears(today, -1) })),
    optional(() => bridge.call<FlatReport>("get_balance_sheet", { date: today })),
    // The last 12 month-ends, matching the monthly profit and loss (for operating cash flow).
    optional(() => bridge.call<FlatReport>("get_balance_sheet", { date: lastMonth.to, periods: 11, timeframe: "MONTH" })),
  ]);
  const salesFrom = shiftYears(`${today.slice(0, 7)}-01`, -2);
  const history = await optional(() =>
    readAllPages((page) => bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "sales", status: "AUTHORISED,PAID", date_from: salesFrom, page }), 10),
  );
  const quoteRows = await optional(() =>
    readAllPages((page) => bridge.call<XeroQuoteSummary[]>("get_quotes", { date_from: shiftYears(today, -1), page }), 5),
  );

  return {
    profitAndLoss: {
      financialYearStart: fyStart,
      ytd: parseProfitAndLoss(ytd)[0] ?? null,
      monthToDate: parseProfitAndLoss(mtd)[0] ?? null,
      months: parseProfitAndLoss(monthly),
      ...(priorYear ? { priorYear: parseProfitAndLoss(priorYear)[0] ?? null } : {}),
      ...(priorYearToDate ? { priorYearToDate: parseProfitAndLoss(priorYearToDate)[0] ?? null } : {}),
    },
    bank: parseBankSummary(bank),
    receivables: sales.rows.map(toDoc).filter((d) => d.amount_due > 0),
    payables: bills.rows.map(toDoc).filter((d) => d.amount_due > 0),
    ...(balanceToday || balanceMonthEnds
      ? { balances: { today: balanceToday ? (parseBalanceSheet(balanceToday)[0] ?? null) : null, monthEnds: balanceMonthEnds ? parseBalanceSheet(balanceMonthEnds) : [] } }
      : {}),
    ...(history ? { sales: history.rows.filter((i) => i.date).map(toSale) } : {}),
    ...(quoteRows ? { quotes: quoteRows.rows.map(toQuote) } : {}),
  };
}

const toSale = (i: XeroInvoiceSummary): SaleRecord => ({
  contact: i.contact ?? "Unknown",
  date: String(i.date),
  // Excl. VAT where Xero gives the subtotal.
  amount: Math.round((Number(i.subtotal ?? i.total) || 0) * 100) / 100,
});

const toQuote = (q: XeroQuoteSummary): QuoteRecord => ({
  status: q.status,
  date: q.date,
  expiry: q.expiry_date,
  total: Number(q.total) || 0,
  contact: q.contact,
});

/** Build the dashboard view from stored parts. Forecast uses the cash figure and open documents as stored. */
export function composeFinancialSnapshot(parts: FinancialParts, fetchedAt: string, today: string): FinancialSnapshot {
  const warnings: string[] = [];
  if (!parts.profitAndLoss.ytd) warnings.push("Xero returned no profit and loss for this financial year.");
  if (parts.bank.accounts.length === 0) warnings.push("Xero returned no bank accounts in the bank summary.");
  const lastThree = parts.profitAndLoss.months.slice(0, 3);
  return {
    fetchedAt,
    today,
    financialYearStart: parts.profitAndLoss.financialYearStart,
    ytd: parts.profitAndLoss.ytd,
    monthToDate: parts.profitAndLoss.monthToDate,
    months: parts.profitAndLoss.months,
    cash: parts.bank,
    debtors: ageDocuments(parts.receivables, today),
    creditors: ageDocuments(parts.payables, today),
    forecast: buildCashForecast(parts.bank.total, parts.receivables, parts.payables, today),
    averageMonthlyOpex: averageOperatingExpenses(lastThree),
    balanceToday: parts.balances?.today ?? null,
    balanceMonthEnds: parts.balances?.monthEnds ?? [],
    priorYear: parts.profitAndLoss.priorYear ?? null,
    priorYearToDate: parts.profitAndLoss.priorYearToDate ?? null,
    sales: parts.sales ?? [],
    quotes: parts.quotes ?? [],
    warnings,
  };
}
