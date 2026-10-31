import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { canPerform } from "@/lib/auth/permissions";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { loadProcurement } from "@/lib/operations/procurement-store";
import { AdminErrorState, AdminInfoBanner, AdminPageHeader } from "@/components/admin/ui";
import { ProcurementWorkspace } from "@/components/admin/operations/procurement/ProcurementWorkspace";

export const metadata: Metadata = { title: "Supplier orders" };

type PageProps = { searchParams: Promise<{ show?: string }> };

const header = (
  <AdminPageHeader
    title="Supplier orders"
    description="Every supplier order across your projects. Open one for its items, deliveries, documents and Xero bills. Payment comes from Xero."
  />
);

export default async function ProcurementPage(props: PageProps) {
  try {
    return await ProcurementPageInner(props);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[procurement] page:", error instanceof Error ? error.message : error);
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }
}

async function ProcurementPageInner({ searchParams }: PageProps) {
  const sp = await searchParams;
  const includeClosed = sp.show === "all";
  const { db, admin } = await adminOpsDb();
  const [load, projects] = await Promise.all([
    loadProcurement(db, { includeClosed }),
    db.from("ops_projects").select("id, title").is("archived_at", null).neq("stage", "completed").order("title").limit(500),
  ]);

  if (load.state === "not_installed") {
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminInfoBanner tone="info">Supplier order details are not switched on yet. Nothing else is affected.</AdminInfoBanner>
      </div>
    );
  }
  if (load.state === "error") {
    return (
      <div className="admin-stack--page ops">
        {header}
        <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." />
      </div>
    );
  }

  return (
    <div className="admin-stack--page ops">
      {header}
      <ProcurementWorkspace
        orders={load.orders}
        projects={(projects.data ?? []) as { id: string; title: string }[]}
        canEdit={canPerform(admin.profile.role, "manageOperations")}
        canApprove={canPerform(admin.profile.role, "approveProcurement")}
        today={todayInSouthAfrica()}
        includeClosed={includeClosed}
        closedHref={includeClosed ? "/admin/operations/procurement/" : "/admin/operations/procurement/?show=all"}
      />
    </div>
  );
}
