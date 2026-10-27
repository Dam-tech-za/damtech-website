import type { FinancialSnapshot } from "@/lib/operations/financials";
import { axisTicks, cashOutlook, debtorsByAge, incomeAndCosts, shortRand, type ValueBar } from "@/lib/operations/financial-charts";
import { formatOpsMoney } from "@/components/admin/operations/ops-format";

/**
 * Three small graphs above "This financial year", drawn as plain SVG from the
 * stored Xero snapshot (no chart library). Hovering a bar shows its exact
 * amount; the tables further down the page carry the same figures.
 */

const W = 640;
const PAD = { top: 12, right: 8, bottom: 40, left: 52 };

function Gridlines({ ticks, y, width }: { ticks: number[]; y: (v: number) => number; width: number }) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? "fin-chart__zero" : "fin-chart__grid"} />
          <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fin-chart__tick">
            {shortRand(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Bar with a 4px rounded data end, anchored square to the zero line. */
function barPath(x: number, w: number, y0: number, y1: number): string {
  const up = y1 < y0;
  const h = Math.abs(y1 - y0);
  const r = Math.min(4, h, w / 2);
  if (h < 0.5) return "";
  if (up) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}

function IncomeAndCostsChart({ s }: { s: FinancialSnapshot }) {
  const bars = incomeAndCosts(s);
  if (!bars.length) return <p className="ops-table__meta">Xero returned no monthly results yet.</p>;
  const H = 230;
  const ticks = axisTicks(Math.min(...bars.map((b) => Math.min(b.income, b.costs))), Math.max(...bars.map((b) => Math.max(b.income, b.costs))));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom);
  const slot = (W - PAD.left - PAD.right) / bars.length;
  const bw = Math.min(22, (slot - 14) / 2);
  return (
    <figure className="fin-chart">
      <figcaption className="fin-chart__legend">
        <span>
          <i className="fin-chart__key fin-chart__key--income" /> Income
        </span>
        <span>
          <i className="fin-chart__key fin-chart__key--costs" /> Costs (cost of sales and expenses)
        </span>
        <span className="ops-table__meta">Figure under each month: net profit</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Income and costs per month from Xero" className="fin-chart__svg">
        <Gridlines ticks={ticks} y={y} width={W} />
        {bars.map((b, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={b.key} className={b.partial ? "fin-chart__partial" : undefined}>
              <path d={barPath(cx - bw - 1, bw, y(0), y(b.income))} className="fin-chart__bar fin-chart__bar--income">
                <title>{`${b.label}: income ${formatOpsMoney(b.income)}`}</title>
              </path>
              <path d={barPath(cx + 1, bw, y(0), y(b.costs))} className="fin-chart__bar fin-chart__bar--costs">
                <title>{`${b.label}: costs ${formatOpsMoney(b.costs)}`}</title>
              </path>
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={H - PAD.top - PAD.bottom} className="fin-chart__hit">
                <title>{`${b.label}\nIncome ${formatOpsMoney(b.income)}\nCosts ${formatOpsMoney(b.costs)}\nNet profit ${formatOpsMoney(b.net)}`}</title>
              </rect>
              <text x={cx} y={H - PAD.bottom + 15} textAnchor="middle" className="fin-chart__label">
                {b.label}
              </text>
              <text x={cx} y={H - PAD.bottom + 30} textAnchor="middle" className={`fin-chart__net${b.net < 0 ? " fin-chart__net--loss" : ""}`}>
                {shortRand(b.net)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function ColumnChart({ bars, label, note }: { bars: ValueBar[]; label: string; note?: string }) {
  const H = 210;
  const w = 420;
  const ticks = axisTicks(Math.min(...bars.map((b) => b.value)), Math.max(...bars.map((b) => b.value)));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom);
  const slot = (w - PAD.left - PAD.right) / bars.length;
  const bw = Math.min(40, slot - 16);
  return (
    <figure className="fin-chart">
      {note ? <figcaption className="fin-chart__legend ops-table__meta">{note}</figcaption> : null}
      <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={label} className="fin-chart__svg">
        <Gridlines ticks={ticks} y={y} width={w} />
        {bars.map((b, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={b.key}>
              <path
                d={barPath(cx - bw / 2, bw, y(0), y(b.value))}
                className={`fin-chart__bar fin-chart__bar--income${b.basis === "forecast" ? " fin-chart__bar--forecast" : ""}${b.value < 0 ? " fin-chart__bar--negative" : ""}`}
              />
              <rect x={cx - slot / 2} y={PAD.top} width={slot} height={H - PAD.top - PAD.bottom} className="fin-chart__hit">
                <title>{`${b.label}: ${formatOpsMoney(b.value)}${b.basis === "forecast" ? " (forecast)" : ""}`}</title>
              </rect>
              <text x={cx} y={H - PAD.bottom + 15} textAnchor="middle" className="fin-chart__label">
                {b.label}
              </text>
              <text x={cx} y={H - PAD.bottom + 30} textAnchor="middle" className="fin-chart__net">
                {shortRand(b.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function DebtorsChart({ s }: { s: FinancialSnapshot }) {
  const bars = debtorsByAge(s);
  if (s.debtors.total <= 0) return <p className="ops-table__meta">No customer owes Damtech anything right now.</p>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <ul className="fin-hbars" aria-label="Money owed to Damtech by how late it is">
      {bars.map((b) => (
        <li key={b.key} className="fin-hbars__row" title={`${b.label}: ${formatOpsMoney(b.value)}`}>
          <span className="fin-hbars__label">{b.label}</span>
          <span className="fin-hbars__track">
            <span
              className={`fin-hbars__bar${b.key === "current" ? "" : " fin-hbars__bar--late"}`}
              style={{ width: b.value > 0 ? `max(${(b.value / max) * 100}%, 3px)` : 0 }}
            />
          </span>
          <span className="fin-hbars__value">{formatOpsMoney(b.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function FinancialCharts({ s, basis }: { s: FinancialSnapshot; basis: (b: "actual" | "forecast") => React.ReactNode }) {
  const cash = cashOutlook(s);
  return (
    <section className="fin-charts" aria-label="Graphs from Xero">
      <div className="fin-charts__panel fin-charts__panel--wide">
        <header className="fin-charts__head">
          <h2>Income and costs per month</h2>
          {basis("actual")}
        </header>
        <IncomeAndCostsChart s={s} />
      </div>
      <div className="fin-charts__panel">
        <header className="fin-charts__head">
          <h2>Cash in the bank, next three months</h2>
          {basis("forecast")}
        </header>
        {cash.length ? (
          <ColumnChart bars={cash} label="Bank balance today and forecast month-end balances" note="Today's balance, then expected month-end balances from open invoices and bills." />
        ) : (
          <p className="ops-table__meta">Xero returned no bank balance.</p>
        )}
      </div>
      <div className="fin-charts__panel">
        <header className="fin-charts__head">
          <h2>Owed to Damtech, by how late</h2>
          {basis("actual")}
        </header>
        <DebtorsChart s={s} />
      </div>
    </section>
  );
}
