"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import { PROVINCE_OPTIONS, SERVICE_OPTIONS } from "@/lib/form";
import { phoneTel, siteConfig } from "@/lib/site";

type LeadFormProps = {
  id?: string;
  sourcePage: string;
  submitLabel?: string;
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
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function LeadForm({
  id = "lead-form",
  sourcePage,
  submitLabel = "Submit Enquiry",
}: LeadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await submitLead(formData, sourcePage);

      if (result.success) {
        router.push("/thank-you/");
        return;
      }

      setError(result.error);
    });
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Field id="lead-name" label="Name" required>
          <input
            id="lead-name"
            required
            name="name"
            type="text"
            autoComplete="name"
            className="form-input"
            disabled={isPending}
          />
        </Field>
        <Field id="lead-company" label="Company / Farm / Organisation">
          <input
            id="lead-company"
            name="company"
            type="text"
            autoComplete="organization"
            className="form-input"
            disabled={isPending}
          />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field id="lead-phone" label="Phone">
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="form-input"
            disabled={isPending}
          />
        </Field>
        <Field id="lead-email" label="Email">
          <input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            className="form-input"
            disabled={isPending}
          />
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        Provide at least one of phone or email so we can respond.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Field id="lead-province" label="Province">
          <select
            id="lead-province"
            name="province"
            className="form-input"
            disabled={isPending}
          >
            <option value="">Select province</option>
            {PROVINCE_OPTIONS.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </Field>
        <Field id="lead-service" label="Service required" required>
          <select
            id="lead-service"
            required
            name="serviceRequired"
            className="form-input"
            disabled={isPending}
            defaultValue=""
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          id="lead-size"
          label="Approximate dam / tank / project size"
        >
          <input
            id="lead-size"
            name="projectSize"
            type="text"
            placeholder="e.g. 5 000 m² liner or 250 kL tank"
            className="form-input"
            disabled={isPending}
          />
        </Field>
        <Field id="lead-location" label="Project location">
          <input
            id="lead-location"
            name="projectLocation"
            type="text"
            placeholder="Town, district or farm name"
            className="form-input"
            disabled={isPending}
          />
        </Field>
      </div>

      <Field
        id="lead-message"
        label="Message / project description"
        required
      >
        <textarea
          id="lead-message"
          required
          name="message"
          rows={5}
          placeholder="Describe your dam, tank or waterproofing requirements, site access, and timeline."
          className="form-input"
          disabled={isPending}
        />
      </Field>

      {error ? (
        <p className="form-error" role="alert">
          {error}{" "}
          <span className="mt-1 block text-slate-600">
            Or call{" "}
            <a href={`tel:${phoneTel}`} className="font-semibold text-water">
              {siteConfig.phone}
            </a>
            .
          </span>
        </p>
      ) : null}

      <button
        type="submit"
        className="btn-primary w-full md:w-auto disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
