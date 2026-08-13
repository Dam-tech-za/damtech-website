"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { submitSimpleQuote } from "@/app/actions/submit-simple-quote";
import { BeginInvoiceRequestAnalytics } from "@/components/catalogue/CatalogueAnalytics";
import { RfqProductSummary } from "@/components/catalogue/RfqProductSummary";
import { pushCatalogueAnalytics } from "@/components/catalogue/pushCatalogueAnalytics";
import {
  buildCatalogueAnalyticsFromLine,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import {
  parseCatalogueQuantity,
  type CatalogueLineSnapshot,
} from "@/lib/catalogue";
import {
  MATERIAL_PREFERENCE_OPTIONS,
  PROVINCE_OPTIONS,
  SERVICE_OPTIONS,
  TIMEFRAME_OPTIONS,
} from "@/lib/form";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

type SimpleQuoteFormProps = {
  title?: string;
  subtitle?: string;
  sourcePage?: string;
  submitLabel?: string;
  id?: string;
  catalogueLine?: CatalogueLineSnapshot | null;
};

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function pushQuoteAnalytics(
  rfqNumber: string,
  catalogueLine?: CatalogueLineSnapshot | null,
) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: CATALOGUE_ANALYTICS_EVENTS.rfqSubmitted,
    rfq_channel: catalogueLine
      ? "catalogue_invoice_request"
      : "simple_public_rfq",
    rfq_number: rfqNumber,
  });
  if (catalogueLine) {
    const item = buildCatalogueAnalyticsFromLine(catalogueLine);
    pushCatalogueAnalytics(CATALOGUE_ANALYTICS_EVENTS.generateLead, item, {
      rfq_number: rfqNumber,
    });
  }
}

