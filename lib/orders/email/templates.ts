import {
  catalogueDeliveryLeadTimeLabel,
  catalogueManufacturingLeadTimeLabel,
  catalogueTotalFulfilmentLeadTimeLabel,
} from "../../catalogue/availability.ts";
import { formatZarInclVat, formatZarNumber } from "../../catalogue/format.ts";
import { DELIVERY_FULFILMENT } from "../delivery.ts";
import type { PublicOrderFormInput } from "../schema.ts";
import type { OrderPriceSnapshot } from "../pricing.ts";

const CONTACT_PHONE = "+27 82 853 1026";
const CONTACT_EMAIL = "info@dam-tech.co.za";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const ORDER_PENDING_INVOICE_NOTICE =
  "Your order has been received and is pending invoice. DamTech will send the formal invoice separately. Only make payment using the banking details on the official invoice.";

export type OrderEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function moneyInclVat(amount: number): string {
  return formatZarInclVat(amount);
}

function moneyAmount(amount: number): string {
  return `R ${formatZarNumber(amount)}`;
}

function deliveryBlock(data: PublicOrderFormInput): string[] {
  return [
    data.billingLine1,
    data.billingLine2,
    data.suburb,
    data.city,
    data.province,
    data.postalCode,
  ].filter(Boolean);
}

function htmlChrome(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#031926;color:#ffffff;">
        <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#93c5fd;">DamTech</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:20px 24px;">${inner}</div>
    </div>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;width:160px;font-weight:600;color:#334155;">${escapeHtml(label)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td></tr>`;
}

export function customerOrderEmailSubject(orderReference: string): string {
  return `Order received – ${orderReference} | DamTech`;
}

export function internalOrderEmailSubject(
  orderReference: string,
  productName: string,
): string {
  return `New website order – ${orderReference} – ${productName}`;
}

export function buildCustomerOrderEmail(input: {
  orderReference: string;
  placedAtIso: string;
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
}): OrderEmailContent {
  const { data, snapshot, orderReference, placedAtIso } = input;
  const placedAt = new Date(placedAtIso).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
  });
  const subject = customerOrderEmailSubject(orderReference);
  const delivery = deliveryBlock(data);
  const text = [
    `Dear ${data.customerName},`,
    "",
    ORDER_PENDING_INVOICE_NOTICE,
    "",
    `Order reference: ${orderReference}`,
    "Status: Pending invoice",
    `Date and time: ${placedAt}`,
    `Product: ${snapshot.productName}`,
    `SKU: ${snapshot.sku}`,
    `Quantity: ${snapshot.quantity}`,
    `Unit price including VAT: ${moneyInclVat(snapshot.unitPriceInclVatZar)}`,
    `VAT amount: ${moneyAmount(snapshot.vatAmountZar)}`,
    `Total including VAT: ${moneyInclVat(snapshot.totalInclVatZar)}`,
    "Product price excludes delivery",
    "Product price excludes installation",
    `Fulfilment: ${DELIVERY_FULFILMENT.label}`,
    `Manufacturing: ${catalogueManufacturingLeadTimeLabel()} after cleared payment`,
    `Delivery estimate: ${catalogueDeliveryLeadTimeLabel()}`,
    `Total estimate: ${catalogueTotalFulfilmentLeadTimeLabel()}`,
    "",
    "Delivery address:",
    ...delivery,
    data.notes ? `Delivery instructions: ${data.notes}` : null,
    "",
    "DamTech will send the formal invoice separately.",
    "",
    `If any details need correcting, contact DamTech on ${CONTACT_PHONE} or ${CONTACT_EMAIL} and quote your order reference.`,
    "",
    "Do not pay using details from this email. Wait for the official DamTech invoice.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = htmlChrome(
    `Order received – ${orderReference}`,
    `
      <p>Dear ${escapeHtml(data.customerName)},</p>
      <p style="padding:12px;border:1px solid #f59e0b;background:#fffbeb;font-weight:600;">${escapeHtml(ORDER_PENDING_INVOICE_NOTICE)}</p>
      <table style="width:100%;border-collapse:collapse;" role="presentation">
        ${row("Order reference", orderReference)}
        ${row("Status", "Pending invoice")}
        ${row("Date and time", placedAt)}
        ${row("Product", snapshot.productName)}
        ${row("SKU", snapshot.sku)}
        ${row("Quantity", String(snapshot.quantity))}
        ${row("Unit price including VAT", moneyInclVat(snapshot.unitPriceInclVatZar))}
        ${row("VAT amount", moneyAmount(snapshot.vatAmountZar))}
        ${row("Total including VAT", moneyInclVat(snapshot.totalInclVatZar))}
        ${row("Delivery", "Excluded from product price")}
        ${row("Installation", "Excluded")}
        ${row("Fulfilment", DELIVERY_FULFILMENT.label)}
        ${row("Manufacturing", `${catalogueManufacturingLeadTimeLabel()} after cleared payment`)}
        ${row("Delivery estimate", catalogueDeliveryLeadTimeLabel())}
        ${row("Total estimate", catalogueTotalFulfilmentLeadTimeLabel())}
        ${row("Delivery address", delivery.join(", "))}
        ${data.notes ? row("Delivery instructions", data.notes) : ""}
      </table>
      <p>DamTech will send the formal invoice separately.</p>
      <p>If any details need correcting, contact DamTech on ${escapeHtml(CONTACT_PHONE)} or <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a> and quote your order reference.</p>
      <p>Do not pay using details from this email. Wait for the official DamTech invoice.</p>
    `,
  );

  return { subject, text, html };
}

