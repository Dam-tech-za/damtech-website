import { ATTENTION_LABELS, attentionBuckets, orderNeedsAction, type AttentionBucket } from "./board.ts";
import type { OpsMaterialOrder, OpsProject } from "./types.ts";

/**
 * Daily "what needs attention" email. Plain deterministic code: the same
 * buckets as the dashboard, sent once per South African day (Mon–Sat) by the
 * ops-reminders cron. Nothing is sent when nothing is due.
 */

export type ReminderProject = Pick<
  OpsProject,
  "id" | "title" | "stage" | "on_hold" | "on_hold_reason" | "next_action" | "next_action_due" | "next_action_owner" | "needs_review" | "archived_at"
>;

export type ReminderOrder = Pick<OpsMaterialOrder, "id" | "project_id" | "supplier_name" | "description" | "status" | "expected_date"> & {
  project_title: string;
};

export type ReminderEmail = { subject: string; text: string; html: string; itemCount: number };

const REMINDER_BUCKETS: AttentionBucket[] = ["overdue", "today", "no_next_action", "on_hold", "needs_review"];

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Sunday is a rest day (business hours are Mon–Sat). */
export function isReminderDay(today: string): boolean {
  return new Date(`${today}T12:00:00Z`).getUTCDay() !== 0;
}

export function buildReminderEmail(
  projects: ReminderProject[],
  orders: ReminderOrder[],
  unmatchedInvoices: number,
  today: string,
  siteUrl: string,
): ReminderEmail | null {
  const buckets = attentionBuckets(projects, today).filter((b) => REMINDER_BUCKETS.includes(b.bucket));
  const lateOrders = orders.filter((o) => orderNeedsAction(o, today));
  const itemCount = buckets.reduce((n, b) => n + b.projects.length, 0) + lateOrders.length + (unmatchedInvoices > 0 ? 1 : 0);
  if (itemCount === 0) return null;

  const link = (path: string) => `${siteUrl.replace(/\/$/, "")}${path}`;
  const textParts: string[] = [`Damtech operations – ${today}`, ""];
  const htmlParts: string[] = [`<h2 style="margin:0 0 12px;font-family:Arial,sans-serif">What needs attention – ${escapeHtml(today)}</h2>`];

  for (const { bucket, projects: list } of buckets) {
    textParts.push(`${ATTENTION_LABELS[bucket]} (${list.length})`);
    htmlParts.push(`<h3 style="margin:16px 0 6px;font-family:Arial,sans-serif">${escapeHtml(ATTENTION_LABELS[bucket])} (${list.length})</h3><ul>`);
    for (const p of list) {
      const detail =
        bucket === "on_hold"
          ? `on hold: ${p.on_hold_reason ?? "no reason"}`
          : `${p.next_action || "no next action"}${p.next_action_due ? ` (by ${p.next_action_due})` : ""}${p.next_action_owner ? ` – ${p.next_action_owner}` : ""}`;
      const url = link(`/admin/operations/projects/${p.id}/`);
      textParts.push(`- ${p.title}: ${detail}\n  ${url}`);
      htmlParts.push(`<li><a href="${escapeHtml(url)}">${escapeHtml(p.title)}</a>: ${escapeHtml(detail)}</li>`);
    }
    textParts.push("");
    htmlParts.push("</ul>");
  }

  if (lateOrders.length) {
    textParts.push(`Supplier orders awaiting action (${lateOrders.length})`);
    htmlParts.push(`<h3 style="margin:16px 0 6px;font-family:Arial,sans-serif">Supplier orders awaiting action (${lateOrders.length})</h3><ul>`);
    for (const o of lateOrders) {
      const url = link(`/admin/operations/projects/${o.project_id}/#materials`);
      const detail = `${o.supplier_name} – ${o.description} (${o.project_title}${o.expected_date ? `, expected ${o.expected_date}` : ""})`;
      textParts.push(`- ${detail}\n  ${url}`);
      htmlParts.push(`<li><a href="${escapeHtml(url)}">${escapeHtml(detail)}</a></li>`);
    }
    textParts.push("");
    htmlParts.push("</ul>");
  }

  if (unmatchedInvoices > 0) {
    const url = link("/admin/operations/xero-review/");
    textParts.push(`${unmatchedInvoices} Xero invoice(s) need linking to a project: ${url}`, "");
    htmlParts.push(`<p><a href="${escapeHtml(url)}">${unmatchedInvoices} Xero invoice(s) need linking to a project</a></p>`);
  }

  textParts.push(`Open the dashboard: ${link("/admin/operations/")}`);
  htmlParts.push(`<p><a href="${escapeHtml(link("/admin/operations/"))}">Open the Operations dashboard</a></p>`);

  const overdue = buckets.find((b) => b.bucket === "overdue")?.projects.length ?? 0;
  const subject = overdue
    ? `Operations: ${overdue} overdue action${overdue === 1 ? "" : "s"} – ${today}`
    : `Operations: ${itemCount} item${itemCount === 1 ? "" : "s"} need attention – ${today}`;
  return { subject, text: textParts.join("\n"), html: htmlParts.join(""), itemCount };
}
