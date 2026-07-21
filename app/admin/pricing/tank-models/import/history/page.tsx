import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export default async function AdminTankModelsImportHistoryPage() {
  await requireAdmin({ permission: "managePricing" });
  const supabase = await createClient();

  const { data: batches, error } = await supabase
    .from("pricing_import_batches")
    .select(
      "id, filename, imported_at, row_count, success_count, created_count, updated_count, skipped_count, failure_count, warning_count, status, import_mode, template_type, rollback_status, error_report",
    )
    .eq("template_type", "tank_models")
    .order("imported_at", { ascending: false })
    .limit(50);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Tank model import history"
        description="Tank-model CSV import batches, results and audit trail."
        secondaryAction={{ href: "/admin/pricing/tank-models/import/", label: "Back to import" }}
      />

      <AdminPanel title="Recent tank imports">
        {error ? (
          <AdminEmptyState
            title="Unable to load import history."
            description={`${error.message} — apply migration 20260721140000_tank_models_import.sql`}
          />
        ) : !(batches ?? []).length ? (
          <AdminEmptyState
            title="No tank imports yet."
            description="Completed tank-model CSV imports will appear here."
            compact
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Rows</th>
                  <th>New / Updated</th>
                  <th>Skipped</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {(batches ?? []).map((batch) => (
                  <tr key={batch.id}>
                    <td>{new Date(batch.imported_at).toLocaleString("en-ZA")}</td>
                    <td>{batch.filename}</td>
                    <td>{batch.row_count}</td>
                    <td>
                      {batch.created_count ?? batch.success_count} / {batch.updated_count ?? 0}
                    </td>
                    <td>{batch.skipped_count}</td>
                    <td>{batch.failure_count}</td>
                    <td>
                      <AdminStatusBadge status={batch.status} domain="pricing" />
                    </td>
                    <td>
                      {batch.error_report ? (
                        <details>
                          <summary>Errors</summary>
                          <pre className="admin-help-text">{batch.error_report}</pre>
                        </details>
                      ) : (
                        "—"
                      )}
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
