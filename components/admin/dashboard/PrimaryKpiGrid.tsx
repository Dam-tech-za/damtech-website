import { formatZar } from "@/lib/estimating/money";
import type { DashboardMetrics } from "@/lib/admin/dashboard/types";
import type { FinancialSnapshot } from "@/lib/operations/financials";
import { KpiCard } from "./KpiCard";

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

function IconProjects() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 5v14M4 10h5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconBank() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path d="M4 10h16L12 4 4 10Zm2 0v7m4-7v7m4-7v7m4-7v7M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

type PrimaryKpiGridProps = {
  metrics: DashboardMetrics;
  activeProjects: number | null;
  /** Latest Xero snapshot; only passed for roles that may see financials. */
  financials: FinancialSnapshot | null;
};

/** At most four tiles; each opens the list behind it. */
export function PrimaryKpiGrid({ metrics, activeProjects, financials }: PrimaryKpiGridProps) {
  const { primary } = metrics;
  const delta =
    primary.newRfqsDelta == null
      ? metrics.rangeLabel
      : primary.newRfqsDelta === 0
        ? "Same as the period before"
        : primary.newRfqsDelta > 0
          ? `+${primary.newRfqsDelta} on the period before`
          : `${primary.newRfqsDelta} on the period before`;
  const asOf = financials ? `From Xero, ${new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }).format(new Date(financials.fetchedAt))}` : "";

  return (
    <section className="dash-kpi-grid" aria-label="Key figures">
      <KpiCard
        label="New enquiries"
        value={String(primary.newRfqs)}
        hint={primary.newRfqs === 0 ? `None: ${metrics.rangeLabel.toLowerCase()}` : delta}
        href="/admin/rfqs/"
        icon={<IconInbox />}
        empty={primary.newRfqs === 0}
      />
      {activeProjects !== null ? (
        <KpiCard
          label="Active projects"
          value={String(activeProjects)}
          hint="Won jobs not yet completed"
          href="/admin/operations/projects/"
          icon={<IconProjects />}
          empty={activeProjects === 0}
        />
      ) : (
        <KpiCard
          label="Ready to quote"
          value={String(primary.readyForQuote)}
          hint="Open enquiries with everything in"
          href="/admin/rfqs/?status=ready_for_quote"
          icon={<IconQueue />}
          empty={primary.readyForQuote === 0}
        />
      )}
      {financials ? (
        <>
          <KpiCard
            label="Owed to Damtech"
            value={formatZar(financials.debtors.total)}
            hint={asOf}
            href="/admin/operations/financials/"
            icon={<IconValue />}
            empty={financials.debtors.total === 0}
          />
          <KpiCard
            label="Cash in the bank"
            value={financials.cash ? formatZar(financials.cash.total) : "—"}
            hint={asOf}
            href="/admin/operations/financials/"
            icon={<IconBank />}
          />
        </>
      ) : (
        <>
          <KpiCard
            label="Quotations to approve"
            value={String(primary.awaitingApproval)}
            hint="Before they go to the customer"
            href="/admin/quotes/?status=internal_review"
            icon={<IconReview />}
            empty={primary.awaitingApproval === 0}
          />
          <KpiCard
            label="Ready to quote"
            value={String(primary.readyForQuote)}
            hint="Open enquiries with everything in"
            href="/admin/rfqs/?status=ready_for_quote"
            icon={<IconQueue />}
            empty={primary.readyForQuote === 0}
          />
        </>
      )}
    </section>
  );
}
