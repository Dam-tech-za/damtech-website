export const ENQUIRY_CHANNELS = [
  "simple_public_rfq",
  "calculator_quote_preparation",
  "contact_enquiry",
  "admin_created",
  "other",
] as const;

export type EnquiryChannel = (typeof ENQUIRY_CHANNELS)[number];

export function enquiryChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "simple_public_rfq":
      return "Simple quote";
    case "calculator_quote_preparation":
      return "Calculator quote";
    case "contact_enquiry":
      return "Contact form";
    case "admin_created":
      return "Admin created";
    case "other":
      return "Other";
    default:
      return "Unknown source";
  }
}

export function enquiryChannelBadgeClass(
  channel: string | null | undefined,
): string {
  switch (channel) {
    case "simple_public_rfq":
      return "admin-source-badge admin-source-badge--simple";
    case "calculator_quote_preparation":
      return "admin-source-badge admin-source-badge--calculator";
    case "contact_enquiry":
      return "admin-source-badge admin-source-badge--contact";
    case "admin_created":
      return "admin-source-badge admin-source-badge--admin";
    default:
      return "admin-source-badge";
  }
}

export function isSimpleEnquiryChannel(
  channel: string | null | undefined,
): boolean {
  return (
    channel === "simple_public_rfq" ||
    channel === "contact_enquiry" ||
    !channel
  );
}

/** Infer channel from legacy source_page when enquiry_channel is null. */
export function inferEnquiryChannel(input: {
  enquiry_channel?: string | null;
  source_page?: string | null;
  has_calculator_data?: boolean | null;
  calculator_type?: string | null;
  asset_count?: number | null;
}): EnquiryChannel | null {
  if (
    input.enquiry_channel &&
    (ENQUIRY_CHANNELS as readonly string[]).includes(input.enquiry_channel)
  ) {
    return input.enquiry_channel as EnquiryChannel;
  }
  const page = (input.source_page || "").toLowerCase();
  if (
    page.includes("quote-preparation") ||
    page.includes("project-budget") ||
    page.includes("calculator")
  ) {
    return "calculator_quote_preparation";
  }
  if (page.includes("contact")) return "contact_enquiry";
  if (input.has_calculator_data || input.calculator_type) {
    return "calculator_quote_preparation";
  }
  if ((input.asset_count ?? 0) > 0) return "calculator_quote_preparation";
  if (page.includes("quote")) return "simple_public_rfq";
  return null;
}
