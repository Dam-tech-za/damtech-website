import Link from "next/link";
import type { Health, Metric, TargetStatus } from "@/lib/operations/financial-metrics";
import { Sparkline } from "./AcctCharts";
import { fmtValue } from "./format";

/** One figure: label, target or health beside it, value with a trend line, change, and what it means. */

const HEALTH: Record<Exclude<Health, null>, { label: string; icon: string }> = {
  good: { label: "Healthy", icon: "✓" },
  warning: { label: "Watch", icon: "!" },
  critical: { label: "Act now", icon: "!" },
};

const TARGET: Record<TargetStatus, { label: string; icon: string; tone: string }> = {
  on: { label: "On target", icon: "✓", tone: "good" },
  below: { label: "Below", icon: "▼", tone: "critical" },
  above: { label: "Above", icon: "▲", tone: "good" },
};

export function formatMetric(m: Metric): string {
  if (m.value === null) return "—";
  switch (m.format) {
    case "percent":
      return `${m.value.toFixed(1)}%`;
    case "days":
      return `${Math.round(m.value)} days`;
    case "ratio":
      return `${m.value >= 10 ? Math.round(m.value) : m.value.toFixed(2)}×`;
    case "count":
      return String(Math.round(m.value));
    case "months":
      return `${m.value.toFixed(1)} months`;
    default:
      return fmtValue(m.value, "rand");
  }
}

function formatDelta(m: Metric): string | null {
  const d = m.delta;
  if (!d) return null;
  const sign = d.value > 0 ? "+" : d.value < 0 ? "−" : "±";
  const abs = Math.abs(d.value);
  const text = m.format === "percent" ? `${abs.toFixed(1)} pts` : m.format === "rand" ? fmtValue(abs, "rand") : abs.toFixed(1);
  return `${sign}${text} vs ${d.vs}`;
}

export function MetricCard({ m, large, href }: { m: Metric; large?: boolean; href?: string }) {
  const delta = formatDelta(m);
  const good = m.delta ? (m.delta.value >= 0) === m.delta.goodWhenUp : null;
  const target = m.target;
  const targetState = target?.status ? TARGET[target.status] : null;
  const body = (
    <>
      <header className="acct-card__head">
        <h3>{m.label}</h3>
        {target ? (
          <span className={`acct-target${targetState ? ` acct-target--${targetState.tone}` : ""}`} title={target.detail}>
            {targetState ? <span aria-hidden="true">{targetState.icon}</span> : null}
            {target.label}
            {targetState ? <span className="acct-visually-hidden">: {targetState.label}</span> : null}
          </span>
        ) : m.health ? (
          <span className={`acct-health acct-health--${m.health}`}>
            <span aria-hidden="true">{HEALTH[m.health].icon}</span>
            {HEALTH[m.health].label}
          </span>
        ) : m.basis !== "actual" ? (
          <span className="acct-health acct-health--estimate">Estimate</span>
        ) : null}
      </header>
      <div className="acct-card__body">
        <p className="acct-card__value">{formatMetric(m)}</p>
        {m.trend ? <Sparkline values={m.trend} /> : null}
      </div>
      {delta ? (
        <p className={`acct-card__delta${good === null ? "" : good ? " is-good" : " is-bad"}`}>
          <span aria-hidden="true">{m.delta && m.delta.value >= 0 ? "▲" : "▼"}</span> {delta}
        </p>
      ) : null}
      {target?.detail ? <p className="acct-card__target">{target.detail}</p> : null}
      <p className="acct-card__note" title={m.note}>
        {m.note}
      </p>
      {m.rule ? <p className="acct-card__rule">Rule of thumb: {m.rule}</p> : null}
    </>
  );
  const className = `acct-card${large ? " acct-card--large" : ""}${m.value === null ? " acct-card--empty" : ""}${href ? " acct-card--link" : ""}`;
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}
