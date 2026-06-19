"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import { PROVINCE_OPTIONS, SERVICE_OPTIONS } from "@/lib/form";
import { phoneTel, siteConfig } from "@/lib/site";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-water focus:outline-none focus:ring-2 focus:ring-water/30";
const labelClass = "block text-sm font-medium text-slate-700";

type LeadFormProps = {
  id?: string;
  sourcePage: string;
  submitLabel?: string;
};

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
    <form id={id} onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Name <span className="text-red-600">*</span>
          <input
            required
            name="name"
            type="text"
            autoComplete="name"
            className={inputClass}
            disabled={isPending}
          />
        </label>
        <label className={labelClass}>
          Company / Farm / Organisation
          <input
            name="company"
            type="text"
            autoComplete="organization"
            className={inputClass}
            disabled={isPending}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Phone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
            disabled={isPending}
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            disabled={isPending}
          />
        </label>
      </div>

      <p className="text-xs text-slate-500">
        <span className="text-red-600">*</span> Provide at least one of phone or
        email so we can respond.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Province
          <select name="province" className={inputClass} disabled={isPending}>
            <option value="">Select province</option>
            {PROVINCE_OPTIONS.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Service required <span className="text-red-600">*</span>
          <select
            required
            name="serviceRequired"
            className={inputClass}
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
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Approximate dam / tank / project size
          <input
            name="projectSize"
            type="text"
            placeholder="e.g. 5 000 m² liner or 250 kL tank"
            className={inputClass}
            disabled={isPending}
          />
        </label>
        <label className={labelClass}>
          Project location
          <input
            name="projectLocation"
            type="text"
            placeholder="Town, district or farm name"
            className={inputClass}
            disabled={isPending}
          />
        </label>
      </div>

      <label className={labelClass}>
        Message / project description <span className="text-red-600">*</span>
        <textarea
          required
          name="message"
          rows={5}
          placeholder="Describe your dam, tank or waterproofing requirements, site access, and timeline."
          className={inputClass}
          disabled={isPending}
        />
      </label>

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Sending…" : submitLabel}
      </button>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}{" "}
          <span className="block mt-1 text-slate-600">
            Or call{" "}
            <a href={`tel:${phoneTel}`} className="font-semibold text-water">
              {siteConfig.phone}
            </a>
            .
          </span>
        </p>
      ) : null}
    </form>
  );
}
