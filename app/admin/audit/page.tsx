import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

type AuditRow = {
  id: string;
  action: string;
  actor_email: string | null;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function isSecurityAction(action: string): boolean {
  const key = action.toLowerCase();
  return (
    key.includes("login") ||
    key.includes("logout") ||
    key.includes("access") ||
    key.includes("denied") ||
    key.includes("role") ||
    key.includes("allowlist") ||
    key.includes("permission") ||
    key.includes("token") ||
    key.includes("security")
  );
}

function isFailedAction(action: string): boolean {
  const key = action.toLowerCase();
  return (
    key.includes("fail") ||
    key.includes("denied") ||
    key.includes("error") ||
    key.includes("reject")
  );
}

export default async function AdminAuditPage() {
  await requireAdmin({ permission: "viewAudit" });

  let rows: AuditRow[] = [];
  let loadError: string | null = null;
  let eventsToday = 0;
  let securityEvents = 0;
  let failedActions = 0;
  let dataChanges = 0;

  try {
    const supabase = await createClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("audit_log")
      .select(
        "id, action, actor_email, entity_type, entity_id, created_at, metadata",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      loadError = "Audit log could not be loaded right now.";
    } else {
      rows = (data ?? []) as AuditRow[];
      eventsToday = rows.filter(
        (row) => new Date(row.created_at) >= startOfDay,
      ).length;
      securityEvents = rows.filter((row) => isSecurityAction(row.action)).length;
      failedActions = rows.filter((row) => isFailedAction(row.action)).length;
      dataChanges = rows.filter(
        (row) =>
          !isSecurityAction(row.action) &&
          !isFailedAction(row.action),
      ).length;
    }
  } catch {
    loadError = "Audit log is not available yet.";
  }

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Audit Log"
        description="Review administrative changes, security events and record history."
      />

      <AdminMetricStrip label="Audit summary">
        <AdminMetricCard
          label="Events today"
          value={eventsToday}
          tone="info"
        />
        <AdminMetricCard
          label="Security events"
          value={securityEvents}
          tone="warning"
        />
        <AdminMetricCard
          label="Failed actions"
          value={failedActions}
          tone="default"
        />
        <AdminMetricCard
          label="Data changes"
          value={dataChanges}
          tone="muted"
        />
      </AdminMetricStrip>

      <AdminPanel
        title="Recent events"
        description={`Showing the latest ${rows.length || 0} entries`}
      >
        {loadError ? (
          <AdminErrorState title="Unable to load audit entries" message={loadError} />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="No audit events yet."
            description="Successful logins, access-denied events and record changes will appear here."
          />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Reference</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const failed = isFailedAction(row.action);
                const security = isSecurityAction(row.action);
                return (
                  <tr key={row.id}>
                    <td>
                      {new Date(row.created_at).toLocaleString("en-ZA")}
                    </td>
                    <td>{row.actor_email ?? "—"}</td>
                    <td>{row.action.replaceAll("_", " ")}</td>
                    <td>{row.entity_type.replaceAll("_", " ")}</td>
                    <td>
                      <code className="admin-code">
                        {row.entity_id
                          ? `${row.entity_id.slice(0, 8)}…`
                          : "—"}
                      </code>
                    </td>
                    <td>
                      <AdminStatusBadge
                        status={
                          failed
                            ? "error"
                            : security
                              ? "warning"
                              : "operational"
                        }
                        label={
                          failed
                            ? "Failed / denied"
                            : security
                              ? "Security"
                              : "Recorded"
                        }
                        domain="system"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
