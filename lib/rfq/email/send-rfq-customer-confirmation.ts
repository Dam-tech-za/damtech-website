import { Resend } from "resend";
import { getRfqEmailConfig } from "./config";
import type { EmailSendResult } from "./types";
import { siteConfig } from "@/lib/site";
import { type EnquiryChannel } from "@/lib/rfq/enquiry-channel";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const config = getRfqEmailConfig();
  if (!config.apiKey) return null;
  if (!resend) resend = new Resend(config.apiKey);
  return resend;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const EMAIL_TIMEOUT_MS = 12_000;

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out`)),
          EMAIL_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function sendRfqCustomerConfirmation(input: {
  to: string;
  customerName: string;
  rfqNumber: string;
  projectLocation: string;
  assetSummaries: string[];
  enquiryChannel?: EnquiryChannel | string;
  serviceRequired?: string;
}): Promise<EmailSendResult> {
  const config = getRfqEmailConfig();
  if (!config.configured) {
    return {
      ok: false,
      error: "Email is not configured.",
      status: "pending_configuration",
    };
  }
  if (!input.to.trim()) {
    return { ok: true, status: "skipped" };
  }

  const client = getResend();
  if (!client) {
    return {
      ok: false,
      error: "Email is not configured.",
      status: "pending_configuration",
    };
  }

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
        `Damtech · ${config.replyToEmail} · ${siteConfig.phone}`,
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
        `Damtech · ${config.replyToEmail} · ${siteConfig.phone}`,
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
        <p>Damtech · ${escapeHtml(config.replyToEmail)}</p>`
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
        <p>Damtech · ${escapeHtml(config.replyToEmail)}</p>`;

  try {
    const { data, error } = await withTimeout(
      client.emails.send({
        from: `Damtech Quotes <${config.fromEmail}>`,
        to: [input.to],
        replyTo: config.replyToEmail,
        subject,
        text,
        html,
      }),
      "customer confirmation",
    );
    if (error) {
      return { ok: false, error: error.message, status: "failed" };
    }
    return {
      ok: true,
      providerMessageId: data?.id,
      status: "sent",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email failed.",
      status: "failed",
    };
  }
}
