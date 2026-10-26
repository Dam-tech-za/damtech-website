/**
 * Financials for the Operations dashboard, from Xero only.
 *
 * Every figure has a basis the screen shows beside it:
 * - ACTUAL: straight from a Xero report or open invoices and bills.
 * - FORECAST: open invoices and bills placed in the month they fall due. It
 *   is mechanical and leaves out anything not yet entered in Xero.
 * - ESTIMATE: an average of past actuals, shown for reference only and never
 *   added into actual or forecast totals.
 *
 * Company profit is never worked out from quotes. Pure functions, unit-tested.
 */

export type FigureBasis = "actual" | "forecast" | "estimate";

/** Shape of the bridge's flattened Xero reports (tools.ts flattenReport). */
export type FlatReport = {
  report?: string;
  date?: string;
  columns: string[];
  lines: { section: string | null; label: string; values: Record<string, string> | string[]; is_total?: boolean }[];
};

export type OpenDocument = {
  number: string | null;
  contact: string | null;
  due_date: string | null;
  amount_due: number;
};

export function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const negative = /^\(.*\)$/.test(value.trim());
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function valueAt(line: FlatReport["lines"][number], column: string | number): number {
  const v = Array.isArray(line.values) ? line.values[Number(column)] : line.values[String(column)];
  return parseAmount(v);
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function findLine(report: FlatReport, patterns: RegExp[]) {
  return report.lines.find((l) => patterns.some((p) => p.test(norm(l.label))));
}

export type PnlPeriod = {
  label: string;
  income: number;
  costOfSales: number;
  grossProfit: number;
  grossMargin: number | null;
  operatingExpenses: number;
  otherIncome: number;
  netProfit: number;
};

const INCOME = [/^total (trading )?income$/, /^total revenue$/, /^total sales$/];
const COS = [/^total cost of sales$/, /^total direct costs$/];
const GROSS = [/^gross profit$/];
const OPEX = [/^total operating expenses$/, /^total expenses$/, /^total overheads$/];
const OTHER_INCOME = [/^total other income$/];
const NET = [/^net profit$/, /^net (income|loss)$/, /^net profit \(loss\)$/];

/** One PnlPeriod per report column, in the report's order (Xero puts the latest first). */
export function parseProfitAndLoss(report: FlatReport): PnlPeriod[] {
  const columns = report.columns.length ? report.columns : ["0"];
  const income = findLine(report, INCOME);
  const cos = findLine(report, COS);
  const gross = findLine(report, GROSS);
  const opex = findLine(report, OPEX);
  const other = findLine(report, OTHER_INCOME);
  const net = findLine(report, NET);
  return columns.map((column, index) => {
    const key = report.columns.length ? column : index;
    const inc = income ? valueAt(income, key) : 0;
    const c = cos ? valueAt(cos, key) : 0;
    const g = gross ? valueAt(gross, key) : inc - c;
    const o = opex ? valueAt(opex, key) : 0;
    const oi = other ? valueAt(other, key) : 0;
    const n = net ? valueAt(net, key) : g + oi - o;
    return {
      label: column,
      income: round2(inc),
      costOfSales: round2(c),
      grossProfit: round2(g),
      grossMargin: inc !== 0 ? Math.round((g / inc) * 1000) / 10 : null,
      operatingExpenses: round2(o),
      otherIncome: round2(oi),
      netProfit: round2(n),
    };
  });
}

export type BankBalance = { account: string; closing: number };

/** Closing balance per bank account from the Bank Summary report. */
export function parseBankSummary(report: FlatReport): { accounts: BankBalance[]; total: number } {
  const closingColumn = report.columns.find((c) => /closing/i.test(c));
  const accounts: BankBalance[] = [];
  for (const line of report.lines) {
    if (line.is_total || /^total$/i.test(line.label.trim())) continue;
    const closing = closingColumn ? valueAt(line, closingColumn) : Array.isArray(line.values) ? parseAmount(line.values.at(-1)) : 0;
    accounts.push({ account: line.label, closing: round2(closing) });
  }
  return { accounts, total: round2(accounts.reduce((s, a) => s + a.closing, 0)) };
}

export type Ageing = { current: number; "1-30": number; "31-60": number; "61-90": number; "90+": number };

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export function ageDocuments(docs: OpenDocument[], today: string): { total: number; ageing: Ageing; top: { contact: string; amount: number }[] } {
  const ageing: Ageing = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const byContact = new Map<string, number>();
  for (const d of docs) {
    if (!(d.amount_due > 0)) continue;
    const overdue = d.due_date ? daysBetween(d.due_date, today) : 0;
    const key: keyof Ageing = overdue <= 0 ? "current" : overdue <= 30 ? "1-30" : overdue <= 60 ? "31-60" : overdue <= 90 ? "61-90" : "90+";
    ageing[key] += d.amount_due;
    const name = d.contact ?? "Unknown";
    byContact.set(name, (byContact.get(name) ?? 0) + d.amount_due);
  }
  (Object.keys(ageing) as (keyof Ageing)[]).forEach((k) => (ageing[k] = round2(ageing[k])));
  const total = round2(Object.values(ageing).reduce((s, v) => s + v, 0));
  const top = [...byContact.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([contact, amount]) => ({ contact, amount: round2(amount) }));
  return { total, ageing, top };
}

export type ForecastMonth = {
  month: string; // YYYY-MM
  opening: number;
  receipts: number;
  payments: number;
  closing: number;
};

const monthOf = (date: string) => date.slice(0, 7);

function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Three-month cash forecast from today's bank balance plus open invoices and
 * bills by due month. Overdue items and items without a due date land in the
 * current month. Anything due after the window is left out.
 */
export function buildCashForecast(
  openingCash: number,
  receivables: OpenDocument[],
  payables: OpenDocument[],
  today: string,
  months = 3,
): ForecastMonth[] {
  const first = monthOf(today);
  const window = Array.from({ length: months }, (_, i) => addMonths(first, i));
  const bucket = (docs: OpenDocument[]) => {
    const sums = new Map<string, number>(window.map((m) => [m, 0]));
    for (const d of docs) {
      if (!(d.amount_due > 0)) continue;
      const m = d.due_date && monthOf(d.due_date) > first ? monthOf(d.due_date) : first;
      if (sums.has(m)) sums.set(m, (sums.get(m) ?? 0) + d.amount_due);
    }
    return sums;
  };
  const inflow = bucket(receivables);
  const outflow = bucket(payables);
  let running = openingCash;
  return window.map((month) => {
    const opening = round2(running);
    const receipts = round2(inflow.get(month) ?? 0);
    const payments = round2(outflow.get(month) ?? 0);
    running = opening + receipts - payments;
    return { month, opening, receipts, payments, closing: round2(running) };
  });
}

/** ESTIMATE: average monthly operating expenses over the given complete months. */
export function averageOperatingExpenses(periods: PnlPeriod[]): number | null {
  if (periods.length === 0) return null;
  return round2(periods.reduce((s, p) => s + p.operatingExpenses, 0) / periods.length);
}

/** First day of the financial year containing `today`, from Xero's year-end day and month. */
export function financialYearStart(today: string, endDay: number, endMonth: number): string {
  const year = Number(today.slice(0, 4));
  const startFor = (y: number) => {
    // A February year end of 28 or 29 means the last day of February in every year.
    const day = endMonth === 2 && endDay >= 28 ? new Date(Date.UTC(y, 2, 0)).getUTCDate() : endDay;
    const end = new Date(Date.UTC(y, endMonth - 1, day));
    end.setUTCDate(end.getUTCDate() + 1);
    return end.toISOString().slice(0, 10);
  };
  // The year-end in the previous calendar year starts the current FY unless this year's end has passed.
  const thisYear = startFor(year);
  return thisYear <= today ? thisYear : startFor(year - 1);
}

/** Last day of the month before `today`'s month, and the month-end `n` months before that. */
export function completeMonthsRange(today: string, n: number): { from: string; to: string } {
  const month = monthOf(today);
  const lastComplete = addMonths(month, -1);
  const firstComplete = addMonths(month, -n);
  const [ly, lm] = lastComplete.split("-").map(Number);
  const lastDay = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
  return { from: `${firstComplete}-01`, to: `${lastComplete}-${String(lastDay).padStart(2, "0")}` };
}

export type FinancialSnapshot = {
  fetchedAt: string;
  financialYearStart: string;
  today: string;
  ytd: PnlPeriod | null;
  monthToDate: PnlPeriod | null;
  months: PnlPeriod[]; // latest first, complete months
  cash: { accounts: BankBalance[]; total: number } | null;
  debtors: ReturnType<typeof ageDocuments>;
  creditors: ReturnType<typeof ageDocuments>;
  forecast: ForecastMonth[];
  averageMonthlyOpex: number | null;
  warnings: string[];
};
