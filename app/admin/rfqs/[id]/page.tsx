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
import { ResendRfqNotificationButton } from "@/components/admin/ResendRfqNotificationButton";
import { RfqDetailActions } from "@/components/admin/rfqs/RfqDetailActions";
import {
  AdminButton,
  AdminCheckbox,
  AdminDateInput,
  AdminEmptyState,
  AdminFieldError,
  AdminHelpText,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTabs,
  AdminTextarea,
} from "@/components/admin/ui";

const RFQ_SECTION_TABS = [
  { id: "overview", label: "Overview", href: "#rfq-overview" },
  { id: "assets", label: "Assets & Measurements", href: "#rfq-assets" },
  { id: "attachments", label: "Attachments", href: "#rfq-attachments" },
  { id: "communication", label: "Communication", href: "#rfq-communication" },
  { id: "activity", label: "Activity", href: "#rfq-activity" },
] as const;

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
  const canDelete = canPerform(admin.profile.role, "deleteRfqs");
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
    { data: communications },
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
    supabase
      .from("rfq_communications")
      .select(
        "id, communication_type, recipient, status, provider_error, created_at",
      )
      .eq("rfq_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
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

  const headerDescription = `Submitted ${new Date(rfq.submitted_at).toLocaleString("en-ZA")}${
    assignee
      ? ` · Estimator: ${assignee.full_name || assignee.email}`
      : " · Unassigned"
  }`;

  return (
    <div className="admin-rfq-detail admin-stack--page">
      <AdminPageHeader
        title={rfq.rfq_number}
        description={headerDescription}
        toolbar={
          <>
            <span className={enquiryChannelBadgeClass(enquiryChannel)}>
              {enquiryChannelLabel(enquiryChannel)}
            </span>
            {" · "}
            <AdminStatusBadge status={rfq.status} domain="rfq" />
            {quantityLines.length ? (
              <ul className="admin-qty-list">
                {quantityLines.map((line) => (
                  <li key={line}>{line} (estimate)</li>
                ))}
              </ul>
            ) : rfq.approximate_project_size_text ||
              rfq.approximate_project_size ? (
              <AdminHelpText>
                Customer size note:{" "}
                {rfq.approximate_project_size_text ||
                  rfq.approximate_project_size}
              </AdminHelpText>
            ) : null}
          </>
        }
        secondaryActions={
          <>
            {canManage ? <ResendRfqNotificationButton rfqId={rfq.id} /> : null}
            {rfq.email ? (
              <AdminButton href={`mailto:${rfq.email}`} variant="secondary">
                Email customer
              </AdminButton>
            ) : null}
            {rfq.phone ? (
              <AdminButton href={`tel:${rfq.phone}`} variant="secondary">
                Call
              </AdminButton>
            ) : null}
            {quote ? (
              <AdminButton
                href={`/admin/quotes/${quote.id}/edit/`}
                variant="secondary"
              >
                Open quote {quote.quote_number}
              </AdminButton>
            ) : null}
            {canQuote && !quote ? (
              <AdminButton href="#rfq-prepare-quote" variant="primary">
                Convert to Quote
              </AdminButton>
            ) : null}
            {canManage || canDelete ? (
              <RfqDetailActions
                summary={{
                  id: rfq.id,
                  rfqNumber: rfq.rfq_number,
                  customerName: rfq.contact_name,
                  companyName: rfq.company_name,
                  serviceLabel: rfq.service_required ?? "Not specified",
                  submittedAt: rfq.submitted_at,
                  status: rfq.status,
                }}
                canManage={canManage}
                canDelete={canDelete}
                hasQuote={Boolean(quote)}
                canQuote={canQuote}
              />
            ) : null}
          </>
        }
      />

      {query.convertError ? (
        <AdminFieldError>{query.convertError}</AdminFieldError>
      ) : null}
      {query.assetError ? (
        <AdminFieldError>{query.assetError}</AdminFieldError>
      ) : null}
      {query.infoError ? (
        <AdminFieldError>{query.infoError}</AdminFieldError>
      ) : null}
      {query.infoLink ? (
        <AdminHelpText>
          Customer information link (copy now — token is not stored in plain
          text):{" "}
          <code>
            {typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
              ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
              : ""}
            {query.infoLink}
          </code>
        </AdminHelpText>
      ) : null}

      <AdminTabs items={[...RFQ_SECTION_TABS]} activeId="" />

      <div className="admin-detail-layout admin-detail-layout--with-aside">
        <div className="admin-rfq-detail__main">
      <div className="admin-rfq-detail__grid" id="rfq-overview">
        <AdminPanel title="Customer">
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
            <AdminHelpText>
              Linked customer:{" "}
              <Link href={`/admin/customers/${customer.id}/`}>
                {customer.name}
              </Link>
            </AdminHelpText>
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
        </AdminPanel>

        <AdminPanel title="Project">
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
        </AdminPanel>

        <AdminPanel
          id="rfq-assets"
          title="Assets & measurements"
          description={
            isSimpleLead
              ? "Simple public quotes start without assets. Enrich when more detail arrives."
              : "Public calculations are provisional. Confirm before quoting."
          }
        >
          {isSimpleLead ? (
            <AdminEmptyState
              title="No structured assets yet — this is a valid simple enquiry."
              description={`Soft estimates (not confirmed): area ${rfq.estimated_area_m2 ?? "—"} m² · capacity ${rfq.estimated_capacity_kl ?? "—"} kL · diameter ${rfq.estimated_diameter_m ?? "—"} m · height ${rfq.estimated_height_m ?? "—"} m`}
            >
              {rfq.simple_service_fields &&
              Object.keys(rfq.simple_service_fields as object).length ? (
                <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(rfq.simple_service_fields, null, 2)}
                </pre>
              ) : null}
              {canManage ? (
                <>
                  <AdminButton href="#rfq-info-request" variant="secondary">
                    Request more information
                  </AdminButton>
                  <AdminButton href="#rfq-site-measurement" variant="secondary">
                    Schedule / mark site measurement
                  </AdminButton>
                </>
              ) : null}
            </AdminEmptyState>
          ) : (
            <RfqAssetReviewPanels
              assets={assetRows}
              attachments={signedAttachments}
              canManage={canManage}
            />
          )}
        </AdminPanel>

        <CalculatorResultsPanel
          calculatorType={rfq.calculator_type}
          inputs={rfq.calculator_input as Record<string, unknown> | null}
          results={rfq.calculator_result as Record<string, unknown> | null}
        />

        <AdminPanel id="rfq-attachments" title="Attachments">
          {signedAttachments.length === 0 ? (
            <AdminEmptyState title="No attachments." />
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
        </AdminPanel>

        {canManage ? (
          <AdminPanel title="Status, assignment & close">
            <form action={updateRfqStatusAction} className="admin-inline-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminSelect name="status" defaultValue={rfq.status}>
                {RFQ_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </AdminSelect>
              <AdminButton type="submit" variant="primary">
                Update status
              </AdminButton>
            </form>
            <form action={assignRfqAction} className="admin-inline-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminSelect
                name="assignedTo"
                defaultValue={rfq.assigned_to ?? ""}
              >
                <option value="">Unassigned</option>
                {(staff ?? []).map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </AdminSelect>
              <AdminButton type="submit" variant="secondary">
                Assign estimator
              </AdminButton>
            </form>
            <div className="admin-panel__actions">
              <form action={updateRfqStatusAction}>
                <input type="hidden" name="rfqId" value={rfq.id} />
                <input type="hidden" name="status" value="spam" />
                <AdminButton type="submit" variant="secondary">
                  Mark spam
                </AdminButton>
              </form>
              <form action={updateRfqStatusAction}>
                <input type="hidden" name="rfqId" value={rfq.id} />
                <input type="hidden" name="status" value="closed" />
                <AdminButton type="submit" variant="secondary">
                  Close RFQ
                </AdminButton>
              </form>
            </div>
          </AdminPanel>
        ) : null}

        {canManage ? (
          <AdminPanel id="rfq-info-request" title="Request more information">
            <form action={createInfoRequestAction} className="admin-stack-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminSelect name="assetId" defaultValue="">
                <option value="">All assets</option>
                {assetRows.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_name}
                  </option>
                ))}
              </AdminSelect>
              <div className="admin-checkbox-grid">
                {INFO_REQUEST_FIELDS.map((field) => (
                  <AdminCheckbox
                    key={field.id}
                    name="fields"
                    value={field.id}
                    label={field.label}
                  />
                ))}
              </div>
              <AdminTextarea
                name="message"
                rows={3}
                placeholder="Message shown to the customer"
              />
              <AdminButton type="submit" variant="primary">
                Generate secure customer link
              </AdminButton>
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
          </AdminPanel>
        ) : null}

        {canManage ? (
          <AdminPanel id="rfq-site-measurement" title="Schedule site measurement">
            <form
              action={updateMeasurementScheduleAction}
              className="admin-stack-form"
            >
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminCheckbox
                name="siteMeasurementRequired"
                defaultChecked={Boolean(rfq.site_measurement_required)}
                label="Site measurement required"
              />
              <label>
                Proposed date
                <AdminDateInput
                  name="proposedDate"
                  defaultValue={rfq.measurement_proposed_date ?? ""}
                />
              </label>
              <label>
                Confirmed date
                <AdminDateInput
                  name="confirmedDate"
                  defaultValue={rfq.measurement_confirmed_date ?? ""}
                />
              </label>
              <label>
                Assigned employee
                <AdminSelect
                  name="assignedEmployeeId"
                  defaultValue={rfq.measurement_assigned_to ?? ""}
                >
                  <option value="">Unassigned</option>
                  {(staff ?? []).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name || person.email}
                    </option>
                  ))}
                </AdminSelect>
              </label>
              <label>
                Travel distance (km)
                <AdminInput
                  type="number"
                  step="any"
                  name="travelKm"
                  defaultValue={rfq.measurement_travel_km ?? ""}
                />
              </label>
              <AdminCheckbox
                name="customerConfirmed"
                defaultChecked={Boolean(rfq.measurement_customer_confirmed)}
                label="Customer confirmation received"
              />
              <AdminTextarea
                name="notes"
                rows={3}
                placeholder="Measurement notes"
                defaultValue={rfq.measurement_notes ?? ""}
              />
              <AdminButton type="submit" variant="secondary">
                Save measurement schedule
              </AdminButton>
            </form>
          </AdminPanel>
        ) : null}

        {canQuote ? (
        <AdminPanel
          id="rfq-prepare-quote"
          title="Prepare quote"
          description="Generates editable draft line suggestions. Does not send a quote. Lines without catalogue prices are flagged PRICE REQUIRED — approval is blocked until resolved."
        >
            {previewSuggestions.length ? (
              <AdminTable caption="Quote line suggestions">
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
                            <AdminFieldError>PRICE REQUIRED</AdminFieldError>
                          ) : (
                            line.sellUnitPrice
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </AdminTable>
            ) : (
              <AdminHelpText>No asset-based suggestions yet.</AdminHelpText>
            )}
            <form action={convertRfqAction} className="admin-stack-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminCheckbox
                name="allowUnconfirmed"
                value="1"
                label="Explicitly allow unconfirmed assets"
              />
              <AdminCheckbox
                name="acknowledgeSiteMeasurement"
                value="1"
                label="Acknowledge unresolved site-measurement requirements"
              />
              <AdminButton type="submit" variant="primary">
                Prepare quote / convert to draft
              </AdminButton>
            </form>
            {rfq.status === "converted" ? (
              <form action={convertRfqAction} className="admin-inline-form">
                <input type="hidden" name="rfqId" value={rfq.id} />
                <input type="hidden" name="forceSecond" value="1" />
                <input type="hidden" name="allowUnconfirmed" value="1" />
                <input type="hidden" name="acknowledgeSiteMeasurement" value="1" />
                <AdminButton type="submit" variant="secondary">
                  Create additional quotation deliberately
                </AdminButton>
              </form>
            ) : null}
            <p className="admin-disclaimer">{HDPE_DISCLAIMER}</p>
          </AdminPanel>
        ) : null}

        <AdminPanel id="rfq-communication" title="Notifications">
          {(communications ?? []).length === 0 ? (
            <AdminEmptyState
              title="No notification attempts recorded yet."
              compact
            />
          ) : (
            <ul className="admin-list">
              {(communications ?? []).map((row) => (
                <li key={row.id}>
                  {row.communication_type} · {row.status}
                  {row.recipient ? ` · ${row.recipient}` : ""} ·{" "}
                  {new Date(row.created_at).toLocaleString("en-ZA")}
                  {row.provider_error ? ` · ${row.provider_error}` : ""}
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Internal notes">
          <pre className="admin-notes">{rfq.internal_notes || "No notes yet."}</pre>
          {canManage ? (
            <form action={addRfqNoteAction} className="admin-stack-form">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <AdminTextarea name="note" rows={3} required />
              <AdminButton type="submit" variant="primary">
                Add note
              </AdminButton>
            </form>
          ) : null}
        </AdminPanel>

        <AdminPanel id="rfq-activity" title="Timeline">
          {(events ?? []).length === 0 ? (
            <AdminEmptyState title="No events yet." />
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
        </AdminPanel>
      </div>
        </div>

        <aside className="admin-detail-aside" aria-label="RFQ actions">
          <AdminPanel title="Workflow" compact>
            <dl className="admin-dl">
              <div>
                <dt>Status</dt>
                <dd>
                  <AdminStatusBadge status={rfq.status} domain="rfq" />
                </dd>
              </div>
              <div>
                <dt>Assigned estimator</dt>
                <dd>
                  {assignee
                    ? assignee.full_name || assignee.email
                    : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt>Measurement required</dt>
                <dd>
                  {rfq.site_measurement_required ||
                  rfq.status === "site_measurement_required"
                    ? "Yes"
                    : "No"}
                </dd>
              </div>
              <div>
                <dt>Conversion readiness</dt>
                <dd>
                  {quote
                    ? "Already converted"
                    : rfq.status === "ready_for_quote"
                      ? "Ready for quote"
                      : "Needs review"}
                </dd>
              </div>
            </dl>
            <div className="admin-panel__actions" style={{ marginTop: "0.85rem" }}>
              {canManage ? (
                <AdminButton href="#rfq-info-request" size="sm" variant="secondary">
                  Request information
                </AdminButton>
              ) : null}
              {canManage ? (
                <AdminButton
                  href="#rfq-site-measurement"
                  size="sm"
                  variant="secondary"
                >
                  Schedule measurement
                </AdminButton>
              ) : null}
              {canQuote && !quote ? (
                <AdminButton href="#rfq-prepare-quote" size="sm" variant="primary">
                  Convert to quote
                </AdminButton>
              ) : null}
            </div>
          </AdminPanel>
        </aside>
      </div>
    </div>
  );
}
