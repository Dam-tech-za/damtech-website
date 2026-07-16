/**
 * Central RFQ / quote email configuration.
 * Accepts both new RFQ_* names and existing QUOTE_* / LEAD_* aliases.
 */

export type RfqEmailConfig = {
  apiKey: string | null;
  fromEmail: string;
  replyToEmail: string;
  internalNotificationEmail: string;
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
    configured: Boolean(apiKey),
    missing,
  };
}

export function isRfqEmailConfigured(): boolean {
  return getRfqEmailConfig().configured;
}
