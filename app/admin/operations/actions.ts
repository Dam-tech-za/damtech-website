"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import { writeAuditLog } from "@/lib/auth/audit";
import { adminOpsDb } from "@/lib/operations/admin-db";
import {
  checkNextAction,
  checkStageChange,
  MATERIAL_STATUS_LABELS,
  stageLabel,
} from "@/lib/operations/lifecycle";
import { runConfiguredXeroSync } from "@/lib/operations/run-sync";
import {
  isMaterialFulfilment,
  isMaterialOrderStatus,
  isProjectService,
  isProjectStage,
  type PaymentStatus,
  type ProjectStage,
} from "@/lib/operations/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (formData: FormData, name: string, max = 2000): string =>
  String(formData.get(name) ?? "").trim().slice(0, max);
const optionalText = (formData: FormData, name: string, max = 2000): string | null => text(formData, name, max) || null;
const optionalDate = (formData: FormData, name: string): string | null | "invalid" => {
  const v = text(formData, name, 10);
  if (!v) return null;
  return DATE.test(v) ? v : "invalid";
};

function refresh(projectId?: string) {
  revalidatePath("/admin/operations/");
  revalidatePath("/admin/operations/projects/");
  revalidatePath("/admin/operations/procurement/");
  if (projectId) revalidatePath(`/admin/operations/projects/${projectId}/`);
}

async function logActivity(
  db: SupabaseClient,
  projectId: string,
  actor: { id: string; label: string },
  kind: string,
  summary: string,
  data: Record<string, unknown> = {},
) {
  const { error } = await db.from("ops_project_activity").insert({
    project_id: projectId,
    actor_id: actor.id,
    actor_label: actor.label,
    kind,
    summary,
    data,
  });
  if (error) console.error("[operations] activity log failed:", error.message);
}

type LoadedProject = {
  id: string;
  title: string;
  stage: ProjectStage;
  is_supply_only: boolean;
  payment_status: PaymentStatus;
  next_action: string | null;
  next_action_due: string | null;
};

async function loadProject(db: SupabaseClient, id: string): Promise<LoadedProject | null> {
  const { data, error } = await db
    .from("ops_projects")
    .select("id, title, stage, is_supply_only, payment_status, next_action, next_action_due")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as LoadedProject | null) ?? null;
}

