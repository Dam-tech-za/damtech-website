/**
 * Central RFQ / quote email configuration.
 * Accepts both new RFQ_* names and existing QUOTE_* / LEAD_* aliases.
 */

export type RfqEmailConfig = {
  apiKey: string | null;
  fromEmail: string;
  replyToEmail: string;
  internalNotificationEmail: string;
  /** Also copied on the new-RFQ alert (never on the customer's auto-reply). */
  internalNotificationCc: string[];
  configured: boolean;
  missing: string[];
};

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Copied on every new-RFQ alert unless RFQ_INTERNAL_NOTIFICATION_CC is set. */
export const DEFAULT_RFQ_NOTIFICATION_CC = ["arno@dam-tech.co.za"];

/** Comma/semicolon list → unique lowercase addresses, minus any already in `exclude`. */
export function parseEmailList(value: string | undefined, exclude: string[] = []): string[] {
  const skip = new Set(exclude.map((e) => e.trim().toLowerCase()));
  const out: string[] = [];
  for (const raw of (value ?? "").split(/[,;]/)) {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes("@") || skip.has(email) || out.includes(email)) continue;
    out.push(email);
  }
  return out;
}

export function getRfqEmailConfig(): RfqEmailConfig {
  const apiKey = firstEnv("RESEND_API_KEY") ?? null;
  const fromEmail =
    firstEnv("RFQ_FROM_EMAIL", "QUOTE_FROM_EMAIL") || "quote@dam-tech.co.za";
  const replyToEmail =
    firstEnv("RFQ_REPLY_TO_EMAIL", "QUOTE_REPLY_TO_EMAIL", "LEAD_INBOX_EMAIL") ||
    "info@dam-tech.co.za";
  const internalNotificationEmail =
    firstEnv(
      "RFQ_INTERNAL_NOTIFICATION_EMAIL",
      "QUOTE_INTERNAL_NOTIFY_EMAIL",
      "LEAD_INBOX_EMAIL",
    ) || "info@dam-tech.co.za";

  const ccEnv = process.env.RFQ_INTERNAL_NOTIFICATION_CC;
  const internalNotificationCc = parseEmailList(
    ccEnv !== undefined ? ccEnv : DEFAULT_RFQ_NOTIFICATION_CC.join(","),
    [internalNotificationEmail],
  );

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!firstEnv("RFQ_FROM_EMAIL", "QUOTE_FROM_EMAIL")) {
    // default exists — warn only if neither set
  }

  return {
    apiKey,
    fromEmail,
    replyToEmail,
    internalNotificationEmail,
    internalNotificationCc,
    configured: Boolean(apiKey),
    missing,
  };
}

export function isRfqEmailConfigured(): boolean {
  return getRfqEmailConfig().configured;
}
