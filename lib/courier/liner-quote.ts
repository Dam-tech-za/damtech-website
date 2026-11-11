/**
 * Ad-hoc courier quotes for custom liners (WhatsApp / RFQ jobs, no shop order).
 * Pure helpers: turn the admin's job into the order shape the existing Courier
 * Guy client already understands, and build the WhatsApp summary, the brief
 * for the Courier Guy portal and the Damtech quotation line.
 */

import { COURIER_MAX_DECLARED_VALUE, type ParcelInput } from "./payloads.ts";
import type { CourierOrderInput, CourierRate } from "./types.ts";
import type { QuoteLineInput } from "../quotes/types.ts";

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export const COURIER_PORTAL_URL = "https://portal.thecourierguy.co.za/";
/** Marks the quotation line this tool wrote, so it is replaced rather than duplicated. */
export const LINER_COURIER_LINE_SOURCE = "liner-courier";
const VAT_RATE = 15;

export type LinerCourierJob = {
  reference: string;
  customerName: string;
  companyName?: string;
  phone: string;
  email: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  /** Parcel description, e.g. "550 gsm PVC liner 5 m x 2.19 m". */
  description: string;
  declaredValue: number;
  notes?: string;
};

export type JobCheck = { ok: true } | { ok: false; error: string };

export function checkJob(job: LinerCourierJob): JobCheck {
  const missing = (
    [
      ["customerName", "customer name"],
      ["phone", "phone"],
      ["street", "street address"],
      ["suburb", "suburb"],
      ["city", "city or town"],
      ["postalCode", "postal code"],
    ] as const
  )
    .filter(([key]) => !String(job[key] ?? "").trim())
    .map(([, label]) => label);
  if (missing.length > 0) return { ok: false, error: `Enter the ${missing.join(", ")}.` };
  if (!(SA_PROVINCES as readonly string[]).includes(job.province)) return { ok: false, error: "Choose the province." };
  if (!/^\d{4}$/.test(job.postalCode.trim())) return { ok: false, error: "The postal code must be 4 digits." };
  return { ok: true };
}

/** Declared value as sent to the courier (capped), and whether it was capped. */
export function declaredValueFor(value: number): { value: number; capped: boolean } {
  const clean = Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0;
  return { value: Math.min(clean, COURIER_MAX_DECLARED_VALUE), capped: clean > COURIER_MAX_DECLARED_VALUE };
}

/**
 * The job in the shape getCourierRates / buildRatesPayload take, so the same
 * client and payload code serves shop orders and ad-hoc quotes.
 */
export function linerJobAsCourierOrder(job: LinerCourierJob): CourierOrderInput {
  return {
    order_reference: job.reference.trim() || "liner-quote",
    customer_name: job.customerName.trim(),
    business_name: job.companyName?.trim() || null,
    customer_type: job.companyName?.trim() ? "business" : "individual",
    email: job.email.trim(),
    phone: job.phone.trim(),
    billing_line1: job.street.trim(),
    billing_line2: null,
    billing_suburb: job.suburb.trim(),
    billing_city: job.city.trim(),
    billing_province: job.province,
    billing_postal_code: job.postalCode.trim(),
    product_name_snapshot: job.description.trim() || "Made-up PVC liner",
    total_price_snapshot: declaredValueFor(job.declaredValue).value,
    notes: job.notes?.trim() || null,
  };
}

/** One parcel per liner, the same as online checkout does for quantity > 1. */
export function parcelsForQuantity(parcel: ParcelInput, quantity: number): ParcelInput[] {
  const count = Math.min(20, Math.max(1, Math.floor(quantity) || 1));
  return Array.from({ length: count }, () => ({ ...parcel }));
}

