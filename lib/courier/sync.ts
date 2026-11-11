import { courierStatusLabel, trackingDates } from "./payloads.ts";
import type { CourierTracking, CourierTrackingEvent } from "./types.ts";

export type CourierStatusFields = {
  courier_status: string;
  courier_status_at: string | null;
  courier_last_message: string | null;
  courier_events: CourierTrackingEvent[];
  courier_checked_at: string;
  dispatched_on?: string;
  delivered_on?: string;
};

/** What to save on the order after a tracking check. Dates already set are kept. */
export function courierStatusFields(
  order: { dispatched_on?: string | null; delivered_on?: string | null },
  tracking: CourierTracking,
  nowIso: string,
): CourierStatusFields {
  const latest = tracking.events[0];
  const dates = trackingDates(tracking);
  const at = latest && !Number.isNaN(new Date(latest.date).getTime()) ? new Date(latest.date).toISOString() : null;
  return {
    courier_status: tracking.status || latest?.status || "unknown",
    courier_status_at: at,
    courier_last_message: (latest?.message || "").slice(0, 300) || null,
    courier_events: tracking.events.slice(0, 30),
    courier_checked_at: nowIso,
    ...(dates.dispatchedOn && !order.dispatched_on ? { dispatched_on: dates.dispatchedOn } : {}),
    ...(dates.deliveredOn && !order.delivered_on ? { delivered_on: dates.deliveredOn } : {}),
  };
}

/** Statuses after which there is nothing more to check. */
export function isCourierStatusFinal(status: string | null | undefined): boolean {
  return ["delivered", "cancelled", "returned-to-sender"].includes(String(status ?? ""));
}

export function courierStatusSummary(status: string | null | undefined, message: string | null | undefined): string {
  const label = status ? courierStatusLabel(status) : "";
  return [label, message && message.toLowerCase() !== label.toLowerCase() ? message : ""].filter(Boolean).join(": ");
}
