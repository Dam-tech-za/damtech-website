"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { actionFailure, actionSuccess, describeActionError, type AdminActionState } from "@/lib/admin/action-state";
import { writeAuditLog } from "@/lib/auth/audit";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { locationFromXeroCity } from "@/lib/operations/xero-contact";
import { documentKindOf, getXeroDocumentWithContact, XeroDocumentError } from "@/lib/operations/xero-document";
import {
  buildProjectXeroReview,
  type ReviewApplyItem,
  type ReviewFieldKey,
  type ReviewPreview,
} from "@/lib/operations/xero-review";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bridgeOrNull() {
  const config = xeroBridgeConfigFromEnv();
  return config ? createXeroBridgeClient(config) : null;
}

function refresh(projectId?: string) {
  revalidatePath("/admin/operations/");
  revalidatePath("/admin/operations/projects/");
  if (projectId) revalidatePath(`/admin/operations/projects/${projectId}/`);
}

export type PreviewFromXeroResult =
  | { ok: true; preview: ReviewPreview }
  | { ok: false; error: string; needsDocument?: boolean };

export async function previewFromXeroAction(
  projectId: string,
  documentNumber?: string | null,
): Promise<PreviewFromXeroResult> {
  try {
    if (!UUID.test(projectId)) return { ok: false, error: "This project could not be found." };
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const bridge = bridgeOrNull();
    if (!bridge) return { ok: false, error: "The Xero connection is not set up on this site." };
    const result = await buildProjectXeroReview(db, bridge, projectId, documentNumber);
    if ("error" in result) return { ok: false, error: result.error, needsDocument: result.needsDocument };
    return { ok: true, preview: result };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] preview from xero:", error);
    return { ok: false, error: describeActionError(error) };
  }
}

export type AppliedFromXero = {
  ok: true;
  message: string;
  logId: string | null;
  patch: Record<string, unknown>;
};

