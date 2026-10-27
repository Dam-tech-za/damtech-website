import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
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

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ who?: string; type?: string }> }) {
  await requireAdmin({ permission: "viewAudit" });
  const sp = await searchParams;
  const who = (sp.who ?? "").slice(0, 200);
  const type = (["changes", "security", "failed"] as const).find((t) => t === sp.type) ?? "all";

  let rows: AuditRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("audit_log")
      .select(
        "id, action, actor_email, entity_type, entity_id, created_at, metadata",
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      loadError = "Audit log could not be loaded right now.";
    } else {
      rows = (data ?? []) as AuditRow[];
    }
  } catch {
    loadError = "Audit log is not available yet.";
  }

  const people = [...new Set(rows.map((r) => r.actor_email).filter((e): e is string => Boolean(e)))].sort();
  const visible = rows.filter(
    (r) =>
      (!who || r.actor_email === who) &&
      (type === "all" ||
        (type === "security" && isSecurityAction(r.action)) ||
        (type === "failed" && isFailedAction(r.action)) ||
        (type === "changes" && !isSecurityAction(r.action) && !isFailedAction(r.action))),
  );

  return (
    <div className="admin-stack--page">
      <AdminPageHeader title="Activity log" description="Who did what in the admin, newest first. Sign-ins and refused access are included." />

      <form method="get" className="ops-board-filters" aria-label="Filter the activity log">
        <AdminSelect name="who" defaultValue={who} aria-label="Person">
          <option value="">Everyone</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect name="type" defaultValue={type} aria-label="Kind">
          <option value="all">Everything</option>
          <option value="changes">Changes to records</option>
          <option value="security">Sign-ins and access</option>
          <option value="failed">Failed or refused</option>
        </AdminSelect>
        <button type="submit" className="admin-btn admin-btn--secondary">
          Show
        </button>
      </form>

      <AdminPanel>
        {loadError ? (
          <AdminErrorState title="The activity log could not be loaded." message={loadError} />
        ) : visible.length === 0 ? (
          <AdminEmptyState compact title={rows.length ? "Nothing matches." : "No activity yet."} description={rows.length ? "Choose Everyone and Everything to see all of it." : "Sign-ins and changes will show here."} />
        ) : (
          <ul className="audit-feed">
            {visible.map((row) => {
              const failed = isFailedAction(row.action);
              const security = isSecurityAction(row.action);
              const href = entityHref(row.entity_type, row.entity_id);
              const what = describe(row);
              return (
                <li key={row.id} className={`audit-feed__item${failed ? " audit-feed__item--failed" : security ? " audit-feed__item--security" : ""}`}>
                  <span className="audit-feed__text">
                    <strong>{personName(row.actor_email)}</strong> {what.verb}{" "}
                    {href ? <Link href={href}>{what.object}</Link> : what.object}
                  </span>
                  <time className="ops-table__meta" dateTime={row.created_at} title={new Date(row.created_at).toLocaleString("en-ZA")}>
                    {relative(row.created_at)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

/** "info@dam-tech.co.za" → "info"; missing → "The system". */
function personName(email: string | null): string {
  if (!email) return "The system";
  return email.split("@")[0];
}

const ENTITY_WORDS: Record<string, string> = {
  rfq: "an enquiry",
  quote: "a quotation",
  customer: "a customer",
  ops_project: "a project",
  order: "an order",
  catalogue_order: "an order",
  supplier: "a supplier",
  admin_profile: "a user",
  settings: "the settings",
};

/** Readable sentence parts from a stored action such as "ops_project.stage_changed". */
function describe(row: AuditRow): { verb: string; object: string } {
  const action = row.action.split(".").pop() ?? row.action;
  const words = action.replace(/_/g, " ").toLowerCase();
  const object = ENTITY_WORDS[row.entity_type] ?? row.entity_type.replace(/_/g, " ");
  const rest = words.startsWith(row.entity_type.replace(/_/g, " ")) ? words.slice(row.entity_type.length).trim() : words;
  if (/login|sign.?in/.test(rest)) return { verb: "signed in", object: "" };
  if (/logout|sign.?out/.test(rest)) return { verb: "signed out", object: "" };
  // "stage changed" → "changed the stage of"; "created" → "created".
  const m = /^(.+) (created|updated|deleted|changed|linked|archived|sent|approved)$/.exec(rest);
  if (m) return { verb: `${m[2]} the ${m[1]} of`, object };
  return { verb: rest || "changed", object };
}

function entityHref(type: string, id: string | null): string | null {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (type === "rfq") return `/admin/rfqs/${id}/`;
  if (type === "quote") return `/admin/quotes/${id}/`;
  if (type === "customer") return `/admin/customers/${id}/`;
  if (type === "ops_project") return `/admin/operations/projects/${id}/`;
  return null;
}

function relative(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
