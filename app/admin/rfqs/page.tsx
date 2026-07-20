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
import { RfqPageHeader } from "@/components/admin/rfqs/RfqPageHeader";
import { RfqStatusStrip } from "@/components/admin/rfqs/RfqStatusStrip";
import { RfqToolbar } from "@/components/admin/rfqs/RfqToolbar";
import { RfqActiveFilters } from "@/components/admin/rfqs/RfqActiveFilters";
import { RfqInboxTable } from "@/components/admin/rfqs/RfqInboxTable";
import { RfqEmptyState } from "@/components/admin/rfqs/RfqEmptyState";
import { RfqOnboardingNote } from "@/components/admin/rfqs/RfqOnboardingNote";
import { RfqRefreshButton } from "@/components/admin/rfqs/RfqRefreshButton";
import { AdminErrorState } from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<RfqInboxFilters>;
};

export default async function AdminRfqsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const filters = await searchParams;
  const [result, statusCounts] = await Promise.all([
    getRfqInbox(filters),
    getRfqStatusCounts(),
  ]);

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("admin_profiles")
    .select("id, email, full_name")
    .eq("is_active", true)
    .order("email");

  const canExport = canPerform(admin.profile.role, "exportRfqs");
  const canManage = canPerform(admin.profile.role, "manageRfqs");
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
      <RfqPageHeader
        canExport={canExport}
        canManage={canManage}
        exportHref={exportHref}
        refreshSlot={<RfqRefreshButton />}
      />

      <RfqOnboardingNote />

      <RfqStatusStrip counts={statusCounts} filters={filters} />

      <RfqToolbar filters={filters} staff={staff ?? []} />

      <RfqActiveFilters filters={filters} />

      {result.error ? (
        <AdminErrorState
          title="RFQs could not be loaded."
          message="Please retry shortly. If the problem continues, contact support."
        />
      ) : result.rows.length === 0 ? (
        <RfqEmptyState
          variant={
            result.totalUnfiltered === 0 && !hasActiveFilters ? "none" : "filtered"
          }
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
          staff={staff ?? []}
          bulkStatusAction={bulkUpdateRfqStatusAction}
          bulkAssignAction={bulkAssignRfqAction}
          refreshedAt={refreshedAt}
        />
      )}
    </div>
  );
}
