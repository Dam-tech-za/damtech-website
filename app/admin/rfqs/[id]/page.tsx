import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { RFQ_STATUSES } from "@/lib/rfq/schema";
import { INFO_REQUEST_FIELDS } from "@/lib/rfq/statuses";
import { HDPE_DISCLAIMER } from "@/lib/estimating/hdpe";
import { suggestQuoteLinesFromAssets } from "@/lib/rfq/quote-suggestions";
import {
  formatQuantitySummaries,
  summariseAssetQuantities,
} from "@/lib/rfq/quantity-summary";
import {
  addRfqNoteAction,
  assignRfqAction,
  convertRfqAction,
  createInfoRequestAction,
  updateMeasurementScheduleAction,
  updateRfqStatusAction,
} from "../actions";
import { CalculatorResultsPanel } from "@/components/admin/CalculatorResultsPanel";
import { RfqAssetReviewPanels } from "@/components/admin/RfqAssetReviewPanels";
import {
  enquiryChannelBadgeClass,
  enquiryChannelLabel,
  inferEnquiryChannel,
  isSimpleEnquiryChannel,
} from "@/lib/rfq/enquiry-channel";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    convertError?: string;
    assetError?: string;
    infoError?: string;
    infoLink?: string;
  }>;
};

export default async function AdminRfqDetailPage({
  params,
  searchParams,
}: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "rfqs")) {
    redirect("/admin/unauthorised/");
  }
  const canManage = canPerform(admin.profile.role, "manageRfqs");
  const canQuote = canPerform(admin.profile.role, "manageQuotes");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: rfq, error } = await supabase
    .from("rfqs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !rfq) notFound();

  const [
    { data: customer },
    { data: events },
    { data: attachments },
    { data: staff },
    { data: quote },
    { data: assets },
    { data: infoRequests },
  ] = await Promise.all([
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
    supabase
      .from("rfq_assets")
      .select("*")
      .eq("rfq_id", id)
      .order("asset_sequence"),
    supabase
      .from("rfq_information_requests")
      .select("id, status, requested_fields, created_at, answered_at")
      .eq("rfq_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const assetRows = assets ?? [];
  const assetIds = assetRows.map((a) => a.id);
  const enquiryChannel =
    rfq.enquiry_channel ||
    inferEnquiryChannel({
      enquiry_channel: rfq.enquiry_channel,
      source_page: rfq.source_page,
      has_calculator_data: rfq.has_calculator_data,
      calculator_type: rfq.calculator_type,
      asset_count: assetRows.length,
    });
  const isSimpleLead =
    isSimpleEnquiryChannel(enquiryChannel) && assetRows.length === 0;
  const { data: calcHistory } = assetIds.length
    ? await supabase
        .from("rfq_asset_calculations")
        .select("id, rfq_asset_id, calculation_type, actor_type, calculated_at")
        .in("rfq_asset_id", assetIds)
        .order("calculated_at", { ascending: false })
        .limit(40)
    : { data: [] as Array<{
        id: string;
        rfq_asset_id: string;
        calculation_type: string;
        actor_type: string;
        calculated_at: string;
      }> };
  const quantitySummary = summariseAssetQuantities(assetRows);
  const quantityLines = formatQuantitySummaries(quantitySummary);
  const previewSuggestions = suggestQuoteLinesFromAssets(assetRows, {
    travelKm: Number(rfq.measurement_travel_km) || null,
    trips: 1,
  });

  const signedAttachments = await Promise.all(
    (attachments ?? []).map(async (file) => {
      const { data } = await supabase.storage
        .from("rfq-attachments")
        .createSignedUrl(file.storage_path, 60 * 30);
      return {
        ...file,
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  const assignee = (staff ?? []).find((p) => p.id === rfq.assigned_to);
  const mapLink =
    rfq.gps_lat != null && rfq.gps_lng != null
      ? `https://www.google.com/maps?q=${rfq.gps_lat},${rfq.gps_lng}`
      : rfq.project_location
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rfq.project_location)}`
        : null;

  return (
    <div className="admin-rfq-detail">
      <section className="admin-panel">
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h2>{rfq.rfq_number}</h2>
            <p className="admin-empty__hint">
              Submitted {new Date(rfq.submitted_at).toLocaleString("en-ZA")} ·{" "}
              <span className={enquiryChannelBadgeClass(enquiryChannel)}>
                {enquiryChannelLabel(enquiryChannel)}
              </span>{" "}
              ·{" "}
              <span className={`admin-status admin-status--${rfq.status}`}>
                {rfq.status}
              </span>
              {assignee
                ? ` · Estimator: ${assignee.full_name || assignee.email}`
                : " · Unassigned"}
            </p>
            {quantityLines.length ? (
              <ul className="admin-qty-list">
                {quantityLines.map((line) => (
                  <li key={line}>{line} (estimate)</li>
                ))}
              </ul>
            ) : rfq.approximate_project_size_text ||
              rfq.approximate_project_size ? (
              <p className="admin-empty__hint">
                Customer size note:{" "}
                {rfq.approximate_project_size_text ||
                  rfq.approximate_project_size}
              </p>
            ) : null}
          </div>
          <div className="admin-panel__actions">
            {rfq.email ? (
              <a className="btn btn--md btn--secondary" href={`mailto:${rfq.email}`}>
                Email customer
              </a>
            ) : null}
            {rfq.phone ? (
              <a className="btn btn--md btn--secondary" href={`tel:${rfq.phone}`}>
                Call
              </a>
            ) : null}
            {quote ? (
              <Link
                className="btn btn--md btn--secondary"
                href={`/admin/quotes/${quote.id}/edit/`}
              >
                Open quote {quote.quote_number}
              </Link>
            ) : null}
          </div>
        </header>

        {query.convertError ? (
          <p className="form-error">{query.convertError}</p>
        ) : null}
        {query.assetError ? <p className="form-error">{query.assetError}</p> : null}
        {query.infoError ? <p className="form-error">{query.infoError}</p> : null}
        {query.infoLink ? (
          <p className="admin-empty__hint">
            Customer information link (copy now — token is not stored in plain
            text):{" "}
            <code>
              {typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
                ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
                : ""}
              {query.infoLink}
            </code>
          </p>
        ) : null}
      </section>

      <div className="admin-rfq-detail__grid">
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Customer</h2>
          </header>
          <dl className="admin-dl">
            <div>
              <dt>Contact</dt>
              <dd>{rfq.contact_name}</dd>
            </div>
            <div>
              <dt>Company / farm</dt>
              <dd>{rfq.company_name ?? customer?.company_name ?? "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{rfq.email ?? "—"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{rfq.phone ?? "—"}</dd>
            </div>
            <div>
              <dt>VAT</dt>
              <dd>{customer?.vat_number ?? "—"}</dd>
            </div>
            <div>
              <dt>Billing address</dt>
              <dd>
                <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(customer?.billing_address ?? {}, null, 2)}
                </pre>
              </dd>
            </div>
            <div>
              <dt>Site address</dt>
              <dd>
                <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(customer?.site_address ?? {}, null, 2)}
                </pre>
              </dd>
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
          <h3 className="admin-subheading">Contact history</h3>
          <ol className="admin-timeline">
            {(events ?? [])
              .filter((e) =>
                [
                  "note_added",
                  "information_requested",
                  "customer_response_received",
                  "converted_to_quote",
                ].includes(e.event_type),
              )
              .slice(0, 12)
              .map((event) => (
                <li key={event.id}>
                  <strong>{event.event_type}</strong>
                  <span className="admin-muted">
                    {" "}
                    · {new Date(event.created_at).toLocaleString("en-ZA")}
                  </span>
                  {event.message ? <p>{event.message}</p> : null}
                </li>
              ))}
          </ol>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Project</h2>
          </header>
          <dl className="admin-dl">
            <div>
              <dt>Location</dt>
              <dd>{rfq.project_location ?? "—"}</dd>
            </div>
            <div>
              <dt>Province</dt>
              <dd>{rfq.province ?? "—"}</dd>
            </div>
            <div>
              <dt>GPS / map</dt>
              <dd>
                {mapLink ? (
                  <a href={mapLink} target="_blank" rel="noreferrer">
                    Open map
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Access notes</dt>
              <dd>{rfq.access_notes ?? "—"}</dd>
            </div>
            <div>
              <dt>Service summary</dt>
              <dd>
                {Array.isArray(rfq.services_requested) && rfq.services_requested.length
                  ? rfq.services_requested.join(", ")
                  : rfq.service_required ?? "—"}
              </dd>
            </div>
          </dl>
          <h3 className="admin-subheading">General description</h3>
          <p className="admin-prose">{rfq.project_description}</p>
        </section>

        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Assets</h2>
            <p className="admin-empty__hint">
              {isSimpleLead
                ? "Simple public quotes start without assets. Enrich when more detail arrives."
                : "Public calculations are provisional. Confirm before quoting."}
            </p>
          </header>
          {isSimpleLead ? (
            <div className="admin-empty">
              <p>No structured assets yet — this is a valid simple enquiry.</p>
              <p className="admin-empty__hint">
                Soft estimates (not confirmed): area{" "}
                {rfq.estimated_area_m2 ?? "—"} m² · capacity{" "}
                {rfq.estimated_capacity_kl ?? "—"} kL · diameter{" "}
                {rfq.estimated_diameter_m ?? "—"} m · height{" "}
                {rfq.estimated_height_m ?? "—"} m
              </p>
              {rfq.simple_service_fields &&
              Object.keys(rfq.simple_service_fields as object).length ? (
                <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(rfq.simple_service_fields, null, 2)}
                </pre>
              ) : null}
              {canManage ? (
                <div className="admin-panel__actions" style={{ marginTop: 12 }}>
                  <a className="btn btn--md btn--secondary" href="#rfq-info-request">
                    Request more information
                  </a>
                  <a
                    className="btn btn--md btn--secondary"
                    href="#rfq-site-measurement"
                  >
                    Schedule / mark site measurement
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <RfqAssetReviewPanels
              assets={assetRows}
              attachments={signedAttachments}
              canManage={canManage}
            />
          )}
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
          {signedAttachments.length === 0 ? (
            <div className="admin-empty">
              <p>No attachments.</p>
            </div>
          ) : (
            <ul className="admin-list">
              {signedAttachments.map((file) => (
                <li key={file.id}>
                  {file.mime_type?.startsWith("image/") && file.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.signedUrl}
                      alt=""
                      width={72}
                      height={72}
                      style={{ objectFit: "cover", marginRight: 8 }}
                    />
                  ) : null}
                  {file.signedUrl ? (
                    <a href={file.signedUrl} target="_blank" rel="noreferrer">
                      {file.file_name}
                    </a>
                  ) : (
                    file.file_name
                  )}{" "}
                  <span className="admin-muted">
                    ({file.category ?? "file"} ·{" "}
                    {new Date(file.created_at).toLocaleDateString("en-ZA")}
                    {file.rfq_asset_id ? " · linked to asset" : ""})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
          <section className="admin-panel">
            <header className="admin-panel__header">
              <h2>Status, assignment & close</h2>
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
                Assign estimator
              </button>
            </form>
            <div className="admin-panel__actions">
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
                  Close RFQ
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {canManage ? (
          <section id="rfq-info-request" className="admin-panel">
            <header className="admin-panel__header">
              <h2>Request more information</h2>
            </header>
            <form action={createInfoRequestAction} className="admin-stack-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <select name="assetId" className="form-input" defaultValue="">
                <option value="">All assets</option>
                {assetRows.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_name}
                  </option>
                ))}
              </select>
              <div className="admin-checkbox-grid">
                {INFO_REQUEST_FIELDS.map((field) => (
                  <label key={field.id} className="admin-checkbox">
                    <input type="checkbox" name="fields" value={field.id} />
                    {field.label}
                  </label>
                ))}
              </div>
              <textarea
                name="message"
                className="form-input"
                rows={3}
                placeholder="Message shown to the customer"
              />
              <button type="submit" className="btn btn--md btn--primary">
                Generate secure customer link
              </button>
            </form>
            {(infoRequests ?? []).length ? (
              <ul className="admin-list">
                {(infoRequests ?? []).map((req) => (
                  <li key={req.id}>
                    {req.status} ·{" "}
                    {new Date(req.created_at).toLocaleString("en-ZA")} ·{" "}
                    {((req.requested_fields as string[]) ?? []).join(", ")}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {canManage ? (
          <section id="rfq-site-measurement" className="admin-panel">
            <header className="admin-panel__header">
              <h2>Schedule site measurement</h2>
            </header>
            <form
              action={updateMeasurementScheduleAction}
              className="admin-stack-form"
            >
              <input type="hidden" name="rfqId" value={rfq.id} />
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="siteMeasurementRequired"
                  defaultChecked={Boolean(rfq.site_measurement_required)}
                />
                Site measurement required
              </label>
              <label>
                Proposed date
                <input
                  type="date"
                  name="proposedDate"
                  className="form-input"
                  defaultValue={rfq.measurement_proposed_date ?? ""}
                />
              </label>
              <label>
                Confirmed date
                <input
                  type="date"
                  name="confirmedDate"
                  className="form-input"
                  defaultValue={rfq.measurement_confirmed_date ?? ""}
                />
              </label>
              <label>
                Assigned employee
                <select
                  name="assignedEmployeeId"
                  className="form-input"
                  defaultValue={rfq.measurement_assigned_to ?? ""}
                >
                  <option value="">Unassigned</option>
                  {(staff ?? []).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name || person.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Travel distance (km)
                <input
                  type="number"
                  step="any"
                  name="travelKm"
                  className="form-input"
                  defaultValue={rfq.measurement_travel_km ?? ""}
                />
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="customerConfirmed"
                  defaultChecked={Boolean(rfq.measurement_customer_confirmed)}
                />
                Customer confirmation received
              </label>
              <textarea
                name="notes"
                className="form-input"
                rows={3}
                placeholder="Measurement notes"
                defaultValue={rfq.measurement_notes ?? ""}
              />
              <button type="submit" className="btn btn--md btn--secondary">
                Save measurement schedule
              </button>
            </form>
          </section>
        ) : null}

        {canQuote ? (
          <section className="admin-panel">
            <header className="admin-panel__header">
              <h2>Prepare quote</h2>
            </header>
            <p className="admin-empty__hint">
              Generates editable draft line suggestions. Does not send a quote.
              Lines without catalogue prices are flagged PRICE REQUIRED —
              approval is blocked until resolved.
            </p>
            {previewSuggestions.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Suggestion</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSuggestions.map((line, index) => (
                      <tr key={`${line.itemCode}-${index}`}>
                        <td>{line.description}</td>
                        <td>{line.quantity}</td>
                        <td>{line.unit}</td>
                        <td>
                          {line.priceRequired ? (
                            <span className="form-error">PRICE REQUIRED</span>
                          ) : (
                            line.sellUnitPrice
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty__hint">No asset-based suggestions yet.</p>
            )}
            <form action={convertRfqAction} className="admin-stack-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <label className="admin-checkbox">
                <input type="checkbox" name="allowUnconfirmed" value="1" />
                Explicitly allow unconfirmed assets
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="acknowledgeSiteMeasurement"
                  value="1"
                />
                Acknowledge unresolved site-measurement requirements
              </label>
              <button type="submit" className="btn btn--md btn--primary">
                Prepare quote / convert to draft
              </button>
            </form>
            {rfq.status === "converted" ? (
              <form action={convertRfqAction} className="admin-inline-form">
                <input type="hidden" name="rfqId" value={rfq.id} />
                <input type="hidden" name="forceSecond" value="1" />
                <input type="hidden" name="allowUnconfirmed" value="1" />
                <input type="hidden" name="acknowledgeSiteMeasurement" value="1" />
                <button type="submit" className="btn btn--md btn--secondary">
                  Create additional quotation deliberately
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
          {(calcHistory ?? []).length ? (
            <>
              <h3 className="admin-subheading">Calculation snapshots</h3>
              <ul className="admin-list">
                {(calcHistory ?? []).map((row) => (
                  <li key={row.id}>
                    {row.calculation_type} · {row.actor_type} ·{" "}
                    {new Date(row.calculated_at).toLocaleString("en-ZA")}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
