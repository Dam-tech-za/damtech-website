export function getQuoteFromEmail(): string {
  return process.env.QUOTE_FROM_EMAIL?.trim() || "quote@dam-tech.co.za";
}

export function getQuoteReplyToEmail(): string {
  return (
    process.env.QUOTE_REPLY_TO_EMAIL?.trim() ||
    process.env.LEAD_INBOX_EMAIL?.trim() ||
    "info@dam-tech.co.za"
  );
}

export function getQuoteAdminCcEmail(): string {
  return (
    process.env.QUOTE_ADMIN_CC_EMAIL?.trim() ||
    process.env.RFQ_INTERNAL_NOTIFICATION_EMAIL?.trim() ||
    process.env.QUOTE_INTERNAL_NOTIFY_EMAIL?.trim() ||
    process.env.LEAD_INBOX_EMAIL?.trim() ||
    "info@dam-tech.co.za"
  );
}

export function hasResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
