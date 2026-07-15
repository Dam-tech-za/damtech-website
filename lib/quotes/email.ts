import { Resend } from "resend";
import { formatZar } from "@/lib/estimating/money";

const QUOTE_FROM_EMAIL =
  process.env.QUOTE_FROM_EMAIL?.trim() || "quote@dam-tech.co.za";
const QUOTE_REPLY_TO_EMAIL =
  process.env.QUOTE_REPLY_TO_EMAIL?.trim() ||
  process.env.LEAD_INBOX_EMAIL?.trim() ||
  "info@dam-tech.co.za";
const INTERNAL_QUOTE_EMAIL =
  process.env.QUOTE_INTERNAL_NOTIFY_EMAIL?.trim() ||
  process.env.LEAD_INBOX_EMAIL?.trim() ||
  "info@dam-tech.co.za";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type SendCustomerQuoteEmailInput = {
  to: string;
  customerName: string;
  quoteNumber: string;
  revisionNumber: number;
  projectTitle: string;
  totalIncVat: number;
  validUntil: string;
  message?: string | null;
  secureUrl: string;
  pdf?: { fileName: string; content: Buffer } | null;
};

export async function sendCustomerQuoteEmail(
  input: SendCustomerQuoteEmailInput,
): Promise<
  | { ok: true; messageId: string | null }
  | { ok: false; error: string }
> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const label = `${input.quoteNumber} Rev ${input.revisionNumber}`;
  const subject = `Damtech Quotation ${input.quoteNumber} — ${input.projectTitle}`;
  const safeName = escapeHtml(input.customerName);
  const safeMessage = escapeHtml(
    input.message?.trim() ||
      "Please review the Damtech quotation linked below.",
  );

  const html = `
    <div style="font-family:Georgia,serif;color:#1a1a1a;line-height:1.5;max-width:560px">
      <p>Dear ${safeName},</p>
      <p>${safeMessage}</p>
      <p><strong>Quote:</strong> ${escapeHtml(label)}<br/>
      <strong>Total (inc VAT):</strong> ${escapeHtml(formatZar(input.totalIncVat))}<br/>
      <strong>Valid until:</strong> ${escapeHtml(input.validUntil)}</p>
      <p><a href="${escapeHtml(input.secureUrl)}" style="display:inline-block;background:#1B4D3E;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px">View quotation securely</a></p>
      <p>Damtech · ${escapeHtml(QUOTE_REPLY_TO_EMAIL)}</p>
    </div>
  `;

  const text = [
    `Dear ${input.customerName},`,
    "",
    input.message?.trim() || "Please review the Damtech quotation linked below.",
    "",
    `Quote: ${label}`,
    `Total (inc VAT): ${formatZar(input.totalIncVat)}`,
    `Valid until: ${input.validUntil}`,
    "",
    `Secure link: ${input.secureUrl}`,
    "",
    `Damtech · ${QUOTE_REPLY_TO_EMAIL}`,
  ].join("\n");

  const attachments =
    input.pdf && input.pdf.content.byteLength < 8_000_000
      ? [
          {
            filename: input.pdf.fileName,
            content: input.pdf.content,
          },
        ]
      : undefined;

  try {
    const { data, error } = await resend.emails.send({
      from: `Damtech Quotes <${QUOTE_FROM_EMAIL}>`,
      to: [input.to],
      replyTo: QUOTE_REPLY_TO_EMAIL,
      subject,
      html,
      text,
      attachments,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, messageId: data?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}

export async function sendInternalQuoteNotification(input: {
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not configured." };

  try {
    const { error } = await resend.emails.send({
      from: `Damtech Quotes <${QUOTE_FROM_EMAIL}>`,
      to: [INTERNAL_QUOTE_EMAIL],
      subject: input.subject,
      text: input.body,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}

export function getQuoteReplyToEmail(): string {
  return QUOTE_REPLY_TO_EMAIL;
}