export function buildInternalOrderEmail(input: {
  orderReference: string;
  placedAtIso: string;
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
  adminUrl: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  exclusionsAcceptedAt: string;
}): OrderEmailContent {
  const {
    data,
    snapshot,
    orderReference,
    placedAtIso,
    adminUrl,
    termsAcceptedAt,
    privacyAcceptedAt,
    exclusionsAcceptedAt,
  } = input;
  const subject = internalOrderEmailSubject(orderReference, snapshot.productName);
  const delivery = deliveryBlock(data);
  const text = [
    `New website order ${orderReference}`,
    `Status: pending_invoice`,
    `Placed: ${placedAtIso}`,
    `Customer type: ${data.customerType}`,
    `Name: ${data.customerName}`,
    data.businessName ? `Business: ${data.businessName}` : null,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    data.vatNumber ? `VAT number: ${data.vatNumber}` : null,
    data.customerPoNumber ? `Customer PO: ${data.customerPoNumber}` : null,
    `Delivery address: ${delivery.join(", ")}`,
    `Product: ${snapshot.productName}`,
    `SKU: ${snapshot.sku}`,
    `Quantity: ${snapshot.quantity}`,
    `Unit price incl. VAT: ${moneyInclVat(snapshot.unitPriceInclVatZar)}`,
    `VAT: ${moneyAmount(snapshot.vatAmountZar)}`,
    `Total incl. VAT: ${moneyInclVat(snapshot.totalInclVatZar)}`,
    `Fulfilment: ${DELIVERY_FULFILMENT.label}`,
    `Manufacturing: ${catalogueManufacturingLeadTimeLabel()} after cleared payment`,
    `Delivery estimate: ${catalogueDeliveryLeadTimeLabel()}`,
    data.notes ? `Delivery instructions: ${data.notes}` : "Delivery instructions: —",
    `Supply-only confirmed: ${termsAcceptedAt}`,
    `Exclusions confirmed: ${exclusionsAcceptedAt}`,
    `Policies accepted: ${privacyAcceptedAt}`,
    `Admin: ${adminUrl}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const html = htmlChrome(
    `New website order – ${orderReference}`,
    `
      <table style="width:100%;border-collapse:collapse;" role="presentation">
        ${row("Order reference", orderReference)}
        ${row("Status", "pending_invoice")}
        ${row("Customer type", data.customerType)}
        ${row("Name", data.customerName)}
        ${data.businessName ? row("Business", data.businessName) : ""}
        ${row("Email", data.email)}
        ${row("Phone", data.phone)}
        ${data.vatNumber ? row("VAT number", data.vatNumber) : ""}
        ${data.customerPoNumber ? row("Customer PO", data.customerPoNumber) : ""}
        ${row("Delivery address", delivery.join(", "))}
        ${row("Product", snapshot.productName)}
        ${row("SKU", snapshot.sku)}
        ${row("Quantity", String(snapshot.quantity))}
        ${row("Unit price incl. VAT", moneyInclVat(snapshot.unitPriceInclVatZar))}
        ${row("VAT amount", moneyAmount(snapshot.vatAmountZar))}
        ${row("Total incl. VAT", moneyInclVat(snapshot.totalInclVatZar))}
        ${row("Fulfilment", DELIVERY_FULFILMENT.label)}
        ${row("Manufacturing", `${catalogueManufacturingLeadTimeLabel()} after cleared payment`)}
        ${row("Delivery estimate", catalogueDeliveryLeadTimeLabel())}
        ${row("Delivery instructions", data.notes || "—")}
        ${row("Supply-only confirmed", termsAcceptedAt)}
        ${row("Exclusions confirmed", exclusionsAcceptedAt)}
        ${row("Policies accepted", privacyAcceptedAt)}
      </table>
      <p style="margin:20px 0 0;">
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 16px;background:#026BC6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Open in admin</a>
      </p>
    `,
  );

  return { subject, text, html };
}
