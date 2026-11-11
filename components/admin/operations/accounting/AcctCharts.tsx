"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import { axisTicks, shortRand } from "@/lib/operations/financial-charts";

/**
 * Plain-SVG charts for the Accounting dashboard (no chart library).
 * One axis per chart, hairline grid, bars <= 24px with a 4px rounded data
 * end, 2px lines, a crosshair tooltip that lists every series, and a legend
 * whenever there is more than one series. Values also live in the tables.
 */

import { fmtValue, type Fmt } from "./format";

export { fmtValue, type Fmt };

const axisLabel = (v: number, fmt: Fmt) => (fmt === "percent" ? `${Math.round(v)}%` : fmt === "count" ? String(Math.round(v)) : shortRand(v));

export type Series = {
  name: string;
  /** CSS colour (a --acct-series-* token). */
  color: string;
  kind: "bar" | "line" | "area";
  values: (number | null)[];
  /** Optional estimate after the actuals, drawn lighter (bars outlined, lines dashed). */
  forecast?: (number | null)[];
  /** Low/high band around the forecast (lines and areas). */
  band?: { low: number; high: number }[];
  /** Colour per bar (e.g. negative months in the other diverging pole). */
  barColor?: (v: number) => string;
  stack?: string;
};

type Props = {
  labels: string[];
  forecastLabels?: string[];
  series: Series[];
  fmt: Fmt;
  height?: number;
  title: string;
  /** Hide the legend (one series: the title names it). */
  legend?: boolean;
  /** Drawing width; wide panels use more so the chart does not scale up too tall. */
  width?: number;
  /** Target lines across the plot, e.g. a margin target. */
  refLines?: { value: number; label: string }[];
};

const BASE_W = 680;
const PAD = { top: 14, right: 12, bottom: 30, left: 56 };

function barPath(x: number, w: number, y0: number, y1: number): string {
  const h = Math.abs(y1 - y0);
  if (h < 0.5) return "";
  const r = Math.min(4, h, w / 2);
  if (y1 < y0) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}

