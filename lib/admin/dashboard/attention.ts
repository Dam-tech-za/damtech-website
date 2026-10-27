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
  /** Operations and Xero. Undefined = not shown for this role. */
  opsOverdueActions?: number | null;
  opsNoNextAction?: number | null;
  opsSupplierOrders?: number | null;
  unmatchedXero?: number | null;
  overdueDebtors?: number | null;
};

export type AttentionTone = "urgent" | "normal" | "unavailable";

export type AttentionItem = {
  id: string;
  label: string;
  count: number | null;
  hint: string;
  href: string;
  /** Button text: the one thing to do. */
  action: string;
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
  action: string;
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
      action: "Resend",
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
      action: "Reply",
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
      action: "Invoice",
      count: counts.ordersAwaitingInvoice,
      label: (n) => `${n} ${plural(n, "order", "orders")} awaiting an invoice`,
      hint: () =>
        "Online kit orders are invoice-only. Send the invoice, then update the order status (or cancel test orders).",
      href: "/admin/orders/?status=pending_invoice",
      unavailableLabel: "Orders awaiting invoice",
    },
    {
      id: "information-required",
      action: "Chase",
      count: counts.informationRequired,
      label: (n) => `${n} ${plural(n, "enquiry is", "enquiries are")} waiting on the customer`,
      hint: () => "Status is Information Required. Chase the customer if they have gone quiet.",
      href: "/admin/rfqs/?status=information_required",
      unavailableLabel: "Waiting on customer",
    },
    {
      id: "site-measurement",
      action: "Book visit",
      count: counts.siteMeasurement,
      label: (n) => `${n} site ${plural(n, "measurement", "measurements")} to arrange`,
      hint: () => "Status is Site Measurement. Book or confirm the visit on the enquiry.",
      href: "/admin/rfqs/?status=site_measurement_required",
      unavailableLabel: "Site measurements",
    },
    {
      id: "ready-for-quote",
      action: "Quote",
      count: counts.readyForQuote,
      label: (n) => `${n} ${plural(n, "enquiry is", "enquiries are")} ready to quote`,
      hint: () => "Everything needed is in. Prepare the quotation.",
      href: "/admin/rfqs/?status=ready_for_quote",
      unavailableLabel: "Ready to quote",
    },
    {
      id: "quotes-awaiting-approval",
      action: "Approve",
      count: counts.quotesAwaitingApproval,
      label: (n) => `${n} ${plural(n, "quotation", "quotations")} awaiting approval`,
      hint: () => "Approve before sending to the customer.",
      href: "/admin/quotes/?status=internal_review",
      unavailableLabel: "Quotations awaiting approval",
    },
    {
      id: "quotes-expiring",
      action: "Follow up",
      count: counts.quotesExpiringSoon,
      label: (n) => `${n} sent ${plural(n, "quotation expires", "quotations expire")} within 7 days`,
      hint: () => "Follow up before the price validity runs out.",
      href: "/admin/quotes/?status=sent",
      unavailableLabel: "Expiring quotations",
    },
  ];

  // Operations and Xero (only when the caller loaded them for this role).
  const optional = (v: number | null | undefined) => (v === undefined ? undefined : v);
  const ops: (Spec | null)[] = [
    optional(counts.opsOverdueActions) === undefined
      ? null
      : {
          id: "ops-overdue",
          action: "Open",
          count: counts.opsOverdueActions ?? null,
          label: (n) => `${n} ${plural(n, "project has", "projects have")} an overdue next step`,
          hint: () => "Do it, or move the date, from Operations.",
          href: "/admin/operations/",
          urgent: true,
          unavailableLabel: "Overdue project steps",
        },
    optional(counts.opsNoNextAction) === undefined
      ? null
      : {
          id: "ops-no-next",
          action: "Set next step",
          count: counts.opsNoNextAction ?? null,
          label: (n) => `${n} ${plural(n, "project has", "projects have")} no next step`,
          hint: () => "Every active job needs one next step with a date.",
          href: "/admin/operations/",
          unavailableLabel: "Projects without a next step",
        },
    optional(counts.opsSupplierOrders) === undefined
      ? null
      : {
          id: "ops-orders",
          action: "Open",
          count: counts.opsSupplierOrders ?? null,
          label: (n) => `${n} supplier ${plural(n, "order needs", "orders need")} action`,
          hint: () => "Not ordered yet, a problem, or late.",
          href: "/admin/operations/procurement/",
          unavailableLabel: "Supplier orders",
        },
    optional(counts.unmatchedXero) === undefined
      ? null
      : {
          id: "unmatched-xero",
          action: "Review",
          count: counts.unmatchedXero ?? null,
          label: (n) => `${n} Xero ${plural(n, "invoice needs", "invoices need")} a project`,
          hint: () => "Link each to its project once, or make it a new project.",
          href: "/admin/operations/xero-review/",
          unavailableLabel: "Unmatched Xero invoices",
        },
  ];
  specs.splice(1, 0, ...ops.filter((x): x is Spec => x !== null));

  const items: AttentionItem[] = [];
  for (const spec of specs) {
    if (spec.count === null) {
      items.push({
        id: spec.id,
        label: `${spec.unavailableLabel}: could not be loaded`,
        count: null,
        hint: "Refresh the page. If this keeps happening, check System health under Settings.",
        href: spec.href,
        action: "Open",
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
      action: spec.action,
      tone: spec.urgent ? "urgent" : "normal",
    });
  }
  const debt = counts.overdueDebtors;
  if (debt && debt > 0) {
    items.splice(1, 0, {
      id: "overdue-debtors",
      label: `R${Math.round(debt).toLocaleString("en-ZA")} is overdue from customers`,
      count: null,
      hint: "Customers who are late paying, from the last Xero refresh.",
      href: "/admin/operations/financials/",
      action: "See who",
      tone: "urgent",
    });
  }
  return items;
}
