import { Resend } from "resend";
import { getRfqEmailConfig } from "../../rfq/email/config.ts";
import type { EmailSendResult } from "../../rfq/email/types.ts";
import {
  buildCustomerOrderEmail,
  buildInternalOrderEmail,
  type OrderEmailContent,
} from "./templates.ts";
import type { PublicOrderFormInput } from "../schema.ts";
import type { OrderPriceSnapshot } from "../pricing.ts";

let resend: Resend | null = null;

function getResend(): Resend | null {
  const config = getRfqEmailConfig();
  if (!config.apiKey) return null;
  if (!resend) resend = new Resend(config.apiKey);
  return resend;
}

const EMAIL_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
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

async function sendBuiltEmail(input: {
  to: string;
  replyTo?: string;
  content: OrderEmailContent;
  label: string;
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
  try {
    const { data, error } = await withTimeout(
      client.emails.send({
        from: `Damtech Orders <${config.fromEmail}>`,
        to: [input.to],
        replyTo: input.replyTo || config.replyToEmail,
        subject: input.content.subject,
        text: input.content.text,
        html: input.content.html,
      }),
      input.label,
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

export async function sendCustomerOrderConfirmation(input: {
  orderReference: string;
  placedAtIso: string;
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
}): Promise<EmailSendResult> {
  const config = getRfqEmailConfig();
  const content = buildCustomerOrderEmail(input);
  return sendBuiltEmail({
    to: input.data.email,
    replyTo: config.replyToEmail,
    content,
    label: "order customer confirmation",
  });
}

export async function sendInternalOrderNotification(input: {
  orderReference: string;
  placedAtIso: string;
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
  adminUrl: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  exclusionsAcceptedAt: string;
}): Promise<EmailSendResult> {
  const config = getRfqEmailConfig();
  const content = buildInternalOrderEmail(input);
  return sendBuiltEmail({
    to: config.internalNotificationEmail,
    replyTo: input.data.email,
    content,
    label: "order internal notification",
  });
}

export { getRfqEmailConfig as getOrderEmailConfig };
