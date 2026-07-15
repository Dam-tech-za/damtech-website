import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { RFQ_STATUSES } from "@/lib/rfq/schema";
import { HDPE_DISCLAIMER } from "@/lib/estimating/hdpe";
import {
  addRfqNoteAction,
  assignRfqAction,
  convertRfqAction,
  updateRfqStatusAction,
} from "../actions";
import { CalculatorResultsPanel } from "@/components/admin/CalculatorResultsPanel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRfqDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "rfqs")) {
    redirect("/admin/unauthorised/");
  }
  const canManage = canPerform(admin.profile.role, "manageRfqs");
  const { id } = await params;
  const supabase = await createClient();

  const { data: rfq, error } = await supabase
    .from("rfqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !rfq) notFound();

  const [{ data: customer }, { data: events }, { data: attachments }, { data: staff }, { data: quote }] =
    await Promise.all([
      rfq.customer_id
        ? supabase.from("customers").select("*").eq("id", rfq.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("rfq_events")
        .select("*")
        .eq("rfq_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("rfq_attachments").select("*").eq("rfq_id", id),
      supabase
        .from("admin_profiles")
        .select("id, email, full_name")
        .eq("is_active", true)
        .order("email"),
      rfq.converted_quote_id
        ? supabase
            .from("quotes")
            .select("id, quote_number, status")
            .eq("id", rfq.converted_quote_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <div className="admin-rfq-detail">
      <div className="admin-rfq-detail__grid">
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>{rfq.rfq_number}</h2>
            <p className="admin-empty__hint">
              Submitted {new Date(rfq.submitted_at).toLocaleString("en-ZA")} ·{" "}
              <span className={`admin-status admin-status--${rfq.status}`}>
                {rfq.status}
              </span>
            </p>
          </header>

          <dl className="admin-dl">
            <div>
              <dt>Service</dt>
              <dd>{rfq.service_required ?? "—"}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                {rfq.source} · {rfq.source_page ?? "—"}
              </dd>
            </div>
            <div>
              <dt>Province</dt>
              <dd>{rfq.province ?? "—"}</dd>
            </div>
            <div>
              <dt>Project location</dt>
              <dd>{rfq.project_location ?? "—"}</dd>
            </div>
            <div>
              <dt>Approx. size</dt>
              <dd>{rfq.approximate_project_size ?? "—"}</dd>
            </div>
          </dl>

          <h3 className="admin-subheading">Project description</h3>
          <p className="admin-prose">{rfq.project_description}</p>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Contact / customer</h2>
          </header>
          <dl className="admin-dl">
            <div>
              <dt>Name</dt>
              <dd>{rfq.contact_name}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{rfq.company_name ?? "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{rfq.email ?? "—"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{rfq.phone ?? "—"}</dd>
            </div>
          </dl>
          {customer ? (
            <p className="admin-empty__hint">
              Linked customer:{" "}
              <Link href={`/admin/customers/${customer.id}/`}>
                {customer.name}
              </Link>
            </p>
          ) : null}
        </section>

        <CalculatorResultsPanel
          calculatorType={rfq.calculator_type}
          inputs={rfq.calculator_input as Record<string, unknown> | null}
          results={rfq.calculator_result as Record<string, unknown> | null}
        />

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Attachments</h2>
          </header>
          {(attachments ?? []).length === 0 ? (
            <div className="admin-empty">
              <p>No attachments.</p>
              <p className="admin-empty__hint">
                Private bucket <code>rfq-attachments</code> — signed downloads in a later iteration.
              </p>
            </div>
          ) : (
            <ul className="admin-list">
              {(attachments ?? []).map((file) => (
                <li key={file.id}>
                  {file.file_name}{" "}
                  <span className="admin-muted">({file.mime_type ?? "file"})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Status & assignment</h2>
          </header>
          <form action={updateRfqStatusAction} className="admin-inline-form">
            <input type="hidden" name="rfqId" value={rfq.id} />
            <select name="status" className="form-input" defaultValue={rfq.status}>
              {RFQ_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn--md btn--primary">
              Update status
            </button>
          </form>
          <form action={assignRfqAction} className="admin-inline-form">
            <input type="hidden" name="rfqId" value={rfq.id} />
            <select
              name="assignedTo"
              className="form-input"
              defaultValue={rfq.assigned_to ?? ""}
            >
              <option value="">Unassigned</option>
              {(staff ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn--md btn--secondary">
              Assign
            </button>
          </form>
          <div className="admin-panel__actions">
            <form action={updateRfqStatusAction}>
              <input type="hidden" name="rfqId" value={rfq.id} />
              <input type="hidden" name="status" value="information_required" />
              <button type="submit" className="btn btn--md btn--secondary">
                Request more info
              </button>
            </form>
            <form action={updateRfqStatusAction}>
              <input type="hidden" name="rfqId" value={rfq.id} />
              <input type="hidden" name="status" value="spam" />
              <button type="submit" className="btn btn--md btn--secondary">
                Mark spam
              </button>
            </form>
            <form action={updateRfqStatusAction}>
              <input type="hidden" name="rfqId" value={rfq.id} />
              <input type="hidden" name="status" value="closed" />
              <button type="submit" className="btn btn--md btn--secondary">
                Close
              </button>
            </form>
          </div>
        </section>
        ) : null}

        {canManage ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Convert to quote</h2>
          </header>
          {quote ? (
            <p>
              Linked draft: <strong>{quote.quote_number}</strong> ({quote.status})
            </p>
          ) : (
            <p className="admin-empty__hint">
              Creates a Phase 2 draft quote foundation with suggested line items.
            </p>
          )}
          <form action={convertRfqAction} className="admin-inline-form">
            <input type="hidden" name="rfqId" value={rfq.id} />
            <button type="submit" className="btn btn--md btn--primary">
              Convert to draft quote
            </button>
          </form>
          {rfq.status === "converted" ? (
            <form action={convertRfqAction} className="admin-inline-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <input type="hidden" name="forceSecond" value="1" />
              <button type="submit" className="btn btn--md btn--secondary">
                Explicit second quote
              </button>
            </form>
          ) : null}
          <p className="admin-empty__hint">{HDPE_DISCLAIMER}</p>
        </section>
        ) : null}

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Internal notes</h2>
          </header>
          <pre className="admin-notes">{rfq.internal_notes || "No notes yet."}</pre>
          {canManage ? (
          <form action={addRfqNoteAction} className="admin-stack-form">
            <input type="hidden" name="rfqId" value={rfq.id} />
            <textarea name="note" className="form-input" rows={3} required />
            <button type="submit" className="btn btn--md btn--primary">
              Add note
            </button>
          </form>
          ) : null}
        </section>

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Timeline</h2>
          </header>
          {(events ?? []).length === 0 ? (
            <div className="admin-empty">
              <p>No events yet.</p>
            </div>
          ) : (
            <ol className="admin-timeline">
              {(events ?? []).map((event) => (
                <li key={event.id}>
                  <strong>{event.event_type}</strong>
                  <span className="admin-muted">
                    {" "}
                    · {new Date(event.created_at).toLocaleString("en-ZA")}
                    {event.actor_email ? ` · ${event.actor_email}` : ""}
                  </span>
                  {event.message ? <p>{event.message}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