export function TrendChart({ labels, forecastLabels = [], series, fmt, height = 240, title, legend, width = BASE_W, refLines = [] }: Props) {
  const W = width;
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const all = [...labels, ...forecastLabels];
  const n = all.length;
  if (!n) return <p className="ops-table__meta">No figures yet.</p>;

  // Stacked bars add up per slot.
  const stacks = new Map<string, Series[]>();
  for (const s of series) if (s.kind === "bar" && s.stack) stacks.set(s.stack, [...(stacks.get(s.stack) ?? []), s]);
  const valuesAt = (s: Series, i: number) => (i < labels.length ? s.values[i] : (s.forecast?.[i - labels.length] ?? null));
  const pool: number[] = [];
  for (let i = 0; i < n; i += 1) {
    for (const s of series) {
      const v = valuesAt(s, i);
      if (v !== null && v !== undefined) pool.push(v);
      const b = i >= labels.length ? s.band?.[i - labels.length] : undefined;
      if (b) pool.push(b.low, b.high);
    }
    for (const group of stacks.values()) pool.push(group.reduce((sum, s) => sum + (valuesAt(s, i) ?? 0), 0));
  }
  for (const r of refLines) pool.push(r.value);
  const ticks = axisTicks(Math.min(0, ...pool), Math.max(0, ...pool));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const H = height;
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom);
  const slot = (W - PAD.left - PAD.right) / n;
  const cx = (i: number) => PAD.left + slot * (i + 0.5);

  const barGroups: Series[][] = [];
  for (const s of series) {
    if (s.kind !== "bar") continue;
    if (s.stack) {
      if (!barGroups.some((g) => g[0].stack === s.stack)) barGroups.push(stacks.get(s.stack) ?? [s]);
    } else barGroups.push([s]);
  }
  const bw = barGroups.length ? Math.min(24, (slot - 10) / barGroups.length - 2) : 0;
  const groupX = (i: number, g: number) => cx(i) - (barGroups.length * (bw + 2) - 2) / 2 + g * (bw + 2);

  const linePath = (s: Series, from: number, to: number) => {
    let d = "";
    let pen = false;
    for (let i = from; i <= to; i += 1) {
      const v = valuesAt(s, i);
      if (v === null || v === undefined) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${cx(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const i = Math.floor((x - PAD.left) / slot);
    setHover(i >= 0 && i < n ? i : null);
  };

  const lastActual = labels.length - 1;
  const tipLeft = hover === null ? 0 : (cx(hover) / W) * 100;

  return (
    <figure className="acct-chart" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="acct-visually-hidden">
        {title}
      </figcaption>
      {legend ?? series.length > 1 ? (
        <ul className="acct-legend" aria-hidden="true">
          {series.map((s) => (
            <li key={s.name}>
              <span className={`acct-key acct-key--${s.kind}`} style={{ background: s.kind === "line" ? undefined : s.color, borderColor: s.color }} />
              {s.name}
            </li>
          ))}
          {forecastLabels.length ? (
            <li>
              <span className="acct-key acct-key--forecast" />
              Estimate
            </li>
          ) : null}
        </ul>
      ) : null}
      <div ref={wrapRef} className="acct-chart__plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? "acct-axis" : "acct-gridline"} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="acct-tick">
                {axisLabel(t, fmt)}
              </text>
            </g>
          ))}
          {forecastLabels.length ? (
            <rect x={PAD.left + slot * labels.length} y={PAD.top} width={slot * forecastLabels.length} height={H - PAD.top - PAD.bottom} className="acct-forecast-zone" />
          ) : null}
          {all.map((l, i) => (
            <text key={`${l}-${i}`} x={cx(i)} y={H - 10} textAnchor="middle" className={`acct-tick${i > lastActual ? " acct-tick--forecast" : ""}`}>
              {n > 9 && (n - 1 - i) % 2 === 1 ? "" : l}
            </text>
          ))}

          {/* Bands, then areas, bars, lines: data on top. */}
          {series.map((s) =>
            s.band && s.band.length ? (
              <path
                key={`${s.name}-band`}
                d={
                  `M${cx(lastActual)},${y(valuesAt(s, lastActual) ?? 0)}` +
                  s.band.map((b, k) => `L${cx(labels.length + k)},${y(b.high)}`).join("") +
                  [...s.band].reverse().map((b, k) => `L${cx(labels.length + s.band!.length - 1 - k)},${y(b.low)}`).join("") +
                  "Z"
                }
                fill={s.color}
                className="acct-band"
              />
            ) : null,
          )}
          {series
            .filter((s) => s.kind === "area")
            .map((s) => {
              const d = linePath(s, 0, lastActual);
              const firstIdx = s.values.findIndex((v) => v !== null);
              return d ? (
                <path
                  key={`${s.name}-area`}
                  d={`${d}L${cx(lastActual)},${y(0)}L${cx(Math.max(0, firstIdx))},${y(0)}Z`}
                  fill={s.color}
                  className="acct-area"
                />
              ) : null;
            })}
          {barGroups.map((group, g) =>
            all.map((_, i) => {
              let base = 0;
              return group.map((s) => {
                const v = valuesAt(s, i);
                if (v === null || v === undefined) return null;
                const from = s.stack ? base : 0;
                const to = s.stack ? base + v : v;
                if (s.stack) base += v;
                const isForecast = i > lastActual;
                const gap = s.stack && from !== 0 ? 1 : 0;
                const d = barPath(groupX(i, g), bw, y(from) - gap, y(to));
                const color = s.barColor ? s.barColor(v) : s.color;
                return d ? (
                  <path
                    key={`${s.name}-${i}`}
                    d={d}
                    fill={isForecast ? "transparent" : color}
                    stroke={isForecast ? color : "none"}
                    strokeWidth={isForecast ? 1.5 : 0}
                    className={`acct-bar${hover === i ? " is-hover" : ""}${isForecast ? " acct-bar--forecast" : ""}`}
                  />
                ) : null;
              });
            }),
          )}
          {series
            .filter((s) => s.kind !== "bar")
            .map((s) => (
              <g key={`${s.name}-line`}>
                <path d={linePath(s, 0, lastActual)} stroke={s.color} className="acct-line" />
                {s.forecast?.length ? (
                  <path
                    d={`M${cx(lastActual)},${y(valuesAt(s, lastActual) ?? 0)}` + linePath(s, labels.length, n - 1).replace(/^M/, "L")}
                    stroke={s.color}
                    className="acct-line acct-line--forecast"
                  />
                ) : null}
                {(() => {
                  const v = valuesAt(s, lastActual);
                  return v === null || v === undefined ? null : <circle cx={cx(lastActual)} cy={y(v)} r={4} fill={s.color} className="acct-dot" />;
                })()}
              </g>
            ))}
          {refLines.map((r) => (
            <g key={r.label} className="acct-ref">
              <line x1={PAD.left} x2={W - PAD.right} y1={y(r.value)} y2={y(r.value)} />
              <text x={W - PAD.right} y={y(r.value) - 4} textAnchor="end">
                {r.label}
              </text>
            </g>
          ))}
          {hover !== null ? <line x1={cx(hover)} x2={cx(hover)} y1={PAD.top} y2={H - PAD.bottom} className="acct-crosshair" /> : null}
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} fill="transparent" />
        </svg>
        {hover !== null ? (
          <div className={`acct-tip${tipLeft > 60 ? " acct-tip--left" : ""}`} style={{ left: `${tipLeft}%` }} role="status">
            <p className="acct-tip__title">
              {all[hover]}
              {hover > lastActual ? " · estimate" : ""}
            </p>
            {series.map((s) => {
              const v = valuesAt(s, hover);
              const b = hover > lastActual ? s.band?.[hover - labels.length] : undefined;
              return v === null || v === undefined ? null : (
                <p key={s.name} className="acct-tip__row">
                  <span className="acct-tip__key" style={{ background: s.barColor ? s.barColor(v) : s.color }} />
                  <strong>{fmtValue(v, fmt)}</strong>
                  <span>{s.name}</span>
                  {b ? <span className="acct-tip__range">{`${fmtValue(b.low, fmt)} – ${fmtValue(b.high, fmt)}`}</span> : null}
                </p>
              );
            })}
          </div>
        ) : null}
      </div>
    </figure>
  );
}

