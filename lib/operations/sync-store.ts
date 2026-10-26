import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentSummary } from "./payment.ts";
import type { InvoiceLinkRow, OpsSyncStore, SyncProject, SyncRunResult, SyncTrigger } from "./sync.ts";
import type { PaymentStatus } from "./types.ts";
import { PAYMENT_STATUS_LABELS } from "./lifecycle.ts";

/**
 * Supabase implementation of OpsSyncStore. Needs the service-role client
 * (ops_* tables are closed to anon and authenticated). Server-only.
 */

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export function createSupabaseSyncStore(db: SupabaseClient): OpsSyncStore {
  return {
    async startRun(trigger: SyncTrigger) {
      const { data, error } = await db.rpc("ops_start_sync_run", { p_kind: "xero_projects", p_trigger: trigger });
      fail("start sync run", error);
      return (data as string | null) ?? null;
    },

    async finishRun(runId: string, result: SyncRunResult) {
      const { error } = await db
        .from("ops_sync_runs")
        .update({
          status: result.status === "skipped" ? "failed" : result.status,
          finished_at: new Date().toISOString(),
          quotes_seen: result.counts.quotes_seen,
          projects_created: result.counts.projects_created,
          invoices_linked: result.counts.invoices_linked,
          projects_updated: result.counts.projects_updated,
          error: result.errors.length ? result.errors.slice(0, 20).join("\n").slice(0, 4000) : null,
          detail: {
            baseline: result.baseline,
            quotes_linked: result.counts.quotes_linked,
            quotes_ignored: result.counts.quotes_ignored,
            created_project_ids: result.createdProjectIds,
          },
        })
        .eq("id", runId);
      fail("finish sync run", error);
    },

    async hasBaseline() {
      const { count, error } = await db
        .from("ops_sync_runs")
        .select("id", { count: "exact", head: true })
        .eq("kind", "xero_projects")
        .in("status", ["ok", "partial"])
        .eq("detail->>baseline", "true");
      fail("check baseline", error);
      return (count ?? 0) > 0;
    },

    async knownQuoteIds() {
      const { data, error } = await db.from("ops_xero_quote_links").select("xero_quote_id");
      fail("read quote links", error);
      return new Set((data ?? []).map((r) => String(r.xero_quote_id)));
    },

    async ignoredQuoteIds() {
      const { data, error } = await db.from("ops_xero_quote_ignores").select("xero_quote_id");
      fail("read ignored quotes", error);
      return new Set((data ?? []).map((r) => String(r.xero_quote_id)));
    },

    async recordIgnoredQuotes(rows) {
      const { error } = await db.from("ops_xero_quote_ignores").upsert(rows, { onConflict: "xero_quote_id", ignoreDuplicates: true });
      fail("record ignored quotes", error);
    },

    async refreshQuoteStatuses(rows) {
      for (const row of rows) {
        const { error } = await db
          .from("ops_xero_quote_links")
          .update({ xero_status: row.xero_status, last_synced_at: new Date().toISOString() })
          .eq("xero_quote_id", row.xero_quote_id)
          .neq("xero_status", row.xero_status);
        fail("refresh quote status", error);
      }
    },

    async importQuote(payload) {
      const { data, error } = await db.rpc("ops_import_accepted_quote", { p: payload });
      fail("import quote", error);
      const row = (Array.isArray(data) ? data[0] : data) as { result_project_id: string; result_created: boolean } | null;
      if (!row?.result_project_id) throw new Error("import quote: no project returned");
      return { projectId: row.result_project_id, created: row.result_created === true };
    },

    async listProjects() {
      const { data, error } = await db
        .from("ops_projects")
        .select(
          "id, customer_name, stage, xero_quote_numbers, xero_invoice_numbers, quoted_total_incl_vat, payment_status, amount_invoiced, amount_paid, amount_due, created_at, ops_xero_quote_links(quote_date)",
        );
      fail("read projects", error);
      return (data ?? []).map((p): SyncProject => {
        const dates = ((p.ops_xero_quote_links as { quote_date: string | null }[] | null) ?? [])
          .map((l) => l.quote_date)
          .filter((d): d is string => Boolean(d))
          .sort();
        return {
          id: p.id,
          customer_name: p.customer_name,
          stage: p.stage,
          xero_quote_numbers: p.xero_quote_numbers ?? [],
          xero_invoice_numbers: p.xero_invoice_numbers ?? [],
          since: dates[0] ?? null,
          quoted_total_incl_vat: p.quoted_total_incl_vat === null ? null : Number(p.quoted_total_incl_vat),
          payment_status: p.payment_status as PaymentStatus,
          amount_invoiced: Number(p.amount_invoiced),
          amount_paid: Number(p.amount_paid),
          amount_due: Number(p.amount_due),
        };
      });
    },

    async existingInvoiceLinks() {
      const { data, error } = await db.from("ops_xero_invoice_links").select("xero_invoice_id, project_id, match_method, kind");
      fail("read invoice links", error);
      return new Map(
        (data ?? []).map((r) => [String(r.xero_invoice_id), { project_id: r.project_id, match_method: r.match_method, kind: r.kind }]),
      );
    },

    async upsertInvoiceLinks(rows: InvoiceLinkRow[]) {
      const now = new Date().toISOString();
      const { error } = await db
        .from("ops_xero_invoice_links")
        .upsert(rows.map((r) => ({ ...r, last_synced_at: now })), { onConflict: "xero_invoice_id" });
      fail("save invoice links", error);
    },

    async invoiceLinksByProject() {
      const { data, error } = await db
        .from("ops_xero_invoice_links")
        .select(
          "project_id, xero_invoice_id, invoice_number, reference, kind, xero_status, total_incl_vat, amount_paid, amount_due, invoice_date, due_date, match_method",
        );
      fail("read invoice links", error);
      const map = new Map<string, InvoiceLinkRow[]>();
      for (const r of data ?? []) {
        const row: InvoiceLinkRow = {
          ...r,
          total_incl_vat: Number(r.total_incl_vat),
          amount_paid: Number(r.amount_paid),
          amount_due: Number(r.amount_due),
        } as InvoiceLinkRow;
        const list = map.get(row.project_id) ?? [];
        list.push(row);
        map.set(row.project_id, list);
      }
      return map;
    },

    async updateProjectPayment(projectId: string, summary: PaymentSummary, previous: PaymentStatus) {
      const now = new Date().toISOString();
      const { error } = await db
        .from("ops_projects")
        .update({
          payment_status: summary.status,
          amount_invoiced: summary.invoiced,
          amount_paid: summary.paid,
          amount_due: summary.due,
          payment_synced_at: now,
        })
        .eq("id", projectId);
      fail("update project payment", error);
      if (summary.status !== previous) {
        const { error: activityError } = await db.from("ops_project_activity").insert({
          project_id: projectId,
          actor_label: "Xero sync",
          kind: "payment.status_changed",
          summary: `Payment: ${PAYMENT_STATUS_LABELS[previous]} → ${PAYMENT_STATUS_LABELS[summary.status]}`,
          data: { from: previous, to: summary.status, paid: summary.paid, due: summary.due },
        });
        fail("log payment change", activityError);
      }
    },
  };
}
