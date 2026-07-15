import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuditPage() {
  await requireAdmin({ permission: "viewAudit" });

  let rows: Array<{
    id: string;
    action: string;
    actor_email: string | null;
    entity_type: string;
    created_at: string;
  }> = [];
  let loadError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, action, actor_email, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      loadError = error.message;
    } else {
      rows = data ?? [];
    }
  } catch {
    loadError = "Audit log is not available yet.";
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>Audit Log</h2>
      </header>
      {loadError ? (
        <div className="admin-empty">
          <p>Unable to load audit entries.</p>
          <p className="admin-empty__hint">{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          <p>No audit events yet.</p>
          <p className="admin-empty__hint">
            Successful logins and access-denied events will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString("en-ZA")}</td>
                  <td>{row.actor_email ?? "—"}</td>
                  <td>{row.action}</td>
                  <td>{row.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
