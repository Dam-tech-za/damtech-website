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
    const { data, error } = await withTimeout(
      client.emails.send({
        from: `Damtech Quotes <${config.fromEmail}>`,
        to: [config.internalNotificationEmail],
        subject,
        text,
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
