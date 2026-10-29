import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { getRfqStatusCounts } from "@/lib/rfq/list";
import { getRfqInbox } from "@/lib/admin/rfqs/get-rfq-inbox";
import type { RfqInboxFilters } from "@/lib/admin/rfqs/rfq-inbox-types";
import {
  buildFilterParams,
  canViewRfqContact,
} from "@/lib/admin/rfqs/rfq-inbox-utils";
import { bulkAssignRfqAction, bulkUpdateRfqStatusAction } from "./actions";
import { RfqStatusStrip } from "@/components/admin/rfqs/RfqStatusStrip";
import { RfqHeaderToolbar } from "@/components/admin/rfqs/RfqHeaderToolbar";
import { RfqActiveFilters } from "@/components/admin/rfqs/RfqActiveFilters";
import { RfqInboxTable } from "@/components/admin/rfqs/RfqInboxTable";
import { RfqEmptyState } from "@/components/admin/rfqs/RfqEmptyState";
import { RfqDeleteToast } from "@/components/admin/rfqs/RfqDeleteToast";
import { AdminErrorState, AdminListMemory, AdminPageHeader } from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<RfqInboxFilters>;
};

export default async function AdminRfqsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const supabase = await createClient();
  const [result, statusCounts, { data: staff }] = await Promise.all([
    getRfqInbox(filters),
    getRfqStatusCounts(),
    supabase
      .from("admin_profiles")
      .select("id, email, full_name")
      .eq("is_active", true)
      .order("email"),
  ]);

  const canExport = canPerform(admin.profile.role, "exportRfqs");
  const canManage = canPerform(admin.profile.role, "manageRfqs");
  const canDelete = canPerform(admin.profile.role, "deleteRfqs");
  const showContact = canViewRfqContact(admin.profile.role);
  const exportHref = `/admin/rfqs/export/?${buildFilterParams(filters).toString()}`;
  const refreshedAt = new Date().toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const hasActiveFilters = buildFilterParams(filters).toString().length > 0;

  return (
    <div className="admin-stack--page rfq-inbox-page">
      <AdminPageHeader title="Enquiries" description="Quote requests and messages from the website." />

      <RfqHeaderToolbar
        filters={filters}
        staff={staff ?? []}
        canManage={canManage}
        canExport={canExport}
        exportHref={exportHref}
      />

      <Suspense fallback={null}>
        <RfqDeleteToast />
        <AdminListMemory listPath="/admin/rfqs/" />
      </Suspense>

      <RfqStatusStrip counts={statusCounts} filters={filters} />

      <RfqActiveFilters filters={filters} />

      {result.error ? (
        <AdminErrorState
          title="Enquiries could not be loaded."
          message="Please retry shortly. If the problem continues, contact support."
        />
      ) : result.rows.length === 0 ? (
        <RfqEmptyState
          variant={!hasActiveFilters ? "none" : "filtered"}
        />
      ) : (
        <RfqInboxTable
          rows={result.rows}
          filters={filters}
          total={result.total}
          totalUnfiltered={result.totalUnfiltered}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          showContact={showContact}
          canManage={canManage}
          canDelete={canDelete}
          staff={staff ?? []}
          bulkStatusAction={bulkUpdateRfqStatusAction}
          bulkAssignAction={bulkAssignRfqAction}
          refreshedAt={refreshedAt}
        />
      )}
    </div>
  );
}
