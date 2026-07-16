import { formatZar } from "@/lib/estimating/money";
import type { DashboardMetrics } from "@/lib/admin/dashboard/types";
import { KpiCard } from "./KpiCard";

type PrimaryKpiGridProps = {
  metrics: DashboardMetrics;
};

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M4 13h4l2 3h4l2-3h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M4 13 6.5 5h11L20 13" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconQueue() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconReview() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M9 11.5 11 13.5 15.5 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconValue() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PrimaryKpiGrid({ metrics }: PrimaryKpiGridProps) {
  const { primary } = metrics;
  const delta =
    primary.newRfqsDelta == null
      ? "Selected period"
      : primary.newRfqsDelta === 0
        ? "Same as previous period"
        : primary.newRfqsDelta > 0
          ? `+${primary.newRfqsDelta} vs previous period`
          : `${primary.newRfqsDelta} vs previous period`;

  return (
    <section className="dash-kpi-grid" aria-label="Primary metrics">
      <KpiCard
        label="New RFQs"
        value={String(primary.newRfqs)}
        hint={
          primary.newRfqs === 0
            ? "No activity in selected period"
            : delta
        }
        href="/admin/rfqs/?status=new"
        icon={<IconInbox />}
        empty={primary.newRfqs === 0}
      />
      <KpiCard
        label="Ready for Quote"
        value={String(primary.readyForQuote)}
        hint={
          primary.readyForQuote === 0
            ? "No activity in selected period"
            : "Estimator queue"
        }
        href="/admin/rfqs/?status=ready_for_quote"
        icon={<IconQueue />}
        empty={primary.readyForQuote === 0}
      />
      <KpiCard
        label="Quotes Awaiting Approval"
        value={String(primary.awaitingApproval)}
        hint={
          primary.awaitingApproval === 0
            ? "No activity in selected period"
            : "Internal review"
        }
        href="/admin/quotes/?status=internal_review"
        icon={<IconReview />}
        empty={primary.awaitingApproval === 0}
      />
      <KpiCard
        label="Accepted Quote Value"
        value={formatZar(primary.acceptedValue)}
        hint="Not cash received"
        href="/admin/quotes/?status=accepted"
        icon={<IconValue />}
        empty={primary.acceptedValue === 0}
      />
    </section>
  );
}
