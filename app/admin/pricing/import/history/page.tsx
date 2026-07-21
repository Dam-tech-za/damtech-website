import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import {
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { rollbackImportBatchAction } from "../inventory-actions";

export default async function AdminPricingImportHistoryPage() {
  const admin = await requireAdmin({ permission: "managePricing" });
  const canRollback =
    admin.profile.role === "owner" || admin.profile.role === "admin";
  const canManage = canPerform(admin.profile.role, "managePricing");
  const supabase = await createClient();

  const { data: batches, error } = await supabase
    .from("pricing_import_batches")
    .select(
      "id, filename, imported_at, row_count, success_count, created_count, updated_count, skipped_count, failure_count, warning_count, status, import_mode, template_type, rollback_status, error_report",
    )
    .order("imported_at", { ascending: false })
    .limit(50);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Import history"
        description="CSV inventory import batches, results and eligible rollbacks."
        secondaryAction={{ href: "/admin/pricing/import/", label: "Back to import" }}
      />

      <AdminPanel title="Recent imports">
        {error ? (
          <AdminEmptyState
            title="Unable to load import history."
            description={`${error.message} — apply migration 20260720150000_pricing_import_batches.sql`}
          />
        ) : !(batches ?? []).length ? (
          <AdminEmptyState
            title="No imports yet."
            description="Completed inventory CSV imports will appear here."
            compact
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Template</th>
                  <th>Rows</th>
                  <th>New / Updated</th>
                  <th>Skipped</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(batches ?? []).map((batch) => (
                  <tr key={batch.id}>
                    <td>{new Date(batch.imported_at).toLocaleString("en-ZA")}</td>
                    <td>{batch.filename}</td>
                    <td>{batch.template_type ?? "—"}</td>
                    <td>{batch.row_count}</td>
                    <td>
                      {batch.created_count ?? batch.success_count} / {batch.updated_count ?? 0}
                    </td>
                    <td>{batch.skipped_count}</td>
                    <td>{batch.failure_count}</td>
                    <td>
                      <AdminStatusBadge status={batch.status} domain="pricing" />
                      {batch.rollback_status ? (
                        <div className="admin-help-text">{batch.rollback_status}</div>
                      ) : null}
                    </td>
                    <td>
                      {batch.error_report ? (
                        <details>
                          <summary>Errors</summary>
                          <pre className="admin-help-text">{batch.error_report}</pre>
                        </details>
                      ) : null}
                      {canRollback &&
                      canManage &&
                      batch.rollback_status === "eligible" &&
                      batch.status !== "rolled_back" ? (
                        <form
                          action={async () => {
                            "use server";
                            await rollbackImportBatchAction(batch.id);
                          }}
                        >
                          <AdminButton type="submit" variant="danger" size="sm">
                            Roll back
                          </AdminButton>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