export async function applyFromXeroAction(payload: {
  projectId: string;
  documentNumber: string;
  contactId: string;
  accepted: ReviewApplyItem[];
}): Promise<AppliedFromXero | AdminActionState> {
  try {
    const projectId = payload.projectId;
    if (!UUID.test(projectId)) return actionFailure("This project could not be found.");
    const accepted = Array.isArray(payload.accepted) ? payload.accepted.slice(0, 20) : [];
    if (!accepted.length) return actionFailure("Accept at least one field first.");

    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { data: project, error: readError } = await db
      .from("ops_projects")
      .select(
        "id, title, customer_name, contact_person, contact_phone, contact_email, quoted_total_incl_vat, site_province, site_town, xero_quote_numbers, xero_invoice_numbers, xero_contact_id",
      )
      .eq("id", projectId)
      .maybeSingle();
    if (readError) throw readError;
    if (!project) return actionFailure("This project no longer exists.");

    // Re-read the document on the server: the contact id written comes from
    // Xero's document, never from the browser.
    const kind = documentKindOf(payload.documentNumber);
    const bridge = bridgeOrNull();
    if (!kind) return actionFailure("This isn't a Xero quote or invoice number.");
    if (!bridge) return actionFailure("The Xero connection is not set up on this site.");
    let verifiedContactId: string;
    try {
      const doc = await getXeroDocumentWithContact(bridge, kind, payload.documentNumber, {
        projectId,
        storedContactId: project.xero_contact_id ?? null,
      });
      verifiedContactId = doc.contactId;
    } catch (error) {
      if (error instanceof XeroDocumentError) return actionFailure(error.message);
      throw error;
    }
    if (payload.contactId && payload.contactId !== verifiedContactId) {
      console.error("[operations] apply from xero: contact changed since preview", {
        projectId,
        document: payload.documentNumber,
        previewContactId: payload.contactId,
        documentContactId: verifiedContactId,
      });
      return actionFailure(`The customer on ${payload.documentNumber} changed in Xero since you opened this. Open it again. Nothing was changed.`);
    }

    const patch: Record<string, unknown> = {};
    const changes: Array<{
      projectId: string;
      projectTitle: string;
      field: string;
      from: string | null;
      to: string | null;
      xero_document: string;
    }> = [];

    const record = (field: string, from: string | null | undefined, to: string | null | undefined) => {
      const a = (from ?? "").trim() || null;
      const b = (to ?? "").trim() || null;
      if (a === b) return;
      changes.push({
        projectId,
        projectTitle: project.title,
        field,
        from: a,
        to: b,
        xero_document: payload.documentNumber,
      });
    };

    for (const item of accepted) {
      const field = item.field as ReviewFieldKey;
      const value = String(item.value ?? "").trim();
      switch (field) {
        case "title":
          if (value) {
            record("title", project.title, value);
            patch.title = value.slice(0, 200);
          }
          break;
        case "customer_name":
          record("contact_person", project.contact_person, value || null);
          patch.contact_person = value ? value.slice(0, 200) : null;
          if (!project.customer_name?.trim() && value) {
            record("customer_name", project.customer_name, value);
            patch.customer_name = value.slice(0, 200);
          }
          break;
        case "contact_phone":
          record("contact_phone", project.contact_phone, value || null);
          patch.contact_phone = value ? value.slice(0, 40) : null;
          break;
        case "contact_email":
          record("contact_email", project.contact_email, value || null);
          patch.contact_email = value ? value.slice(0, 200) : null;
          break;
        case "xero_number": {
          const n = value.replace(/[-\s]/g, "").toUpperCase();
          if (n.startsWith("QU")) {
            const next = [n];
            record("xero_quote_numbers", (project.xero_quote_numbers ?? []).join(","), next.join(","));
            patch.xero_quote_numbers = next;
          } else if (n.startsWith("INV")) {
            const next = [n];
            record("xero_invoice_numbers", (project.xero_invoice_numbers ?? []).join(","), next.join(","));
            patch.xero_invoice_numbers = next;
          }
          break;
        }
        case "quoted_total_incl_vat": {
          const n = Number(value.replace(/[\sR,]/g, ""));
          if (Number.isFinite(n) && n >= 0) {
            const rounded = Math.round(n * 100) / 100;
            record("quoted_total_incl_vat", project.quoted_total_incl_vat == null ? null : String(project.quoted_total_incl_vat), String(rounded));
            patch.quoted_total_incl_vat = rounded;
          }
          break;
        }
        case "location": {
          const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
          const province = parts.length >= 2 ? parts[0] : null;
          const town = parts.length >= 2 ? parts.slice(1).join(", ") : parts[0] ?? null;
          const mapped = locationFromXeroCity(town, province);
          const nextProvince = mapped?.site_province ?? province;
          const nextTown = mapped?.site_town ?? town;
          record("site_province", project.site_province, nextProvince);
          record("site_town", project.site_town, nextTown);
          if (nextProvince) patch.site_province = nextProvince;
          if (nextTown) patch.site_town = nextTown;
          if (mapped) {
            Object.assign(patch, mapped);
          }
          break;
        }
        default:
          break;
      }
    }

    if (UUID.test(verifiedContactId)) {
      record("xero_contact_id", project.xero_contact_id, verifiedContactId);
      patch.xero_contact_id = verifiedContactId;
    }

    if (!Object.keys(patch).length) return actionFailure("Nothing to update.");

    const { error: updateError } = await db.from("ops_projects").update(patch).eq("id", projectId);
    if (updateError) throw updateError;

    let logId: string | null = null;
    const { data: logRow, error: logError } = await db
      .from("ops_xero_sync_log")
      .insert({
        actor_id: admin.user.id,
        actor_email: admin.profile.email,
        change_count: changes.length,
        changes,
        sync_counts: { project_id: projectId, document: payload.documentNumber, kind: "review_card" },
      })
      .select("id")
      .maybeSingle();
    if (logError) console.error("[operations] xero review log failed:", logError.message);
    else logId = (logRow?.id as string) ?? null;

    await db.from("ops_project_activity").insert({
      project_id: projectId,
      actor_id: admin.user.id,
      actor_label: admin.profile.full_name || admin.profile.email,
      kind: "xero.review_applied",
      summary: `${changes.length} field${changes.length === 1 ? "" : "s"} updated from ${payload.documentNumber}`,
      data: { changes, logId },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "ops_project.xero_review",
      entityType: "ops_project",
      entityId: projectId,
      afterData: { document: payload.documentNumber, fields: changes.length },
    });

    refresh(projectId);
    return {
      ok: true,
      message: `${changes.length} field${changes.length === 1 ? "" : "s"} updated from ${payload.documentNumber}`,
      logId,
      patch,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] apply from xero:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function undoFromXeroLogAction(logId: string): Promise<AdminActionState> {
  try {
    if (!UUID.test(logId)) return actionFailure("Nothing to undo.");
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { data: last, error } = await db
      .from("ops_xero_sync_log")
      .select("id, changes, undone_at, sync_counts")
      .eq("id", logId)
      .maybeSingle();
    if (error) throw error;
    if (!last) return actionFailure("Nothing to undo.");
    if (last.undone_at) return actionFailure("Already undone.");

    const changes = (last.changes as Array<{ projectId: string; field: string; from: string | null }>) ?? [];
    const byProject = new Map<string, Record<string, string | null | string[]>>();
    for (const c of changes) {
      const row = byProject.get(c.projectId) ?? {};
      if (c.field === "xero_quote_numbers" || c.field === "xero_invoice_numbers") {
        row[c.field] = c.from ? c.from.split(",").map((s) => s.trim()).filter(Boolean) : [];
      } else {
        row[c.field] = c.from;
      }
      byProject.set(c.projectId, row);
    }
    for (const [id, patch] of byProject) {
      const { error: updateError } = await db.from("ops_projects").update(patch).eq("id", id);
      if (updateError) throw updateError;
    }
    await db
      .from("ops_xero_sync_log")
      .update({ undone_at: new Date().toISOString(), undone_by: admin.user.id })
      .eq("id", logId);
    refresh();
    return actionSuccess(`Undid ${changes.length} field${changes.length === 1 ? "" : "s"}.`);
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}
