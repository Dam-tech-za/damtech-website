"use server";

import { unstable_rethrow } from "next/navigation";
import { actionFailure, actionSuccess, describeActionError, type AdminActionState } from "@/lib/admin/action-state";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { createDocumentLookup } from "@/lib/operations/xero-document";
import { buildProjectXeroReview, type ReviewApplyItem, type ReviewPreview } from "@/lib/operations/xero-review";
import { applyFromXeroAction, undoFromXeroLogAction } from "./xero-review-actions";

/**
 * Bulk "Sync from Xero…": the same per-project preview as the review card,
 * for every active project with a Xero number, shown in one review table.
 * Previewing writes nothing; applying writes only accepted lines, one
 * project at a time, each logged to ops_xero_sync_log with an undo.
 */

export type BulkPreviewItem =
  | { projectId: string; title: string; ok: true; preview: ReviewPreview }
  | { projectId: string; title: string; ok: false; error: string };

export type BulkPreviewResult =
  | {
      ok: true;
      items: BulkPreviewItem[];
      /** Projects whose fields all already match Xero. */
      alreadyMatch: number;
      withoutNumber: { projectId: string; title: string }[];
      /** True when the time budget ran out before every project was read. */
      stoppedEarly: boolean;
    }
  | { ok: false; error: string };

const MAX_PROJECTS = 60;
const CONCURRENCY = 3;
const BUDGET_MS = 45_000;

export async function previewBulkFromXeroAction(): Promise<BulkPreviewResult> {
  try {
    const { db } = await adminOpsDb({ permission: "runXeroSync" });
    const config = xeroBridgeConfigFromEnv();
    if (!config) return { ok: false, error: "The Xero connection is not set up on this site." };
    const bridge = createXeroBridgeClient({ ...config, timeoutMs: 8_000 });
    const lookup = createDocumentLookup(bridge);

    const { data, error } = await db
      .from("ops_projects")
      .select("id, title, xero_quote_numbers, xero_invoice_numbers")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(MAX_PROJECTS);
    if (error) throw error;
    const projects = (data ?? []) as { id: string; title: string; xero_quote_numbers: string[] | null; xero_invoice_numbers: string[] | null }[];
    const withNumber = projects.filter((p) => (p.xero_quote_numbers?.length ?? 0) + (p.xero_invoice_numbers?.length ?? 0) > 0);
    const withoutNumber = projects.filter((p) => !withNumber.includes(p)).map((p) => ({ projectId: p.id, title: p.title }));

    const deadline = Date.now() + BUDGET_MS;
    const items: BulkPreviewItem[] = [];
    let stoppedEarly = false;
    for (let i = 0; i < withNumber.length; i += CONCURRENCY) {
      if (Date.now() > deadline) {
        stoppedEarly = true;
        break;
      }
      const batch = withNumber.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (p): Promise<BulkPreviewItem> => {
          const result = await buildProjectXeroReview(db, bridge, p.id, null, lookup);
          return "error" in result
            ? { projectId: p.id, title: p.title, ok: false, error: result.error }
            : { projectId: p.id, title: p.title, ok: true, preview: result };
        }),
      );
      items.push(...results);
    }

    const alreadyMatch = items.filter((it) => it.ok && it.preview.rows.length === 0).length;
    return {
      ok: true,
      items: items.filter((it) => !it.ok || it.preview.rows.length > 0),
      alreadyMatch,
      withoutNumber,
      stoppedEarly,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] bulk xero preview:", error);
    return { ok: false, error: describeActionError(error) };
  }
}

export type BulkApplyResult =
  | { ok: true; message: string; logIds: string[]; failed: { projectId: string; error: string }[] }
  | AdminActionState;

export async function applyBulkFromXeroAction(payload: {
  items: { projectId: string; documentNumber: string; contactId: string; accepted: ReviewApplyItem[] }[];
}): Promise<BulkApplyResult> {
  try {
    await adminOpsDb({ permission: "runXeroSync" });
    const items = (Array.isArray(payload.items) ? payload.items : []).filter((it) => it.accepted?.length).slice(0, MAX_PROJECTS);
    if (!items.length) return actionFailure("Accept at least one line first.");
    const logIds: string[] = [];
    const failed: { projectId: string; error: string }[] = [];
    let fields = 0;
    for (const item of items) {
      // Each project is re-checked against Xero and written in one update.
      const result = await applyFromXeroAction(item);
      if (result && "patch" in result) {
        if (result.logId) logIds.push(result.logId);
        fields += item.accepted.length;
      } else {
        failed.push({ projectId: item.projectId, error: result?.message || "Update failed." });
      }
    }
    const done = items.length - failed.length;
    return {
      ok: true,
      message: `${fields} change${fields === 1 ? "" : "s"} applied on ${done} project${done === 1 ? "" : "s"}${failed.length ? `, ${failed.length} not changed` : ""}.`,
      logIds,
      failed,
    };
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export async function undoBulkFromXeroAction(logIds: string[]): Promise<AdminActionState> {
  let undone = 0;
  let lastFailure: AdminActionState | null = null;
  for (const id of (Array.isArray(logIds) ? logIds : []).slice(0, MAX_PROJECTS)) {
    const result = await undoFromXeroLogAction(id);
    if (result?.ok) undone += 1;
    else lastFailure = result;
  }
  if (!undone && lastFailure) return lastFailure;
  return actionSuccess(`Undid the changes on ${undone} project${undone === 1 ? "" : "s"}.`);
}