export async function updateNextActionAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const project = await loadProject(db, id);
    if (!project) return actionFailure("This project no longer exists.");
    const check = checkNextAction(project.stage, text(formData, "next_action", 600), text(formData, "next_action_due", 10));
    if (!check.ok) return actionFailure(check.reason);

    const { error } = await db
      .from("ops_projects")
      .update({ next_action: check.action || null, next_action_due: check.due })
      .eq("id", id);
    if (error) throw error;
    await logActivity(db, id, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "next_action.updated",
      `Next action: ${check.action}${check.due ? ` (by ${check.due})` : ""}`, { before: project.next_action, before_due: project.next_action_due });
    refresh(id);
    return actionSuccess("Next action saved.");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] next action:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function changeStageAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const stage = text(formData, "stage", 40);
  if (!UUID.test(id) || !isProjectStage(stage)) return actionFailure("Choose a stage.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const project = await loadProject(db, id);
    if (!project) return actionFailure("This project no longer exists.");
    const check = checkStageChange(project, stage, { allowWithoutDeposit: formData.get("allow_without_deposit") === "on" });
    if (!check.ok) return actionFailure(check.reason);

    const reopening = project.stage === "completed" && stage !== "completed";
    if (reopening && !(project.next_action && project.next_action_due)) {
      return actionFailure("Set a next action before reopening this project.");
    }
    const { error } = await db
      .from("ops_projects")
      .update({ stage, completed_at: stage === "completed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
    const summary = `Stage: ${stageLabel(project.stage, project.is_supply_only)} → ${stageLabel(stage, project.is_supply_only)}`;
    await logActivity(db, id, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "stage.changed", summary, {
      from: project.stage,
      to: stage,
      without_deposit: formData.get("allow_without_deposit") === "on",
    });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "ops_project.stage_changed",
      entityType: "ops_project",
      entityId: id,
      beforeData: { stage: project.stage },
      afterData: { stage },
    });
    refresh(id);
    return actionSuccess(`Moved to ${stageLabel(stage, project.is_supply_only)}.`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] stage change:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function setOnHoldAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  const onHold = formData.get("on_hold") === "true";
  const reason = optionalText(formData, "on_hold_reason", 300);
  if (onHold && !reason) return actionFailure("Say why the project is on hold.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { error } = await db
      .from("ops_projects")
      .update({ on_hold: onHold, on_hold_reason: onHold ? reason : null })
      .eq("id", id);
    if (error) throw error;
    await logActivity(db, id, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "hold.changed",
      onHold ? `Put on hold: ${reason}` : "Taken off hold");
    refresh(id);
    return actionSuccess(onHold ? "Project put on hold." : "Project taken off hold.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export async function updateProjectDetailsAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const service = text(formData, "service", 40);
  if (!UUID.test(id) || !isProjectService(service)) return actionFailure("Choose a service.");
  const start = optionalDate(formData, "scheduled_start");
  const end = optionalDate(formData, "scheduled_end");
  if (start === "invalid" || end === "invalid") return actionFailure("Use valid dates.");
  if (start && end && end < start) return actionFailure("The end date is before the start date.");
  const kmRaw = text(formData, "one_way_km", 12);
  const km = kmRaw ? Number(kmRaw.replace(",", ".")) : null;
  if (km !== null && (!Number.isFinite(km) || km < 0 || km > 5000)) return actionFailure("Distance must be between 0 and 5,000 km.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const project = await loadProject(db, id);
    if (!project) return actionFailure("This project no longer exists.");
    const supplyOnly = formData.get("is_supply_only") === "on";
    if (supplyOnly && (project.stage === "in_progress" || project.stage === "handover")) {
      return actionFailure("Move the project out of installation stages before marking it supply-only.");
    }
    const { error } = await db
      .from("ops_projects")
      .update({
        service,
        is_supply_only: supplyOnly,
        site_location: optionalText(formData, "site_location", 300),
        one_way_km: km,
        contact_person: optionalText(formData, "contact_person", 200),
        contact_phone: optionalText(formData, "contact_phone", 40),
        contact_email: optionalText(formData, "contact_email", 200),
        crew: optionalText(formData, "crew", 300),
        scheduled_start: start,
        scheduled_end: end,
        scope: optionalText(formData, "scope", 8000),
        needs_review: false,
      })
      .eq("id", id);
    if (error) throw error;
    await logActivity(db, id, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "details.updated", "Project details updated");
    refresh(id);
    return actionSuccess("Details saved.");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] details:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function addMaterialOrderAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = text(formData, "project_id", 64);
  const supplier = text(formData, "supplier_name", 200);
  const description = text(formData, "description", 1000);
  const status = text(formData, "status", 40) || "quote_requested";
  const fulfilment = text(formData, "fulfilment", 40) || "tbc";
  const expected = optionalDate(formData, "expected_date");
  if (!UUID.test(projectId)) return actionFailure("This project could not be found.");
  if (!supplier) return actionFailure("Enter the supplier.");
  if (!description) return actionFailure("Describe the materials.");
  if (!isMaterialOrderStatus(status) || !isMaterialFulfilment(fulfilment)) return actionFailure("Choose a status.");
  if (expected === "invalid") return actionFailure("Use a valid date.");
  const costRaw = text(formData, "cost_excl_vat", 20).replace(/[\sR,]/g, "");
  const cost = costRaw ? Number(costRaw) : null;
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) return actionFailure("Enter the cost as a number, excluding VAT.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { error } = await db.from("ops_material_orders").insert({
      project_id: projectId,
      supplier_name: supplier,
      description,
      quantity: optionalText(formData, "quantity", 200),
      supplier_reference: optionalText(formData, "supplier_reference", 200),
      status,
      fulfilment,
      expected_date: expected,
      cost_excl_vat: cost,
      notes: optionalText(formData, "notes", 2000),
    });
    if (error) throw error;
    await logActivity(db, projectId, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "material.added",
      `Supplier order added: ${supplier} – ${description.slice(0, 80)}`);
    refresh(projectId);
    return actionSuccess("Supplier order added.");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] add material:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function updateMaterialOrderAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const status = text(formData, "status", 40);
  const expected = optionalDate(formData, "expected_date");
  if (!UUID.test(id) || !isMaterialOrderStatus(status)) return actionFailure("Choose a status.");
  if (expected === "invalid") return actionFailure("Use a valid date.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { data: before, error: readError } = await db
      .from("ops_material_orders")
      .select("project_id, status, supplier_name")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!before) return actionFailure("This supplier order no longer exists.");
    const { error } = await db
      .from("ops_material_orders")
      .update({
        status,
        expected_date: expected,
        supplier_reference: optionalText(formData, "supplier_reference", 200),
      })
      .eq("id", id);
    if (error) throw error;
    if (before.status !== status) {
      await logActivity(db, before.project_id, { id: admin.user.id, label: admin.profile.full_name || admin.profile.email }, "material.status",
        `${before.supplier_name}: ${MATERIAL_STATUS_LABELS[before.status as keyof typeof MATERIAL_STATUS_LABELS] ?? before.status} → ${MATERIAL_STATUS_LABELS[status]}`);
    }
    refresh(before.project_id);
    return actionSuccess("Supplier order updated.");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] update material:", error);
    return actionFailure(describeActionError(error));
  }
}

function describeSync(result: Awaited<ReturnType<typeof runConfiguredXeroSync>>): AdminActionState {
  if (result.status === "skipped") {
    if (result.reason === "already_running") return actionFailure("A sync is already running. Try again in a minute.");
    if (result.reason === "needs_baseline") return actionFailure("Run the first (baseline) sync before regular syncs.");
    return actionFailure("The Xero bridge key is not set on the server (XERO_BRIDGE_API_KEY).");
  }
  if (result.status === "failed") return actionFailure(`Sync failed: ${result.errors[0] ?? "unknown error"}`);
  const c = result.counts;
  const parts = result.baseline
    ? [`${c.quotes_ignored} existing quotes recorded`, `${c.quotes_linked} linked to current projects`]
    : [`${c.projects_created} new projects`, `${c.invoices_linked} invoices linked`, `${c.projects_updated} payment updates`];
  return result.status === "partial"
    ? actionFailure(`Sync finished with problems (${parts.join(", ")}). ${result.errors[0] ?? ""}`)
    : actionSuccess(`Synced with Xero: ${parts.join(", ")}.`);
}

export async function runXeroSyncAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const { admin } = await adminOpsDb({ permission: "runXeroSync" });
    const baseline = formData.get("baseline") === "true";
    const result = await runConfiguredXeroSync("manual", { baseline });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: baseline ? "ops.xero_baseline_sync" : "ops.xero_sync",
      entityType: "ops_sync",
      afterData: { status: result.status, reason: result.reason, counts: result.counts },
    });
    refresh();
    return describeSync(result);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] sync:", error);
    return actionFailure(describeActionError(error));
  }
}
