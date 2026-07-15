import { Resend } from "resend";
import { siteConfig } from "@/lib/site";
import {
  enquiryChannelLabel,
  type EnquiryChannel,
} from "@/lib/rfq/enquiry-channel";

const QUOTE_FROM =
  process.env.QUOTE_FROM_EMAIL?.trim() || "quote@dam-tech.co.za";
const INBOX =
  process.env.LEAD_INBOX_EMAIL?.trim() || "info@dam-tech.co.za";

let resend: Resend | null = null;
function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendRfqCustomerConfirmation(input: {
  to: string;
  customerName: string;
  rfqNumber: string;
  projectLocation: string;
  assetSummaries: string[];
  enquiryChannel?: EnquiryChannel | string;
  serviceRequired?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResend();
  if (!client) return { ok: false, error: "Email is not configured." };
  if (!input.to.trim()) return { ok: true };

  const isSimple =
    !input.enquiryChannel ||
    input.enquiryChannel === "simple_public_rfq" ||
    input.enquiryChannel === "contact_enquiry";

  const subject = `Damtech RFQ Received — ${input.rfqNumber}`;

  const text = isSimple
    ? [
        `Dear ${input.customerName},`,
        "",
        `Thank you. We have received your quote request ${input.rfqNumber}.`,
        input.serviceRequired ? `Service: ${input.serviceRequired}` : "",
        input.projectLocation ? `Project location: ${input.projectLocation}` : "",
        "",
        "You do not need exact measurements for this enquiry. Our team will confirm site dimensions and quantities before issuing a quote.",
        "",
        "We typically respond within one business day.",
        "",
        `Damtech · ${INBOX} · ${siteConfig.phone}`,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        `Dear ${input.customerName},`,
        "",
        `Thank you. We have received your request for quotation ${input.rfqNumber}.`,
        input.projectLocation ? `Project location: ${input.projectLocation}` : "",
        "",
        "Submitted assets:",
        input.assetSummaries.map((s) => `• ${s}`).join("\n") || "• Details received",
        "",
        "These quantities (if shown) are preliminary estimating values only. No quotation has been issued yet — Damtech must confirm site dimensions and final quantities.",
        "",
        `Damtech · ${INBOX} · ${siteConfig.phone}`,
      ]
        .filter(Boolean)
        .join("\n");

  const html = isSimple
    ? `<p>Dear ${escapeHtml(input.customerName)},</p>
        <p>Thank you. We have received your quote request <strong>${escapeHtml(input.rfqNumber)}</strong>.</p>
        ${input.serviceRequired ? `<p>Service: ${escapeHtml(input.serviceRequired)}</p>` : ""}
        ${input.projectLocation ? `<p>${escapeHtml(input.projectLocation)}</p>` : ""}
        <p>You do not need exact measurements for this enquiry. Our team will confirm site dimensions and quantities before issuing a quote.</p>
        <p>We typically respond within one business day.</p>
        <p>Damtech · ${escapeHtml(INBOX)}</p>`
    : `<p>Dear ${escapeHtml(input.customerName)},</p>
        <p>Thank you. We have received your request for quotation <strong>${escapeHtml(input.rfqNumber)}</strong>.</p>
        <p>${escapeHtml(input.projectLocation || "")}</p>
        <p>Submitted assets:</p>
        <ul>${(input.assetSummaries.length
          ? input.assetSummaries
          : ["Details received"]
        )
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join("")}</ul>
        <p><em>Preliminary estimating values only. No quotation has been issued yet.</em></p>
        <p>Damtech · ${escapeHtml(INBOX)}</p>`;

  try {
    const { error } = await client.emails.send({
      from: `Damtech Quotes <${QUOTE_FROM}>`,
      to: [input.to],
      replyTo: INBOX,
      subject,
      text,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email failed.",
    };
  }
}

export async function sendRfqAdminNotification(input: {
  rfqNumber: string;
  customerName: string;
  services: string[];
  location: string;
  assetCount: number;
  quantitySummary: string;
  adminUrl: string;
  enquiryChannel?: EnquiryChannel | string;
  messagePreview?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResend();
  if (!client) return { ok: false, error: "Email is not configured." };

  const channelLabel = enquiryChannelLabel(input.enquiryChannel);
  const subject = `New RFQ ${input.rfqNumber} — ${channelLabel} — ${input.customerName}`;
  const text = [
    `RFQ: ${input.rfqNumber}`,
    `Source: ${channelLabel}`,
    `Customer: ${input.customerName}`,
    `Services: ${input.services.join(", ")}`,
    `Location: ${input.location}`,
    `Assets: ${input.assetCount}`,
    `Summary: ${input.quantitySummary}`,
    input.messagePreview ? `Message: ${input.messagePreview}` : "",
    `Admin: ${input.adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { error } = await client.emails.send({
      from: `Damtech Quotes <${QUOTE_FROM}>`,
      to: [INBOX],
      subject,
      text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email failed.",
    };
  }
}
