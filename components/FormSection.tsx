"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import {
  clearQuotePrefill,
  peekQuotePrefill,
  type QuotePrefill,
} from "@/lib/calculator-rfq-prefill";
import { PROVINCE_OPTIONS, SERVICE_OPTIONS } from "@/lib/form";
import { phoneTel, siteConfig, whatsAppUrl } from "@/lib/site";

type FormSectionProps = {
  title: string;
  subtitle?: string;
  sourcePage: string;
  submitLabel?: string;
  id?: string;
  /** When true, apply calculator RFQ prefill from sessionStorage (quote page). */
  applyCalculatorPrefill?: boolean;
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

function loadPrefill(enabled: boolean): QuotePrefill | null {
  if (!enabled || typeof window === "undefined") return null;
  return peekQuotePrefill();
}

export function FormSection({
  title,
  subtitle,
  sourcePage,
  submitLabel = "Request a Free Quote",
  id = "request-quote-form",
  applyCalculatorPrefill = false,
}: FormSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prefill] = useState<QuotePrefill | null>(() =>
    loadPrefill(applyCalculatorPrefill),
  );

  useEffect(() => {
    if (applyCalculatorPrefill && prefill) {
      clearQuotePrefill();
    }
  }, [applyCalculatorPrefill, prefill]);

  const hasOptionalPrefill = Boolean(
    prefill?.company ||
      prefill?.province ||
      prefill?.projectSize ||
      prefill?.projectLocation,
  );

  const prefillBanner = useMemo(() => {
    if (!prefill) return null;
    return `Details from the ${prefill.sourceCalculatorName} have been added below. Review and complete your contact details before sending.`;
  }, [prefill]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await submitLead(formData, sourcePage);

      if (result.success) {
        router.push("/thank-you");
        return;
      }

      setError(result.error);
    });
  }

  return (
    <div className="site-form-card relative">
      <h2 className="section-heading !mt-0">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600">
        We typically respond within one business day.
      </p>

      {prefillBanner ? (
        <p
          className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-navy"
          role="status"
        >
          {prefillBanner}
        </p>
      ) : null}

      <form
        id={id}
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
        noValidate
      >
        {/* Honeypot — leave empty. Bots that fill it are marked spam. */}
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
        {prefill?.calculatorJson ? (
          <input
            type="hidden"
            name="calculatorJson"
            value={prefill.calculatorJson}
          />
        ) : null}

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

        <Field id={`${id}-service`} label="Service required" required>
          <select
            id={`${id}-service`}
            required
            name="serviceRequired"
            className="form-input"
            disabled={isPending}
            defaultValue={prefill?.serviceRequired ?? ""}
          >
            <option value="" disabled>
              Select a service
            </option>
            {SERVICE_OPTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={`${id}-message`}
          label="Message / project description"
          required
          hint="Dimensions, site access, timeline, photos — anything that helps us quote accurately."
        >
          <textarea
            id={`${id}-message`}
            name="message"
            required
            rows={prefill?.message ? 8 : 4}
            placeholder="Describe your dam, tank or waterproofing requirements."
            className="form-input"
            disabled={isPending}
            defaultValue={prefill?.message ?? ""}
          />
        </Field>

        <details
          className="group rounded-2xl border border-slate-200 bg-slate-50 open:bg-white open:shadow-sm"
          open={hasOptionalPrefill || undefined}
        >
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span>Optional project details</span>
              <span className="text-sm font-normal text-subtle group-open:hidden">
                Company, province, size, location
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
                defaultValue={prefill?.company ?? ""}
              />
            </Field>

            <Field id={`${id}-province`} label="Province">
              <select
                id={`${id}-province`}
                name="province"
                className="form-input"
                disabled={isPending}
                defaultValue={prefill?.province ?? ""}
              >
                <option value="">Select province</option>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </Field>

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
                  defaultValue={prefill?.projectSize ?? ""}
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
                  defaultValue={prefill?.projectLocation ?? ""}
                />
              </Field>
            </div>
          </div>
        </details>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-subtle">
          Your details are only used to respond to your enquiry.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            className="btn-primary min-h-11 w-full sm:w-auto disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Sending…" : submitLabel}
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
