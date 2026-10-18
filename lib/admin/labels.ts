/**
 * Plain-English labels for stored codes shown in the admin (timeline events,
 * notification rows, order statuses). Unknown codes fall back to a readable
 * version of the code so new values never render blank.
 */

function humanise(code: string | null | undefined): string {
  if (!code) return "Unknown";
  const words = code.replace(/[_.]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const RFQ_EVENT_LABELS: Record<string, string> = {
  submitted: "Enquiry submitted",
  status_changed: "Status changed",
  bulk_status_changed: "Status changed (bulk)",
  assigned: "Assignment changed",
  bulk_assigned: "Assignment changed (bulk)",
  note_added: "Note added",
  information_requested: "More information requested",
  customer_response_received: "Customer replied",
  measurement_scheduled: "Site measurement updated",
  asset_confirmed: "Measurements confirmed",
  calculation_overridden: "Quantities overridden",
  converted_to_quote: "Converted to quotation",
};

export function rfqEventLabel(code: string | null | undefined): string {
  return (code && RFQ_EVENT_LABELS[code]) || humanise(code);
}

const COMMUNICATION_TYPE_LABELS: Record<string, string> = {
  admin_notification: "Email to Damtech",
  customer_confirmation: "Confirmation to customer",
};

export function communicationTypeLabel(code: string | null | undefined): string {
  return (code && COMMUNICATION_TYPE_LABELS[code]) || humanise(code);
}

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Sending",
  sent: "Sent",
  failed: "Failed",
  skipped: "Not sent",
  pending_configuration: "Email not configured",
};

export function communicationStatusLabel(code: string | null | undefined): string {
  return (code && DELIVERY_STATUS_LABELS[code]) || humanise(code);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_invoice: "Awaiting invoice",
  invoice_sent: "Invoice sent",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  ready_for_delivery: "Ready for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function orderStatusLabel(code: string | null | undefined): string {
  return (code && ORDER_STATUS_LABELS[code]) || humanise(code);
}
