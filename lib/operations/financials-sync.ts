import {
  ageDocuments,
  averageOperatingExpenses,
  buildCashForecast,
  completeMonthsRange,
  financialYearStart,
  parseBankSummary,
  parseProfitAndLoss,
  type BankBalance,
  type FinancialSnapshot,
  type FlatReport,
  type OpenDocument,
  type PnlPeriod,
} from "./financials.ts";
import { readAllPages, type XeroBridgeClient, type XeroInvoiceSummary } from "./xero-bridge.ts";

/**
 * Reads Xero reports through the bridge (about 7 calls) and stores them as
 * ops_financial_snapshots rows. The dashboard composes the snapshot on read.
 */

export type FinancialParts = {
  profitAndLoss: { financialYearStart: string; ytd: PnlPeriod | null; monthToDate: PnlPeriod | null; months: PnlPeriod[] };
  bank: { accounts: BankBalance[]; total: number };
  receivables: OpenDocument[];
  payables: OpenDocument[];
};

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
    // Last complete month plus the 5 before it (Xero's maximum comparison is 11).
    bridge.call<FlatReport>("get_profit_and_loss", { date_from: lastMonth.from, date_to: lastMonth.to, periods: 5, timeframe: "MONTH" }),
    bridge.call<FlatReport>("get_bank_summary", { date_from: monthStart, date_to: today }),
  ]);
  const sales = await readAllPages((page) => bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "sales", status: "AUTHORISED", page }));
  const bills = await readAllPages((page) => bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "bills", status: "AUTHORISED", page }));

  return {
    profitAndLoss: {
      financialYearStart: fyStart,
      ytd: parseProfitAndLoss(ytd)[0] ?? null,
      monthToDate: parseProfitAndLoss(mtd)[0] ?? null,
      months: parseProfitAndLoss(monthly),
    },
    bank: parseBankSummary(bank),
    receivables: sales.rows.map(toDoc).filter((d) => d.amount_due > 0),
    payables: bills.rows.map(toDoc).filter((d) => d.amount_due > 0),
  };
}

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
    warnings,
  };
}
