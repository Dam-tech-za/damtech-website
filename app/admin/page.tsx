import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const metrics = await getDashboardMetrics();

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard__intro">
        <p>
          Operational overview for Damtech quoting. Metrics use live database
          aggregates when RFQ and quote tables exist; otherwise zeros are shown.
        </p>
      </section>

      <section className="admin-metric-grid" aria-label="Quote pipeline metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="admin-metric-card">
            <p className="admin-metric-card__label">{metric.label}</p>
            <p className="admin-metric-card__value">{metric.value}</p>
            <p className="admin-metric-card__hint">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-panels">
        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Quick actions</h2>
          </header>
          <div className="admin-panel__actions">
            <Link href="/admin/rfqs/" className="btn btn--md btn--primary">
              Review RFQs
            </Link>
            <Link href="/admin/quotes/" className="btn btn--md btn--secondary">
              Open quotes
            </Link>
            <Link href="/admin/customers/" className="btn btn--md btn--secondary">
              Customers
            </Link>
          </div>
        </article>

        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Recent RFQs</h2>
          </header>
          <div className="admin-empty">
            <p>No RFQs yet.</p>
            <p className="admin-empty__hint">
              Incoming public form leads will appear here once the RFQ module is
              connected in a later phase.
            </p>
          </div>
        </article>

        <article className="admin-panel">
          <header className="admin-panel__header">
            <h2>Recent activity</h2>
          </header>
          <div className="admin-empty">
            <p>No recent activity.</p>
            <p className="admin-empty__hint">
              Login events and future mutations are written to the audit log.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

type Metric = { label: string; value: number; hint: string };

async function getDashboardMetrics(): Promise<Metric[]> {
  const defaults: Metric[] = [
    { label: "New RFQs", value: 0, hint: "Awaiting first review" },
    { label: "RFQs awaiting review", value: 0, hint: "In triage queue" },
    { label: "Draft quotes", value: 0, hint: "Not yet sent" },
    { label: "Quotes sent", value: 0, hint: "Waiting on customer" },
    { label: "Quotes accepted", value: 0, hint: "Won this period" },
    { label: "Quotes expiring soon", value: 0, hint: "Within 7 days" },
  ];

  try {
    const supabase = await createClient();

    // Tables may not exist until later phases — fail soft to zeros.
    const { count: rfqNew, error: rfqError } = await supabase
      .from("rfqs")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");

    if (rfqError) {
      return defaults;
    }

    const [
      rfqReview,
      quotesDraft,
      quotesSent,
      quotesAccepted,
      quotesExpiring,
    ] = await Promise.all([
      supabase
        .from("rfqs")
        .select("*", { count: "exact", head: true })
        .eq("status", "awaiting_review"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .lte(
          "expires_at",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

    return [
      {
        label: "New RFQs",
        value: rfqNew ?? 0,
        hint: "Awaiting first review",
      },
      {
        label: "RFQs awaiting review",
        value: rfqReview.count ?? 0,
        hint: "In triage queue",
      },
      {
        label: "Draft quotes",
        value: quotesDraft.count ?? 0,
        hint: "Not yet sent",
      },
      {
        label: "Quotes sent",
        value: quotesSent.count ?? 0,
        hint: "Waiting on customer",
      },
      {
        label: "Quotes accepted",
        value: quotesAccepted.count ?? 0,
        hint: "Won this period",
      },
      {
        label: "Quotes expiring soon",
        value: quotesExpiring.count ?? 0,
        hint: "Within 7 days",
      },
    ];
  } catch {
    return defaults;
  }
}
