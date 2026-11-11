"use client";

import { useRef, useState, useTransition } from "react";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import {
  bookCourierAction,
  courierRatesAction,
  refreshCourierTrackingAction,
  type CourierActionResult,
} from "@/app/admin/orders/courier-actions";

type Props = {
  orderId: string;
  orderReference: string;
  trackingNumber: string | null;
  /** Why booking is not offered (collection, unpaid, cancelled), if any. */
  blockedReason: string | null;
  /** Packed size and weight worked out for the product, to pre-fill the form. */
  defaultParcel?: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number } | null;
};

const rand = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

function formatDay(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

function formatEventTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" });
}

export function CourierBookingPanel({ orderId, orderReference, trackingNumber, blockedReason, defaultParcel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CourierActionResult | null>(null);
  const [service, setService] = useState("");

  const run = (action: (formData: FormData) => Promise<CourierActionResult>, extra: Record<string, string> = {}) => {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    const formData = new FormData(form);
    for (const [key, value] of Object.entries(extra)) formData.set(key, value);
    startTransition(async () => {
      const next = await action(formData);
      // Keep the rate list on screen when a booking attempt fails.
      setResult((previous) => (next.rates || next.ok ? next : { ...next, rates: previous?.rates }));
    });
  };

  const message = result ? (
    <p
      className={`admin-action-message admin-action-message--${result.ok ? "success" : "error"}`}
      role={result.ok ? "status" : "alert"}
    >
      {result.message}
    </p>
  ) : null;

  if (trackingNumber) {
    return (
      <form ref={formRef} className="ops-courier" onSubmit={(event) => event.preventDefault()}>
        <input type="hidden" name="id" value={orderId} />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={pending}
          onClick={() => run(refreshCourierTrackingAction)}
        >
          {pending ? "Checking…" : "Refresh tracking from The Courier Guy"}
        </button>
        {message}
        {result?.events && result.events.length > 0 ? (
          <ol className="admin-timeline">
            {result.events.map((event, index) => (
              <li key={`${event.date}-${index}`}>
                <strong>{event.message || event.status}</strong>
                <span className="admin-muted">
                  {" "}
                  · {formatEventTime(event.date)}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </form>
    );
  }

  if (blockedReason) return <p className="admin-empty__hint">{blockedReason}</p>;

  const rates = result?.rates ?? [];
  const chosen = rates.find((rate) => rate.serviceCode === service);

  return (
    <form ref={formRef} className="ops-courier" onSubmit={(event) => event.preventDefault()}>
      <input type="hidden" name="id" value={orderId} />
      <div className="ops-track-form">
        {[
          ["length_cm", "Packed length (cm)", defaultParcel?.lengthCm],
          ["width_cm", "Packed width (cm)", defaultParcel?.widthCm],
          ["height_cm", "Packed height (cm)", defaultParcel?.heightCm],
          ["weight_kg", "Packed weight (kg)", defaultParcel?.weightKg],
        ].map(([name, label, value]) => (
          <label key={name}>
            <span>{label}</span>
            <AdminInput
              name={String(name)}
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              defaultValue={value ?? ""}
              required
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={pending}
        onClick={() => {
          setService("");
          run(courierRatesAction);
        }}
      >
        {pending ? "Working…" : "Get Courier Guy rates"}
      </button>
      {message}
      {rates.length > 0 ? (
        <fieldset className="ops-courier__rates">
          <legend>Choose a service</legend>
          {rates.map((rate) => (
            <label key={rate.serviceCode}>
              <input
                type="radio"
                name="service_choice"
                value={rate.serviceCode}
                checked={service === rate.serviceCode}
                onChange={() => setService(rate.serviceCode)}
              />
              <span>
                <strong>{rate.serviceName}</strong> ({rate.serviceCode})
                {rate.deliveryTo ? ` · delivery by ${formatDay(rate.deliveryTo)}` : ""}
              </span>
              <span className="ops-courier__price">{rand.format(rate.rate)}</span>
            </label>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={pending || !chosen}
            onClick={() => {
              if (!chosen) return;
              const ok = window.confirm(
                `Book ${chosen.serviceName} with The Courier Guy for order ${orderReference} at ${rand.format(chosen.rate)}? This is a real booking on your Courier Guy account.`,
              );
              if (!ok) return;
              run(bookCourierAction, {
                service_code: chosen.serviceCode,
                expected_delivery_on: chosen.deliveryTo ?? "",
              });
            }}
          >
            {pending ? "Booking…" : "Book collection"}
          </button>
        </fieldset>
      ) : null}
    </form>
  );
}
