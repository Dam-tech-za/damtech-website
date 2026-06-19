import { Resend } from "resend";
import type { LeadFormData } from "@/lib/form";

const INBOX_EMAIL =
  process.env.LEAD_INBOX_EMAIL?.trim() || "info@dam-tech.co.za";
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL?.trim() || "contact@dam-tech.co.za";
const QUOTE_FROM_EMAIL =
  process.env.QUOTE_FROM_EMAIL?.trim() || "quote@dam-tech.co.za";

export type LeadEmailChannel = "contact" | "quote";

let resendClient: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function leadEmailChannel(sourcePage: string): LeadEmailChannel {
  return sourcePage === "/contact" ? "contact" : "quote";
}

function fromAddress(channel: LeadEmailChannel): string {
  const email =
    channel === "contact" ? CONTACT_FROM_EMAIL : QUOTE_FROM_EMAIL;
  const label = channel === "contact" ? "Damtech Contact" : "Damtech Quotes";
  return `${label} <${email}>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function row(label: string, value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  return `<tr>
    <td style="padding:8px 12px 8px 0;font-weight:600;color:#0f172a;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#334155;vertical-align:top;">${escapeHtml(value.trim())}</td>
  </tr>`;
}

function buildLeadEmailHtml(data: LeadFormData, channel: LeadEmailChannel): string {
  const title =
    channel === "contact"
      ? "New contact enquiry"
      : "New quote request";

  const rows = [
    row("Name", data.name),
    row("Email", data.email),
    row("Phone", data.phone),
    row("Company", data.company),
    row("Province", data.province),
    row("Service required", data.serviceRequired),
    row("Project size", data.projectSize),
    row("Project location", data.projectLocation),
    row("Source page", data.sourcePage),
    row("Message", data.message),
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#020a16;color:#ffffff;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#bae6fd;">Submitted via dam-tech.co.za</p>
      </div>
      <table style="width:100%;border-collapse:collapse;padding:24px;" role="presentation">
        <tbody>${rows}</tbody>
      </table>
    </div>
  </body>
</html>`;
}

function buildLeadEmailText(data: LeadFormData, channel: LeadEmailChannel): string {
  const title =
    channel === "contact"
      ? "New contact enquiry"
      : "New quote request";

  const lines = [
    title,
    "",
    `Name: ${data.name}`,
    data.email ? `Email: ${data.email}` : null,
    data.phone ? `Phone: ${data.phone}` : null,
    data.company ? `Company: ${data.company}` : null,
    data.province ? `Province: ${data.province}` : null,
    `Service required: ${data.serviceRequired}`,
    data.projectSize ? `Project size: ${data.projectSize}` : null,
    data.projectLocation ? `Project location: ${data.projectLocation}` : null,
    `Source page: ${data.sourcePage}`,
    "",
    "Message:",
    data.message,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export async function sendLeadEmail(
  data: LeadFormData,
  channel: LeadEmailChannel,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();

  if (!resend) {
    console.error(
      "[email] Resend is not configured. Set RESEND_API_KEY on the server.",
    );
    return {
      ok: false,
      error:
        "Email delivery is not configured. Please call us directly or try again shortly.",
    };
  }

  const subjectPrefix =
    channel === "contact" ? "Contact enquiry" : "Quote request";
  const subject = `${subjectPrefix}: ${data.name} — ${data.serviceRequired}`;

  const { error } = await resend.emails.send({
    from: fromAddress(channel),
    to: [INBOX_EMAIL],
    replyTo: data.email || undefined,
    subject,
    html: buildLeadEmailHtml(data, channel),
    text: buildLeadEmailText(data, channel),
  });

  if (error) {
    console.error("[email] Resend send failed:", error.message);
    return {
      ok: false,
      error:
        "We could not send your enquiry right now. Please call us directly or try again shortly.",
    };
  }

  return { ok: true };
}
