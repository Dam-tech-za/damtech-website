import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import { sendRfqAdminNotification } from "@/lib/rfq/email/send-rfq-admin-notification";
import { sendRfqCustomerConfirmation } from "@/lib/rfq/email/send-rfq-customer-confirmation";
import {
  aggregateNotificationStatus,
  enqueueNotificationOutbox,
  recordRfqCommunication,
} from "@/lib/rfq/communications";
import type { PublicRfqNotificationStatus } from "@/lib/rfq/submission-result";
import { getRfqEmailConfig } from "@/lib/rfq/email/config";

type ParsedPublicRfq = Extract<ReturnType<typeof parsePublicRfqFormData>, { ok: true }>;

/**
 * Sends the info@ notification and the customer auto-reply for a newly saved
 * single-form RFQ (simple quote and contact forms), records both in
 * rfq_communications and queues a retry if the admin email fails.
 */
export async function notifyNewPublicRfq(input: {
  rfqId: string;
  rfqNumber: string;
  parsed: ParsedPublicRfq;
}): Promise<PublicRfqNotificationStatus> {
  const { rfqId, rfqNumber, parsed } = input;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  const catalogueLine = parsed.catalogueLine;
  const sizeHint = catalogueLine
    ? `${catalogueLine.sku} · ${catalogueLine.productName} × ${catalogueLine.quantity} · R ${catalogueLine.lineTotalInclVatZar.toFixed(2)} incl. VAT · transport excluded · installation excluded`
    : parsed.data.projectSize ||
      (parsed.softEstimates.estimated_area_m2
        ? `~${parsed.softEstimates.estimated_area_m2} m² (soft parse)`
        : parsed.softEstimates.estimated_capacity_kl
          ? `~${parsed.softEstimates.estimated_capacity_kl} kL (soft parse)`
          : "Size not provided");

  const emailConfig = getRfqEmailConfig();
  const adminPayload = {
    rfqNumber,
    customerName: parsed.data.name,
    customerEmail: parsed.data.email,
    customerPhone: parsed.data.phone,
    customerCompany: parsed.data.company,
    services: [parsed.data.serviceRequired],
    location:
      parsed.data.deliveryAddress ||
      parsed.data.town ||
      parsed.data.projectLocation ||
      parsed.data.province ||
      "—",
    assetCount: catalogueLine ? catalogueLine.quantity : 0,
    quantitySummary: sizeHint,
    adminUrl: `${origin}/admin/rfqs/${rfqId}/`,
    enquiryChannel: parsed.enquiryChannel,
    messagePreview: parsed.data.message.slice(0, 280),
    extraRows: catalogueLine
      ? ([
          ["SKU", catalogueLine.sku],
          ["Product", catalogueLine.productName],
          ["Quantity", String(catalogueLine.quantity)],
          [
            "Unit price incl. VAT",
            `R ${catalogueLine.unitPriceInclVatZar.toFixed(2)}`,
          ],
          [
            "Line total incl. VAT",
            `R ${catalogueLine.lineTotalInclVatZar.toFixed(2)}`,
          ],
          ["VAT", "Included (15%)"],
          ["Transport", "Excluded"],
          ["Installation", "Excluded"],
        ] as const)
      : undefined,
  };

  const [adminResult, customerResult] = await Promise.all([
    sendRfqAdminNotification(adminPayload),
    parsed.data.email
      ? sendRfqCustomerConfirmation({
          to: parsed.data.email,
          customerName: parsed.data.name,
          rfqNumber,
          projectLocation:
            parsed.data.town || parsed.data.projectLocation || "",
          assetSummaries: catalogueLine
            ? [
                `${catalogueLine.productName} (${catalogueLine.sku}) × ${catalogueLine.quantity}`,
                `Unit price: R ${catalogueLine.unitPriceInclVatZar.toFixed(2)} incl. VAT`,
                `Line total: R ${catalogueLine.lineTotalInclVatZar.toFixed(2)} incl. VAT`,
                "Transport excluded",
                "Installation excluded",
              ]
            : [],
          enquiryChannel: parsed.enquiryChannel,
          serviceRequired: parsed.data.serviceRequired,
          invoiceRequest: Boolean(catalogueLine),
        })
      : Promise.resolve({ ok: true as const, status: "skipped" as const }),
  ]);

  await Promise.all([
    recordRfqCommunication({
      rfqId,
      communicationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      subject: `New RFQ ${rfqNumber}`,
      result: adminResult,
    }),
    parsed.data.email
      ? recordRfqCommunication({
          rfqId,
          communicationType: "customer_confirmation",
          recipient: parsed.data.email,
          subject: `Damtech RFQ Received — ${rfqNumber}`,
          result: customerResult,
        })
      : Promise.resolve(),
  ]);

  if (!adminResult.ok) {
    await enqueueNotificationOutbox({
      entityType: "rfq",
      entityId: rfqId,
      notificationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      payload: adminPayload,
    });
  }

  return aggregateNotificationStatus([adminResult, customerResult]);
}
