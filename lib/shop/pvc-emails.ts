import { Resend } from "resend";
import { getRfqEmailConfig } from "../rfq/email/config.ts";
import { escapeHtml } from "../orders/email/templates.ts";
import { formatZarNumber } from "../catalogue/format.ts";
import { fulfilmentLabel, isCollectionMethod } from "./delivery.ts";
import { PVC_LINER_MANUFACTURE_LABEL } from "./pvc-liners.ts";
import type { PvcOrderRecord } from "./pvc-orders.ts";

const CONTACT_PHONE = "+27 82 853 1026";
const CONTACT_EMAIL = "info@dam-tech.co.za";

type Content = { subject: string; text: string; html: string };
export type PvcEmailStatus = "sent" | "failed" | "pending_configuration";

function zar(amount: number): string {
  return `R ${formatZarNumber(amount)}`;
}

function lines(order: PvcOrderRecord): Array<[string, string]> {
  return [
    ["Order reference", order.orderReference],
    ["Product", order.productName],
    ["SKU", order.sku],
    ["Quantity", String(order.quantity)],
    ["Liner total incl. VAT", zar(order.goodsTotalZar)],
    isCollectionMethod(order.fulfilmentMethod)
      ? [fulfilmentLabel(order.fulfilmentMethod, order.province), "No delivery fee"]
      : [`Delivery to ${order.province} incl. VAT`, zar(order.deliveryFeeZar)],
    ["Paid", zar(order.amountPaidZar ?? order.amountDueZar)],
  ];
}

function table(rows: Array<[string, string]>): string {
  return `<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#555">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`,
    )
    .join("")}</table>`;
}

export function buildPvcPaidCustomerEmail(order: PvcOrderRecord): Content {
  const intro = `Thank you, ${order.customerName}. We have received your PayFast payment for order ${order.orderReference}.`;
  const next = isCollectionMethod(order.fulfilmentMethod)
    ? `${PVC_LINER_MANUFACTURE_LABEL}. We will contact you on ${order.phone} with the collection address and time when it is ready.`
    : `${PVC_LINER_MANUFACTURE_LABEL}. We will contact you on ${order.phone} to confirm the delivery date.`;
  const help = `Questions: ${CONTACT_PHONE} or ${CONTACT_EMAIL}. Please quote ${order.orderReference}.`;
  return {
    subject: `Payment received: ${order.orderReference}`,
    text: [intro, "", ...lines(order).map(([k, v]) => `${k}: ${v}`), "", next, "", help].join("\n"),
    html: `<p>${escapeHtml(intro)}</p>${table(lines(order))}<p>${escapeHtml(next)}</p><p>${escapeHtml(help)}</p>`,
  };
}

export function buildPvcPaidInternalEmail(order: PvcOrderRecord, adminUrl: string): Content {
  const intro = `Paid online order ${order.orderReference} from ${order.customerName} (${order.email}, ${order.phone}).`;
  const action = isCollectionMethod(order.fulfilmentMethod)
    ? `Start manufacture (3 to 5 business days), then arrange ${fulfilmentLabel(order.fulfilmentMethod, order.province).toLowerCase()}.`
    : "Start manufacture (3 to 5 business days) and arrange delivery.";
  return {
    subject: `PAID PVC liner order ${order.orderReference}: ${order.productName}`,
    text: [intro, "", ...lines(order).map(([k, v]) => `${k}: ${v}`), "", action, adminUrl].join("\n"),
    html: `<p>${escapeHtml(intro)}</p>${table(lines(order))}<p>${escapeHtml(action)}</p><p><a href="${escapeHtml(adminUrl)}">Open in admin</a></p>`,
  };
}

async function send(to: string[], content: Content): Promise<PvcEmailStatus> {
  const config = getRfqEmailConfig();
  if (!config.apiKey) return "pending_configuration";
  try {
    const { error } = await new Resend(config.apiKey).emails.send({
      from: `Damtech Orders <${config.fromEmail}>`,
      to,
      replyTo: config.replyToEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    return error ? "failed" : "sent";
  } catch (error) {
    console.error("[pvc-emails] send failed", error instanceof Error ? error.message : "unknown");
    return "failed";
  }
}

export async function sendPvcPaidEmails(
  order: PvcOrderRecord,
  adminUrl: string,
): Promise<{ customer: PvcEmailStatus; internal: PvcEmailStatus }> {
  const config = getRfqEmailConfig();
  const [customer, internal] = await Promise.all([
    send([order.email], buildPvcPaidCustomerEmail(order)),
    send(
      [config.internalNotificationEmail, ...config.internalNotificationCc],
      buildPvcPaidInternalEmail(order, adminUrl),
    ),
  ]);
  return { customer, internal };
}
