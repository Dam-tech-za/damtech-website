import type { SupabaseClient } from "@supabase/supabase-js";
import { projectMoney } from "@/lib/operations/project-money";
import type { InvoiceKind } from "@/lib/operations/types";
import type { XeroBridgeClient, XeroInvoiceSummary } from "@/lib/operations/xero-bridge";

/**
 * Re-read one project's linked Xero invoices and quotes by their Xero ids and
 * update the cached figures. Kinds chosen by a person are kept. Money only
 * comes from Xero; the project value is never set from an invoice here.
 */
export async function refreshProjectXeroCache(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  projectId: string,
  today: string,
): Promise<{ invoices: number; quotes: number; errors: string[] }> {
  const errors: string[] = [];
  const now = new Date().toISOString();
  const [{ data: invoiceLinks }, { data: quoteLinks }, { data: project }] = await Promise.all([
    db.from("ops_xero_invoice_links").select("id, xero_invoice_id, invoice_number, kind").eq("project_id", projectId),
    db.from("ops_xero_quote_links").select("id, xero_quote_id, quote_number").eq("project_id", projectId),
    db.from("ops_projects").select("quoted_total_incl_vat").eq("id", projectId).maybeSingle(),
  ]);

  let invoices = 0;
  for (const link of (invoiceLinks ?? []) as { id: string; xero_invoice_id: string; invoice_number: string | null }[]) {
    try {
      const x = await bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: link.xero_invoice_id });
      if (!x?.id) continue;
      const { error } = await db
        .from("ops_xero_invoice_links")
        .update({
          invoice_number: x.number,
          reference: x.reference,
          xero_status: x.status,
          total_incl_vat: x.total,
          amount_paid: x.amount_paid,
          amount_due: x.amount_due,
          invoice_date: x.date,
          due_date: x.due_date,
          last_synced_at: now,
        })
        .eq("id", link.id);
      if (error) errors.push(`${link.invoice_number ?? "Invoice"}: not saved`);
      else invoices += 1;
    } catch {
      errors.push(`${link.invoice_number ?? "Invoice"}: Xero did not answer`);
    }
  }

  let quotes = 0;
  for (const link of (quoteLinks ?? []) as { id: string; xero_quote_id: string; quote_number: string }[]) {
    try {
      const q = await bridge.call<{ id: string; status: string; total: number | null }>("get_quote", { quote_id: link.xero_quote_id });
      if (!q?.id) continue;
      const { error } = await db
        .from("ops_xero_quote_links")
        .update({ xero_status: q.status, total_incl_vat: q.total, last_synced_at: now })
        .eq("id", link.id);
      if (!error) quotes += 1;
    } catch {
      errors.push(`${link.quote_number}: Xero did not answer`);
    }
  }

  // Keep the project's cached totals in step with the refreshed invoices.
  const { data: fresh } = await db
    .from("ops_xero_invoice_links")
    .select("invoice_number, reference, kind, xero_status, total_incl_vat, amount_paid, amount_due, invoice_date, due_date")
    .eq("project_id", projectId);
  const value = project?.quoted_total_incl_vat == null ? null : Number(project.quoted_total_incl_vat);
  const m = projectMoney(
    ((fresh ?? []) as Record<string, unknown>[]).map((r) => ({
      invoice_number: (r.invoice_number as string | null) ?? null,
      reference: (r.reference as string | null) ?? null,
      kind: (r.kind as InvoiceKind) ?? "unclassified",
      xero_status: String(r.xero_status ?? ""),
      total_incl_vat: Number(r.total_incl_vat ?? 0),
      amount_paid: Number(r.amount_paid ?? 0),
      amount_due: Number(r.amount_due ?? 0),
      invoice_date: (r.invoice_date as string | null) ?? null,
      due_date: (r.due_date as string | null) ?? null,
    })),
    value,
    today,
  );
  await db
    .from("ops_projects")
    .update({ amount_invoiced: m.invoiced, amount_paid: m.paid, amount_due: m.due, payment_synced_at: now })
    .eq("id", projectId);

  return { invoices, quotes, errors };
}
