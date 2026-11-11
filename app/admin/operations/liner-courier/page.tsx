import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { COURIER_DEPOTS, getCourierConfig, type CourierDepotId } from "@/lib/courier";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { AdminInfoBanner, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { LinerCourierBoard } from "@/components/admin/operations/liner-courier/LinerCourierBoard";
import type { LinerCourierHistoryRow } from "@/components/admin/operations/liner-courier/LinerQuoteDrawer";

export const metadata: Metadata = { title: "Liner courier" };

async function loadHistory(): Promise<{ rows: LinerCourierHistoryRow[]; missing: boolean }> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("liner_courier_quotes")
    .select(
      "id, created_at, updated_at, reference, customer_name, shape, inputs, area_m2, gsm, quantity, weight_kg, parcel_length_cm, parcel_width_cm, parcel_height_cm, parcel_source, depot, delivery_address, declared_value, courier_rates, rated_at, chosen_service_name, chosen_amount, formal_quote_status, rfq_id, quote_id, notes, quotes(quote_number), rfqs(rfq_number)",
    )
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[liner-courier] history not loaded:", error.message);
    return { rows: [], missing: true };
  }
  return { rows: (data ?? []) as unknown as LinerCourierHistoryRow[], missing: false };
}

export default async function LinerCourierPage() {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "liner-courier")) notFound();
  const config = getCourierConfig();
  const depots = config.ok
    ? (Object.keys(config.config.depots) as CourierDepotId[]).map((id) => ({
        id,
        label: `${COURIER_DEPOTS[id]} (${config.config.depots[id]?.address.city})`,
      }))
    : [];
  const history = await loadHistory();

  return (
    <div className="admin-stack--page ops ops-projects-page">
      <AdminPageHeader title="Liner courier" description="Courier Guy rates for custom liners, by status." />
      {!config.ok ? (
        <AdminInfoBanner tone="warning">
          The Courier Guy is not set up ({config.reason}), so live rates are off.
        </AdminInfoBanner>
      ) : null}
      {history.missing ? <AdminInfoBanner tone="muted">Saved courier quotes could not be loaded.</AdminInfoBanner> : null}
      <AdminPanel className="admin-panel--board">
        <LinerCourierBoard
          rows={history.rows}
          depots={depots}
          courierReady={config.ok}
          canEditQuotes={canPerform(admin.profile.role, "manageQuotes")}
        />
      </AdminPanel>
    </div>
  );
}
