/**
 * "Needs attention" items for the admin overview. Counts come from live
 * queries; `null` means the query failed, which is shown as unavailable rather
 * than as zero so the overview never claims everything is fine when it isn't.
 */

export type AttentionCounts = {
  newEnquiries: number | null;
  oldestNewSubmittedAt: string | null;
  informationRequired: number | null;
  siteMeasurement: number | null;
  readyForQuote: number | null;
  ordersAwaitingInvoice: number | null;
  failedEmails: number | null;
  failedEmailHref: string | null;
  quotesAwaitingApproval: number | null;
  quotesExpiringSoon: number | null;
};

export type AttentionTone = "urgent" | "normal" | "unavailable";

export type AttentionItem = {
  id: string;
  label: string;
  count: number | null;
  hint: string;
  href: string;
  tone: AttentionTone;
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

type Spec = {
  id: string;
  count: number | null;
  label: (count: number) => string;
  hint: (count: number) => string;
  href: string;
  urgent?: boolean;
  unavailableLabel: string;
};

export function buildAttentionItems(
  counts: AttentionCounts,
  now: Date = new Date(),
): AttentionItem[] {
  const oldestDays = daysSince(counts.oldestNewSubmittedAt, now);

  const specs: Spec[] = [
    {
      id: "failed-emails",
      count: counts.failedEmails,
      label: (n) => `${n} ${plural(n, "email", "emails")} failed to send`,
      hint: () =>
        "A customer confirmation or a notification to Damtech did not go out. Open it to resend or contact the customer directly.",
      href: counts.failedEmailHref ?? "/admin/settings/system/",
      urgent: true,
      unavailableLabel: "Email delivery status",
    },
    {
      id: "new-enquiries",
      count: counts.newEnquiries,
      label: (n) => `${n} new ${plural(n, "enquiry", "enquiries")} not yet reviewed`,
      hint: () =>
        oldestDays !== null && oldestDays > 0
          ? `Oldest is ${oldestDays} ${plural(oldestDays, "day", "days")} old. Open each one and change its status once you have followed up.`
          : "Open each one and change its status once you have followed up.",
      href: "/admin/rfqs/?status=new&sort=submitted_asc",
      urgent: oldestDays !== null && oldestDays >= 2,
      unavailableLabel: "New enquiries",
    },
    {
      id: "orders-awaiting-invoice",
      count: counts.ordersAwaitingInvoice,
      label: (n) => `${n} ${plural(n, "order", "orders")} awaiting an invoice`,
      hint: () =>
        "Online kit orders are invoice-only. Send the invoice, then update the order status (or cancel test orders).",
      href: "/admin/orders/?status=pending_invoice",
      unavailableLabel: "Orders awaiting invoice",
    },
    {
      id: "information-required",
      count: counts.informationRequired,
      label: (n) => `${n} ${plural(n, "enquiry is", "enquiries are")} waiting on the customer`,
      hint: () => "Status is Information Required. Chase the customer if they have gone quiet.",
      href: "/admin/rfqs/?status=information_required",
      unavailableLabel: "Waiting on customer",
    },
    {
      id: "site-measurement",
      count: counts.siteMeasurement,
      label: (n) => `${n} site ${plural(n, "measurement", "measurements")} to arrange`,
      hint: () => "Status is Site Measurement. Book or confirm the visit on the enquiry.",
      href: "/admin/rfqs/?status=site_measurement_required",
      unavailableLabel: "Site measurements",
    },
    {
      id: "ready-for-quote",
      count: counts.readyForQuote,
      label: (n) => `${n} ${plural(n, "enquiry is", "enquiries are")} ready to quote`,
      hint: () => "Everything needed is in. Prepare the quotation.",
      href: "/admin/rfqs/?status=ready_for_quote",
      unavailableLabel: "Ready to quote",
    },
    {
      id: "quotes-awaiting-approval",
      count: counts.quotesAwaitingApproval,
      label: (n) => `${n} ${plural(n, "quotation", "quotations")} awaiting approval`,
      hint: () => "Approve before sending to the customer.",
      href: "/admin/quotes/?status=internal_review",
      unavailableLabel: "Quotations awaiting approval",
    },
    {
      id: "quotes-expiring",
      count: counts.quotesExpiringSoon,
      label: (n) => `${n} sent ${plural(n, "quotation expires", "quotations expire")} within 7 days`,
      hint: () => "Follow up before the price validity runs out.",
      href: "/admin/quotes/?status=sent",
      unavailableLabel: "Expiring quotations",
    },
  ];

  const items: AttentionItem[] = [];
  for (const spec of specs) {
    if (spec.count === null) {
      items.push({
        id: spec.id,
        label: `${spec.unavailableLabel}: could not be loaded`,
        count: null,
        hint: "Refresh the page. If this keeps happening, check System health under Settings.",
        href: spec.href,
        tone: "unavailable",
      });
      continue;
    }
    if (spec.count <= 0) continue;
    items.push({
      id: spec.id,
      label: spec.label(spec.count),
      count: spec.count,
      hint: spec.hint(spec.count),
      href: spec.href,
      tone: spec.urgent ? "urgent" : "normal",
    });
  }
  return items;
}