/** 12-point trend line in the de-emphasis grey, with the latest point in the accent. */
export function Sparkline({ values }: { values: (number | null)[] }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null && Number.isFinite(p.v));
  if (pts.length < 2) return null;
  const w = 96;
  const h = 28;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const x = (i: number) => 2 + (i / Math.max(1, values.length - 1)) * (w - 4);
  const yy = (v: number) => 3 + (max === min ? (h - 6) / 2 : ((max - v) / (max - min)) * (h - 6));
  const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${yy(p.v).toFixed(1)}`).join("");
  const lastPt = pts[pts.length - 1];
  return (
    <svg className="acct-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} />
      <circle cx={x(lastPt.i)} cy={yy(lastPt.v)} r={3} />
    </svg>
  );
}

/** One whole split into ordered parts (e.g. money owed by age). Thin, no text: the list beside it carries the figures. */
export function SegmentedBar({ parts, label }: { parts: { name: string; value: number; color: string }[]; label: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  return (
    <div className="acct-seg" role="img" aria-label={`${label}: ${parts.map((p) => `${p.name} ${fmtValue(p.value, "rand")}`).join(", ")}`}>
      {total > 0
        ? parts
            .filter((p) => p.value > 0)
            .map((p) => <span key={p.name} title={`${p.name}: ${fmtValue(p.value, "rand")}`} style={{ flexGrow: p.value, background: p.color }} />)
        : <span className="acct-seg__empty" />}
    </div>
  );
}
