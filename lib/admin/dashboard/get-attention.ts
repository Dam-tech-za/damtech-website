import { canAccessNavItem } from "@/lib/auth/permissions";
import type { AdminRole } from "@/lib/auth/types";
import { adminOrdersDb } from "@/lib/orders/admin-db";
import { addDaysToIsoDate, todayIsoDateJohannesburg } from "@/lib/quotes/totals";
import { createClient } from "@/lib/supabase/server";
import {
  buildAttentionItems,
  type AttentionCounts,
  type AttentionItem,
} from "./attention";
import { getOverviewOps } from "./overview-ops";

const UNAVAILABLE: AttentionCounts = {
  newEnquiries: null,
  oldestNewSubmittedAt: null,
  informationRequired: null,
  siteMeasurement: null,
  readyForQuote: null,
  ordersAwaitingInvoice: null,
  failedEmails: null,
  failedEmailHref: null,
  quotesAwaitingApproval: null,
  quotesExpiringSoon: null,
};

type CountResult = { count: number | null; error: unknown };

function countOrNull(result: CountResult): number | null {
  return result.error ? null : (result.count ?? 0);
}

async function getRfqAttentionCounts(role: AdminRole): Promise<AttentionCounts> {
  try {
    const supabase = await createClient();
    const canOrders = canAccessNavItem(role, "orders");
    const canQuotes = canAccessNavItem(role, "quotes");
    const ordersDb = canOrders ? await adminOrdersDb().catch(() => null) : null;
    const ordersUnavailable = Promise.resolve({
      data: null,
      count: null,
      error: new Error("orders unavailable"),
    });
    const today = todayIsoDateJohannesburg();
    const in7 = addDaysToIsoDate(today, 7);

    const [
      newEnquiries,
      oldestNew,
      infoRequired,
      siteMeasurement,
      readyCount,
      reviewCount,
      expiring,
      ordersAwaitingInvoice,
      failedRfqEmails,
      failedOrderEmails,
    ] = await Promise.all([
      supabase.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("rfqs")
        .select("submitted_at")
        .eq("status", "new")
        .order("submitted_at", { ascending: true })
        .limit(1),
      supabase.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "information_required"),
      supabase.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "site_measurement_required"),
      supabase.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "ready_for_quote"),
      canQuotes
        ? supabase
            .from("quotes")
            .select("id", { count: "exact", head: true })
            .eq("status", "internal_review")
            .eq("is_latest_revision", true)
        : Promise.resolve({ count: 0, error: null }),
      canQuotes
        ? supabase
            .from("quotes")
            .select("id", { count: "exact", head: true })
            .in("status", ["sent", "viewed"])
            .eq("is_latest_revision", true)
            .gte("valid_until", today)
            .lte("valid_until", in7)
        : Promise.resolve({ count: 0, error: null }),
      ordersDb
        ? ordersDb.from("catalogue_orders").select("id", { count: "exact", head: true }).eq("status", "pending_invoice")
        : ordersUnavailable,
      supabase
        .from("rfq_communications")
        .select("rfq_id", { count: "exact" })
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(1),
      canOrders
        ? (ordersDb ?? supabase)
            .from("catalogue_orders")
            .select("id", { count: "exact" })
            .neq("status", "cancelled")
            .or("confirmation_email_status.eq.failed,internal_email_status.eq.failed")
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] as { id: string }[], count: 0, error: null }),
    ]);

    const failedRfq = countOrNull(failedRfqEmails);
    const failedOrders = canOrders ? countOrNull(failedOrderEmails) : 0;
    const failedRfqId = failedRfqEmails.data?.[0]?.rfq_id as string | undefined;
    const failedOrderId = failedOrderEmails.data?.[0]?.id as string | undefined;

    return {
      newEnquiries: countOrNull(newEnquiries),
      oldestNewSubmittedAt: oldestNew.error
        ? null
        : ((oldestNew.data?.[0]?.submitted_at as string | undefined) ?? null),
      informationRequired: countOrNull(infoRequired),
      siteMeasurement: countOrNull(siteMeasurement),
      readyForQuote: countOrNull(readyCount),
      ordersAwaitingInvoice: canOrders ? countOrNull(ordersAwaitingInvoice) : 0,
      failedEmails: failedRfq === null || failedOrders === null ? null : failedRfq + failedOrders,
      failedEmailHref: failedRfqId
        ? `/admin/rfqs/${failedRfqId}/#rfq-communication`
        : failedOrderId && canOrders
          ? `/admin/orders/${failedOrderId}/`
          : null,
      quotesAwaitingApproval: canQuotes ? countOrNull(reviewCount) : 0,
      quotesExpiringSoon: canQuotes ? countOrNull(expiring) : 0,
    };
  } catch {
    return UNAVAILABLE;
  }
}

/** Header bell list: enquiry, order, quote and Operations items that need action. */
export async function getAttentionItems(role: AdminRole): Promise<AttentionItem[]> {
  const [rfq, ops] = await Promise.all([getRfqAttentionCounts(role), getOverviewOps(role)]);
  return buildAttentionItems({ ...rfq, ...ops.attention });
}
