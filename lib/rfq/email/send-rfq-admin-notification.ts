import { Resend } from "resend";
import { getRfqEmailConfig } from "./config";
import type { EmailSendResult } from "./types";
import {
  enquiryChannelLabel,
  type EnquiryChannel,
} from "@/lib/rfq/enquiry-channel";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const config = getRfqEmailConfig();
  if (!config.apiKey) return null;
  if (!resend) resend = new Resend(config.apiKey);
  return resend;
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendRfqAdminNotification(input: {
  rfqNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  services: string[];
  location: string;
  assetCount: number;
  quantitySummary: string;
  adminUrl: string;
  enquiryChannel?: EnquiryChannel | string;
  messagePreview?: string;
}): Promise<EmailSendResult> {
  const config = getRfqEmailConfig();
  if (!config.configured) {
    return {
      ok: false,
      error: "Email is not configured.",
      status: "pending_configuration",
    };
  }

  const client = getResend();
  if (!client) {
    return {
      ok: false,
      error: "Email is not configured.",
      status: "pending_configuration",
    };
  }

  const channelLabel = enquiryChannelLabel(input.enquiryChannel);
  const email = input.customerEmail?.trim() || "";
  const phone = input.customerPhone?.trim() || "";
  const company = input.customerCompany?.trim() || "";
  const subject = `New RFQ ${input.rfqNumber} — ${channelLabel} — ${input.customerName}`;
  const text = [
    `RFQ: ${input.rfqNumber}`,
    `Source: ${channelLabel}`,
    `Customer: ${input.customerName}`,
    email ? `Email: ${email}` : "Email: —",
    phone ? `Phone: ${phone}` : "Phone: —",
    company ? `Company: ${company}` : null,
    `Services: ${input.services.join(", ")}`,
    `Location: ${input.location}`,
    `Assets: ${input.assetCount}`,
    `Summary: ${input.quantitySummary}`,
    input.messagePreview ? `Message: ${input.messagePreview}` : "",
    `Admin: ${input.adminUrl}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const htmlRows = [
    ["RFQ", input.rfqNumber],
    ["Source", channelLabel],
    ["Customer", input.customerName],
    ["Email", email || "—"],
    ["Phone", phone || "—"],
    ...(company ? [["Company", company] as const] : []),
    ["Services", input.services.join(", ")],
    ["Location", input.location],
    ["Assets", String(input.assetCount)],
    ["Summary", input.quantitySummary],
    ...(input.messagePreview
      ? [["Message", input.messagePreview] as const]
      : []),
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;width:140px;font-weight:600;color:#334155;">${escapeHtml(label)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:#031926;color:#ffffff;">
        <h1 style="margin:0;font-size:20px;font-weight:700;">New RFQ ${escapeHtml(input.rfqNumber)}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#93c5fd;">${escapeHtml(channelLabel)} — dam-tech.co.za</p>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;" role="presentation">${htmlRows}</table>
        <p style="margin:20px 0 0;">
          <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;padding:10px 16px;background:#026BC6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Open in admin</a>
        </p>
      </div>
    </div>
  </body>
</html>`;

  try {
    const { data, error } = await withTimeout(
      client.emails.send({
        from: `Damtech Quotes <${config.fromEmail}>`,
        to: [config.internalNotificationEmail],
        replyTo: email || undefined,
        subject,
        text,
        html,
      }),
      "admin notification",
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
