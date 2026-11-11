import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PurchasesWorkspace } from "@/components/admin/orders/PurchasesWorkspace";
import {
  COURIER_DEPOTS,
  courierDepotForProvince,
  courierStatusSummary,
  getCourierConfig,
  isCourierDepotId,
  type CourierDepotId,
} from "@/lib/courier";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { listOnlinePurchases } from "@/lib/orders/list";
import type { PurchaseCourierSetup, PurchaseRowExtras } from "@/lib/orders/purchase-board";
import { isPurchaseStage } from "@/lib/orders/purchase-stage";
import { getPvcLinerBySku } from "@/lib/shop/pvc-liners";
import { pvcLinerPackedParcel } from "@/lib/shop/pvc-packing";
import { AdminErrorState, AdminListMemory, AdminPageHeader, AdminPanel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Online Purchases" };

type PageProps = { searchParams: Promise<{ q?: string; stage?: string; order?: string }> };

export default async function OnlinePurchasesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "online-purchases")) notFound();
  const sp = await searchParams;
  const { rows, error } = await listOnlinePurchases();
  const canManage = canPerform(admin.profile.role, "manageOrders");

  const config = getCourierConfig();
  const courier: PurchaseCourierSetup = config.ok
    ? {
        ok: true,
        depots: (Object.keys(config.config.depots) as CourierDepotId[]).map((id) => ({
          id,
          label: `${COURIER_DEPOTS[id]} (${config.config.depots[id]?.address.city})`,
        })),
      }
    : {
        ok: false,
        message: `${config.reason}${config.missing.length > 0 ? ` Missing settings: ${config.missing.join(", ")}.` : ""}`,
      };

  const extras: Record<string, PurchaseRowExtras> = {};
  for (const row of rows) {
    const liner = getPvcLinerBySku(row.sku);
    extras[row.id] = {
      // One parcel per liner; for more than one the admin adjusts the figures.
      defaultParcel: liner && row.quantity === 1 ? pvcLinerPackedParcel(liner) : null,
      defaultDepot: config.ok
        ? isCourierDepotId(row.courier_depot) && config.config.depots[row.courier_depot]
          ? row.courier_depot
          : courierDepotForProvince(config.config, row.billing_province)
        : "",
      depotLabel: !row.courier_depot ? "—" : isCourierDepotId(row.courier_depot) ? COURIER_DEPOTS[row.courier_depot] : row.courier_depot,
      courierSummary: row.courier_status ? courierStatusSummary(row.courier_status, row.courier_last_message) : null,
    };
  }

  const orderId = sp.order && rows.some((row) => row.id === sp.order) ? sp.order : null;

  return (
    <div className="admin-stack--page ops ops-projects-page">
      <AdminPageHeader title="Online Purchases" description="Every shop order, by stage." />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/operations/online-purchases/" />
      </Suspense>

      {error ? (
        <AdminErrorState title="Online purchases could not be loaded." message="Refresh in a moment." />
      ) : (
        <AdminPanel className="admin-panel--board">
          <PurchasesWorkspace
            rows={rows}
            extras={extras}
            courier={courier}
            canManage={canManage}
            initialStage={sp.stage && isPurchaseStage(sp.stage) ? sp.stage : null}
            initialOrderId={orderId}
            initialQ={(sp.q ?? "").trim().slice(0, 100)}
          />
        </AdminPanel>
      )}
    </div>
  );
}