export function SimpleQuoteForm({
  title = "Request Your Free Quote",
  subtitle = "Tell us about your project and we will respond within one business day.",
  sourcePage = "/quote",
  submitLabel = "Request a Free Quote",
  id = "simple-quote-form",
  catalogueLine = null,
}: SimpleQuoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState(catalogueLine?.rfqService ?? "");
  const [formStartedAt] = useState(() => Date.now());
  const [submissionId] = useState(() => crypto.randomUUID());
  const isInvoiceRequest = Boolean(catalogueLine);

  const serviceHints = useMemo(() => {
    const lining =
      service.includes("liner") ||
      service === "Dam leak repair" ||
      service === "Reservoir repair";
    const tank = service === "Steel water tank";
    const waterproof = service === "Bitumen waterproofing";
    return { lining, tank, waterproof };
  }, [service]);

  useEffect(() => {
    // Soft timing signal for bots completing instantly — checked server-side optionally later.
    void formStartedAt;
  }, [formStartedAt]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await submitSimpleQuote(formData, sourcePage);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const submittedLine =
        catalogueLine
          ? {
              ...catalogueLine,
              quantity: parseCatalogueQuantity(
                String(formData.get("quantity") ?? catalogueLine.quantity),
              ),
            }
          : null;
      pushQuoteAnalytics(result.rfqNumber, submittedLine);
      const params = new URLSearchParams({
        ref: result.rfqNumber,
        upload: result.uploadToken,
      });
      if (isInvoiceRequest) params.set("flow", "invoice");
      router.push(`/quote/success/?${params.toString()}`);
    });
  }

  return (
    <div className="site-form-card relative">
      {catalogueLine ? (
        <BeginInvoiceRequestAnalytics line={catalogueLine} />
      ) : null}
      <h2 className="section-heading !mt-0">
        {isInvoiceRequest ? "Request an invoice" : title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
        {isInvoiceRequest
          ? "Add this fixed-price supply-only kit to your RFQ. Damtech will confirm transport and send an invoice."
          : subtitle}
      </p>
      {isInvoiceRequest ? null : (
        <p className="mt-2 text-sm text-slate-600">
          You do not need exact measurements — approximate details are enough to
          start.
        </p>
      )}

      <form
        id={id}
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
        noValidate
      >
        <input type="hidden" name="submissionId" value={submissionId} />
        <input type="hidden" name="formStartedAt" value={String(formStartedAt)} />
        <div
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor={`${id}-website`}>Website</label>
          <input
            id={`${id}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <Field id={`${id}-name`} label="Name" required>
          <input
            id={`${id}-name`}
            required
            name="name"
            type="text"
            autoComplete="name"
            className="form-input"
            disabled={isPending}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id={`${id}-email`} label="Email">
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              className="form-input"
              disabled={isPending}
            />
          </Field>
          <Field id={`${id}-phone`} label="Phone">
            <input
              id={`${id}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              className="form-input"
              disabled={isPending}
            />
          </Field>
        </div>
        <p className="text-xs text-subtle">
          Provide at least one of email or phone so we can respond.
        </p>

        {catalogueLine ? <RfqProductSummary line={catalogueLine} /> : null}

        <Field id={`${id}-service`} label="Service required" required>
          {catalogueLine ? (
            <>
              <input
                type="hidden"
                name="serviceRequired"
                value={catalogueLine.rfqService}
              />
              <input
                id={`${id}-service`}
                className="form-input bg-slate-50"
                value={catalogueLine.rfqService}
                readOnly
                aria-readonly="true"
              />
            </>
          ) : (
            <select
              id={`${id}-service`}
              required
              name="serviceRequired"
              className="form-input"
              disabled={isPending}
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="" disabled>
                Select a service
              </option>
              {SERVICE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </Field>

        {isInvoiceRequest ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={`${id}-province`} label="Province" required>
              <select
                id={`${id}-province`}
                name="province"
                className="form-input"
                required
                disabled={isPending}
                defaultValue=""
              >
                <option value="" disabled>
                  Select province
                </option>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={`${id}-town`} label="Town / project location" required>
              <input
                id={`${id}-town`}
                name="town"
                type="text"
                required
                placeholder="Town or nearest town"
                className="form-input"
                disabled={isPending}
              />
            </Field>
          </div>
        ) : null}

        {isInvoiceRequest ? (
          <Field
            id={`${id}-delivery`}
            label="Delivery address or delivery location"
            required
            hint="Needed so Damtech can calculate transport. Transport is excluded from the kit price."
          >
            <textarea
              id={`${id}-delivery`}
              name="deliveryAddress"
              required
              rows={3}
              placeholder="Farm name, street, GPS or site access notes"
              className="form-input"
              disabled={isPending}
            />
          </Field>
        ) : null}

        <Field
          id={`${id}-message`}
          label="Message / project description"
          required
          hint="Site access, timing, known issues — anything that helps us prepare a quote."
        >
          <textarea
            id={`${id}-message`}
            name="message"
            required
            rows={4}
            defaultValue={
              isInvoiceRequest
                ? "Please confirm transport and send an invoice for this supply-only kit. Installation is not included unless quoted separately."
                : undefined
            }
            placeholder="Describe your dam, tank or waterproofing requirements."
            className="form-input"
            disabled={isPending}
          />
        </Field>

        <details className="group rounded-2xl border border-slate-200 bg-slate-50 open:bg-white open:shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span>Optional project details</span>
              <span className="text-sm font-normal text-subtle group-open:hidden">
                Company, size, location, timeframe
              </span>
              <span className="hidden text-sm font-normal text-subtle group-open:inline">
                Hide details
              </span>
            </span>
          </summary>
          <div className="space-y-6 border-t border-slate-200 px-5 py-5">
            <Field id={`${id}-company`} label="Company / farm / organisation">
              <input
                id={`${id}-company`}
                name="company"
                type="text"
                autoComplete="organization"
                className="form-input"
                disabled={isPending}
              />
            </Field>

            {isInvoiceRequest ? null : (
              <Field id={`${id}-province`} label="Province">
                <select
                  id={`${id}-province`}
                  name="province"
                  className="form-input"
                  disabled={isPending}
                  defaultValue=""
                >
                  <option value="">Select province</option>
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {isInvoiceRequest ? null : (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id={`${id}-size`}
                label="Approximate dam / tank / project size"
              >
                <input
                  id={`${id}-size`}
                  name="projectSize"
                  type="text"
                  placeholder="e.g. 5 000 m² liner or 250 kL tank"
                  className="form-input"
                  disabled={isPending}
                />
              </Field>
              <Field id={`${id}-location`} label="Project location">
                <input
                  id={`${id}-location`}
                  name="projectLocation"
                  type="text"
                  placeholder="Town, district or farm name"
                  className="form-input"
                  disabled={isPending}
                />
              </Field>
            </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id={`${id}-material`} label="Material preference">
                <select
                  id={`${id}-material`}
                  name="materialPreference"
                  className="form-input"
                  disabled={isPending}
                  defaultValue=""
                >
                  <option value="">Not sure yet</option>
                  {MATERIAL_PREFERENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              {isInvoiceRequest ? null : (
              <Field id={`${id}-assets`} label="Approximate number of dams / tanks">
                <input
                  id={`${id}-assets`}
                  name="numberOfAssetsEstimate"
                  type="number"
                  min={1}
                  max={999}
                  step={1}
                  className="form-input"
                  disabled={isPending}
                />
              </Field>
              )}
            </div>

            <Field id={`${id}-timeframe`} label="Preferred timeframe">
              <select
                id={`${id}-timeframe`}
                name="preferredTimeframe"
                className="form-input"
                disabled={isPending}
                defaultValue=""
              >
                <option value="">Select timeframe</option>
                {TIMEFRAME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            {serviceHints.lining ? (
              <div className="grid gap-6 sm:grid-cols-3">
                <Field id={`${id}-dam-type`} label="Dam / reservoir type">
                  <input
                    id={`${id}-dam-type`}
                    name="damType"
                    type="text"
                    placeholder="Earth dam, concrete, etc."
                    className="form-input"
                    disabled={isPending}
                  />
                </Field>
                <Field id={`${id}-lining-area`} label="Approx lining area">
                  <input
                    id={`${id}-lining-area`}
                    name="liningAreaValue"
                    type="text"
                    className="form-input"
                    disabled={isPending}
                  />
                </Field>
                <Field id={`${id}-lining-unit`} label="Area unit">
                  <select
                    id={`${id}-lining-unit`}
                    name="liningAreaUnit"
                    className="form-input"
                    disabled={isPending}
                    defaultValue="m2"
                  >
                    <option value="m2">m²</option>
                    <option value="ha">ha</option>
                  </select>
                </Field>
              </div>
            ) : null}

            {serviceHints.tank ? (
              <Field id={`${id}-tank-kl`} label="Approx tank capacity (kL)">
                <input
                  id={`${id}-tank-kl`}
                  name="tankCapacityKl"
                  type="text"
                  placeholder="e.g. 250"
                  className="form-input"
                  disabled={isPending}
                />
              </Field>
            ) : null}

            {serviceHints.waterproof ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id={`${id}-wp-area`} label="Approx waterproofing area (m²)">
                  <input
                    id={`${id}-wp-area`}
                    name="waterproofingAreaM2"
                    type="text"
                    className="form-input"
                    disabled={isPending}
                  />
                </Field>
                <Field id={`${id}-surface`} label="Surface type">
                  <input
                    id={`${id}-surface`}
                    name="surfaceType"
                    type="text"
                    placeholder="Roof, foundation, podium…"
                    className="form-input"
                    disabled={isPending}
                  />
                </Field>
              </div>
            ) : null}

            <p className="text-xs text-subtle">
              After you submit, you can optionally upload photos or drawings from
              the confirmation page.
            </p>
          </div>
        </details>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-subtle">
          Your details are only used to respond to your enquiry. Exact site
          measurements are confirmed later by Damtech — you do not need them to
          request a quote.{" "}
          <Link
            href="/calculators/#project-budget"
            className="underline hover:text-navy"
          >
            Or request a detailed quote
          </Link>
          .
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            className="btn-primary min-h-11 w-full sm:w-auto disabled:opacity-60"
            disabled={isPending}
          >
            {isPending
              ? "Submitting..."
              : isInvoiceRequest
                ? "Submit invoice request"
                : submitLabel}
          </button>
          <p className="text-sm text-slate-600">
            Or call{" "}
            <a
              href={`tel:${phoneTel}`}
              className="font-semibold text-water hover:text-navy"
            >
              {siteConfig.phone}
            </a>
            {" · "}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-water hover:text-navy"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