/** R1 234.56: fixed format so pasted text reads the same on every device. */
export const formatRand = (n: number) => `R${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
const money = formatRand;
const roundMoney = (n: number) => Math.round(n * 100) / 100;

/** Rate excl. VAT: the courier's own figure when it gives one, else incl. ÷ 1.15. */
export function rateExVat(rate: Pick<CourierRate, "rate" | "rateExVat">): { exVat: number; stated: boolean } {
  if (typeof rate.rateExVat === "number" && Number.isFinite(rate.rateExVat)) {
    return { exVat: roundMoney(rate.rateExVat), stated: true };
  }
  return { exVat: roundMoney(rate.rate / (1 + VAT_RATE / 100)), stated: false };
}

export function parcelLabel(parcel: ParcelInput, quantity = 1): string {
  const one = `${parcel.lengthCm}×${parcel.widthCm}×${parcel.heightCm} cm, ${parcel.weightKg} kg`;
  return quantity > 1 ? `${quantity} × (${one})` : one;
}

export type CourierSummaryInput = {
  areaM2: number;
  gsm: number;
  parcel: ParcelInput;
  quantity: number;
  depotLabel: string;
  city: string;
  rate?: Pick<CourierRate, "serviceName" | "rate" | "rateExVat"> | null;
};

/** One line the admin can paste into WhatsApp. */
export function buildWhatsAppSummary(input: CourierSummaryInput): string {
  const base = `${input.quantity > 1 ? `${input.quantity} × ` : ""}${input.gsm} gsm PVC liner (${input.areaM2} m²) · ${parcelLabel(input.parcel, input.quantity)} · ${input.depotLabel} → ${input.city}`;
  if (!input.rate) return base;
  return `${base} · The Courier Guy ${input.rate.serviceName}: ${money(input.rate.rate)} incl. VAT`;
}

export type QuoteBriefInput = CourierSummaryInput & {
  job: LinerCourierJob;
  collection: string;
};

/**
 * Plain-text brief to paste into the Courier Guy portal or an email to the
 * account manager. It is a request for a quote, not a booking.
 */
export function buildCourierQuoteBrief(input: QuoteBriefInput): string {
  const { job } = input;
  const declared = declaredValueFor(job.declaredValue);
  const lines = [
    `Quote request — ${job.reference.trim() || "Damtech liner"} (please quote, do not book yet)`,
    "",
    `Collect from: ${input.collection}`,
    `Deliver to: ${[job.companyName, job.customerName].filter(Boolean).join(", ")}`,
    `  ${job.street}, ${job.suburb}, ${job.city}, ${job.province}, ${job.postalCode}`,
    `  ${job.phone}${job.email ? ` · ${job.email}` : ""}`,
    "",
    `Goods: ${job.description || "Made-up PVC liner"} (folded, wrapped)`,
    `Parcels: ${parcelLabel(input.parcel, input.quantity)}`,
    `Declared value: ${declared.value > 0 ? money(declared.value) : "none"}${declared.capped ? " (capped at R30 000)" : ""}`,
  ];
  if (input.rate) lines.push(`Online rate seen: ${input.rate.serviceName} ${money(input.rate.rate)} incl. VAT`);
  if (job.notes?.trim()) lines.push(`Notes: ${job.notes.trim()}`);
  return lines.join("\n");
}

export type CourierQuoteLineInput = {
  rate: Pick<CourierRate, "serviceName" | "serviceCode" | "rate" | "rateExVat">;
  parcel: ParcelInput;
  quantity: number;
  depotLabel: string;
  city: string;
  /** Markup on cost, %. Ignored when sellExVat is given. */
  markupPercent?: number;
  /** Admin-entered sell price excl. VAT. */
  sellExVat?: number | null;
  courierQuoteId?: string | null;
};

/** Quotation line for the courier cost: cost = courier rate excl. VAT, sell = cost + markup (or as entered). */
export function buildCourierQuoteLine(input: CourierQuoteLineInput, sortOrder: number): QuoteLineInput {
  const { exVat, stated } = rateExVat(input.rate);
  const sell =
    typeof input.sellExVat === "number" && Number.isFinite(input.sellExVat) && input.sellExVat >= 0
      ? roundMoney(input.sellExVat)
      : roundMoney(exVat * (1 + Math.max(0, input.markupPercent ?? 0) / 100));
  return {
    sortOrder,
    lineType: "delivery",
    itemCode: null,
    category: "Delivery",
    description: `Courier delivery — The Courier Guy (${input.rate.serviceName}) · ${parcelLabel(input.parcel, input.quantity)} · ${input.depotLabel} → ${input.city}`,
    quantity: 1,
    unit: "each",
    costUnitPrice: exVat,
    sellUnitPrice: sell,
    discountPercent: 0,
    taxCategory: "standard",
    metadata: {
      source: LINER_COURIER_LINE_SOURCE,
      courierQuoteId: input.courierQuoteId ?? null,
      serviceCode: input.rate.serviceCode,
      rateInclVat: input.rate.rate,
      rateExVat: exVat,
      rateExVatStated: stated,
    },
  };
}

/**
 * The quotation's lines with this tool's courier line replaced (or added at
 * the end). Other lines are left exactly as they are.
 */
export function upsertCourierQuoteLine(lines: QuoteLineInput[], line: Omit<QuoteLineInput, "sortOrder">): QuoteLineInput[] {
  const index = lines.findIndex((existing) => existing.metadata?.source === LINER_COURIER_LINE_SOURCE);
  if (index >= 0) {
    return lines.map((existing, i) => (i === index ? { ...line, id: existing.id, sortOrder: existing.sortOrder } : existing));
  }
  const nextSort = lines.reduce((max, existing) => Math.max(max, existing.sortOrder), -1) + 1;
  return [...lines, { ...line, sortOrder: nextSort }];
}

/** Text for WhatsApp / manual paste when no quotation is linked. */
export function quoteLineCopyText(line: QuoteLineInput): string {
  return `${line.description}\nSell ${money(line.sellUnitPrice)} excl. VAT (${money(roundMoney(line.sellUnitPrice * (1 + VAT_RATE / 100)))} incl. VAT)`;
}

export function whatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}
