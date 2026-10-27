"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import { writeAuditLog } from "@/lib/auth/audit";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { checkNextAction, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { summarisePayment } from "@/lib/operations/payment";
import { guessInvoiceKind } from "@/lib/operations/payment";
import {
  DOCUMENT_KINDS,
  TASK_KINDS,
  isProjectService,
  isProjectStage,
} from "@/lib/operations/types";

/**
 * Project management actions added in Operations 2.0 part 2. Every write is
 * validated here (server side), runs after the admin role check in
 * adminOpsDb, and leaves an activity entry. Money is never written by hand:
 * linking a Xero invoice only records which project it belongs to; amounts
 * come from Xero.
 */

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
const money = (formData: FormData, name: string): number | null | "invalid" => {
  const raw = text(formData, name, 20).replace(/[\sR,]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : "invalid";
};
const httpsUrl = (value: string | null): string | null | "invalid" => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "invalid";
  } catch {
    return "invalid";
  }
};

function refresh(projectId?: string) {
  revalidatePath("/admin/operations/");
  revalidatePath("/admin/operations/projects/");
  revalidatePath("/admin/operations/procurement/");
  revalidatePath("/admin/operations/xero-review/");
  if (projectId) revalidatePath(`/admin/operations/projects/${projectId}/`);
}

type Actor = { id: string; label: string };

async function actor() {
  const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
  return { db, admin, who: { id: admin.user.id, label: admin.profile.full_name || admin.profile.email } as Actor };
}

async function log(db: SupabaseClient, projectId: string, who: Actor, kind: string, summary: string, data: Record<string, unknown> = {}) {
  const { error } = await db.from("ops_project_activity").insert({
    project_id: projectId,
    actor_id: who.id,
    actor_label: who.label,
    kind,
    summary,
    data,
  });
  if (error) console.error("[operations] activity log failed:", error.message);
}

function fail(context: string, error: unknown): AdminActionState {
  unstable_rethrow(error);
  console.error(`[operations] ${context}:`, error);
  return actionFailure(describeActionError(error));
}

const splitNumbers = (raw: string, prefix: RegExp): string[] =>
  [...new Set(raw.toUpperCase().split(/[\s,;/+]+/).map((s) => s.trim()).filter((s) => prefix.test(s)))];

// ---------------------------------------------------------------------------
// Create a project by hand
// ---------------------------------------------------------------------------

export async function createProjectAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const title = text(formData, "title", 200);
  const customer = text(formData, "customer_name", 200);
  const service = text(formData, "service", 40) || "unclassified";
  const stage = text(formData, "stage", 40) || "awaiting_deposit";
  if (!title) return actionFailure("Give the project a name.");
  if (!customer) return actionFailure("Enter the customer.");
  if (!isProjectService(service)) return actionFailure("Choose a service.");
  if (!isProjectStage(stage) || stage === "completed") return actionFailure("Choose a starting stage.");
  const next = checkNextAction(stage, text(formData, "next_action", 600), text(formData, "next_action_due", 10));
  if (!next.ok) return actionFailure(next.reason);
  const quotes = splitNumbers(text(formData, "xero_quote_numbers", 300), /^QU-?\d{3,6}$/).map((q) => q.replace("-", ""));
  const invoices = splitNumbers(text(formData, "xero_invoice_numbers", 300), /^INV-?\d{3,6}$/);
  const supplyOnly = formData.get("is_supply_only") === "on";
  if (supplyOnly && (stage === "in_progress" || stage === "handover")) return actionFailure("Supply-only jobs skip the installation stages.");

  let createdId: string | null = null;
  try {
    const { db, admin, who } = await actor();
    if (quotes.length) {
      const { data: clash, error: clashError } = await db
        .from("ops_projects")
        .select("id, title")
        .overlaps("xero_quote_numbers", quotes)
        .limit(1);
      if (clashError) throw clashError;
      if (clash?.length) return actionFailure(`${quotes.join(", ")} is already on “${clash[0].title}”. Open that project instead.`);
    }
    const { data, error } = await db
      .from("ops_projects")
      .insert({
        title,
        customer_name: customer,
        service,
        is_supply_only: supplyOnly,
        materials_by_client: formData.get("materials_by_client") === "on",
        site_location: optionalText(formData, "site_location", 300),
        scope: optionalText(formData, "scope", 8000),
        contact_person: optionalText(formData, "contact_person", 200),
        contact_phone: optionalText(formData, "contact_phone", 40),
        contact_email: optionalText(formData, "contact_email", 200),
        stage,
        next_action: next.action,
        next_action_due: next.due,
        next_action_owner: optionalText(formData, "next_action_owner", 120),
        xero_quote_numbers: quotes,
        xero_invoice_numbers: invoices,
        source: "manual",
      })
      .select("id")
      .single();
    if (error) throw error;
    createdId = data.id as string;
    await log(db, createdId, who, "project.created", `Project created by hand${quotes.length ? ` (${quotes.join(", ")})` : ""}`);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "ops_project.created",
      entityType: "ops_project",
      entityId: createdId,
      afterData: { title, customer_name: customer, stage, quotes },
    });
    refresh(createdId);
  } catch (error) {
    return fail("create project", error);
  }
  redirect(`/admin/operations/projects/${createdId}/?created=1`);
}

// ---------------------------------------------------------------------------
// People, client supplies, OneDrive, Xero numbers
// ---------------------------------------------------------------------------

export async function updateProjectPeopleAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  const lead = text(formData, "project_lead_id", 64);
  if (lead && !UUID.test(lead)) return actionFailure("Choose a project lead.");
  const onedrive = httpsUrl(optionalText(formData, "onedrive_url", 1000));
  if (onedrive === "invalid") return actionFailure("The OneDrive link must start with https://.");
  const title = text(formData, "title", 200);
  const customer = text(formData, "customer_name", 200);
  if (!title || !customer) return actionFailure("The project name and customer are required.");
  try {
    const { db, who } = await actor();
    const { error } = await db
      .from("ops_projects")
      .update({
        title,
        customer_name: customer,
        project_lead_id: lead || null,
        next_action_owner: optionalText(formData, "next_action_owner", 120),
        materials_by_client: formData.get("materials_by_client") === "on",
        onedrive_url: onedrive,
      })
      .eq("id", id);
    if (error) throw error;
    await log(db, id, who, "people.updated", "Name, lead, owner or OneDrive folder updated");
    refresh(id);
    return actionSuccess("Saved.");
  } catch (error) {
    return fail("people", error);
  }
}

/** Link a project to Xero quote or invoice numbers; the next sync attaches them. */
export async function linkXeroNumbersAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  const raw = text(formData, "numbers", 300);
  const quotes = splitNumbers(raw, /^QU-?\d{3,6}$/).map((q) => q.replace("-", ""));
  const invoices = splitNumbers(raw, /^INV-?\d{3,6}$/);
  if (!quotes.length && !invoices.length) return actionFailure("Enter a Xero number such as QU0301 or INV0143.");
  try {
    const { db, who } = await actor();
    const { data: project, error: readError } = await db
      .from("ops_projects")
      .select("xero_quote_numbers, xero_invoice_numbers")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!project) return actionFailure("This project no longer exists.");
    if (quotes.length) {
      const { data: clash, error: clashError } = await db
        .from("ops_projects")
        .select("title")
        .overlaps("xero_quote_numbers", quotes)
        .neq("id", id)
        .limit(1);
      if (clashError) throw clashError;
      if (clash?.length) return actionFailure(`${quotes.join(", ")} already belongs to “${clash[0].title}”.`);
    }
    if (invoices.length) {
      const { data: clash, error: clashError } = await db
        .from("ops_projects")
        .select("title")
        .overlaps("xero_invoice_numbers", invoices)
        .neq("id", id)
        .limit(1);
      if (clashError) throw clashError;
      if (clash?.length) return actionFailure(`${invoices.join(", ")} already belongs to “${clash[0].title}”.`);
    }
    const { error } = await db
      .from("ops_projects")
      .update({
        xero_quote_numbers: [...new Set([...(project.xero_quote_numbers ?? []), ...quotes])],
        xero_invoice_numbers: [...new Set([...(project.xero_invoice_numbers ?? []), ...invoices])],
      })
      .eq("id", id);
    if (error) throw error;
    await log(db, id, who, "xero.numbers_linked", `Linked Xero ${[...quotes, ...invoices].join(", ")}`);
    refresh(id);
    return actionSuccess("Linked. The next Xero sync attaches the quote or invoice and its amounts.");
  } catch (error) {
    return fail("link numbers", error);
  }
}

// ---------------------------------------------------------------------------
// Next action from the dashboard: done (with the following action) or move
// ---------------------------------------------------------------------------

export async function completeNextActionAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db, who } = await actor();
    const { data: project, error: readError } = await db
      .from("ops_projects")
      .select("stage, next_action, next_action_due")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!project || !isProjectStage(project.stage)) return actionFailure("This project no longer exists.");
    const next = checkNextAction(project.stage, text(formData, "next_action", 600), text(formData, "next_action_due", 10));
    if (!next.ok) return actionFailure(`Done. Now ${next.reason.charAt(0).toLowerCase()}${next.reason.slice(1)}`);
    const { error } = await db
      .from("ops_projects")
      .update({ next_action: next.action, next_action_due: next.due, next_action_owner: optionalText(formData, "next_action_owner", 120) })
      .eq("id", id);
    if (error) throw error;
    await log(db, id, who, "next_action.done", `Done: ${project.next_action ?? "—"}. Next: ${next.action} (by ${next.due})`, {
      done: project.next_action,
      done_due: project.next_action_due,
    });
    refresh(id);
    return actionSuccess("Marked done and the next action is set.");
  } catch (error) {
    return fail("complete next action", error);
  }
}

export async function rescheduleNextActionAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const due = text(formData, "next_action_due", 10);
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  if (!DATE.test(due)) return actionFailure("Choose the new date.");
  try {
    const { db, who } = await actor();
    const { data: project, error: readError } = await db
      .from("ops_projects")
      .select("next_action, next_action_due")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!project?.next_action) return actionFailure("Set a next action on the project first.");
    const { error } = await db.from("ops_projects").update({ next_action_due: due }).eq("id", id);
    if (error) throw error;
    await log(db, id, who, "next_action.rescheduled", `Rescheduled “${project.next_action}” from ${project.next_action_due ?? "no date"} to ${due}`);
    refresh(id);
    return actionSuccess(`Moved to ${due}.`);
  } catch (error) {
    return fail("reschedule", error);
  }
}

// ---------------------------------------------------------------------------
// Archive (completed projects only)
// ---------------------------------------------------------------------------

export async function archiveProjectAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const archive = formData.get("archive") === "true";
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db, admin, who } = await actor();
    const { data: project, error: readError } = await db.from("ops_projects").select("stage").eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!project) return actionFailure("This project no longer exists.");
    if (archive && project.stage !== "completed") return actionFailure("Only completed projects can be archived.");
    const { error } = await db.from("ops_projects").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
    if (error) throw error;
    await log(db, id, who, archive ? "project.archived" : "project.unarchived", archive ? "Archived" : "Restored from the archive");
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: archive ? "ops_project.archived" : "ops_project.unarchived",
      entityType: "ops_project",
      entityId: id,
    });
    refresh(id);
    return actionSuccess(archive ? "Project archived." : "Project restored.");
  } catch (error) {
    return fail("archive", error);
  }
}

// ---------------------------------------------------------------------------
// Tasks and checklists
// ---------------------------------------------------------------------------

export async function addTaskAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = text(formData, "project_id", 64);
  const title = text(formData, "title", 300);
  const kind = text(formData, "kind", 20) || "task";
  const due = optionalDate(formData, "due_date");
  if (!UUID.test(projectId)) return actionFailure("This project could not be found.");
  if (!title) return actionFailure("Write the task.");
  if (!(TASK_KINDS as readonly string[]).includes(kind)) return actionFailure("Choose a task type.");
  if (due === "invalid") return actionFailure("Use a valid date.");
  try {
    const { db, who } = await actor();
    const { error } = await db.from("ops_project_tasks").insert({
      project_id: projectId,
      title,
      kind,
      due_date: due,
      owner: optionalText(formData, "owner", 120),
    });
    if (error) throw error;
    await log(db, projectId, who, "task.added", `Task added: ${title}`);
    refresh(projectId);
    return actionSuccess("Task added.");
  } catch (error) {
    return fail("add task", error);
  }
}

export async function toggleTaskAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const done = formData.get("done") === "true";
  if (!UUID.test(id)) return actionFailure("This task could not be found.");
  try {
    const { db, who } = await actor();
    const { data: task, error } = await db
      .from("ops_project_tasks")
      .update({ done, completed_at: done ? new Date().toISOString() : null })
      .eq("id", id)
      .select("project_id, title")
      .maybeSingle();
    if (error) throw error;
    if (!task) return actionFailure("This task no longer exists.");
    await log(db, task.project_id, who, done ? "task.done" : "task.reopened", `${done ? "Done" : "Reopened"}: ${task.title}`);
    refresh(task.project_id);
    return actionSuccess(done ? "Task done." : "Task reopened.");
  } catch (error) {
    return fail("toggle task", error);
  }
}

export async function deleteTaskAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This task could not be found.");
  try {
    const { db, who } = await actor();
    const { data: task, error } = await db.from("ops_project_tasks").delete().eq("id", id).select("project_id, title").maybeSingle();
    if (error) throw error;
    if (!task) return actionFailure("This task no longer exists.");
    await log(db, task.project_id, who, "task.removed", `Task removed: ${task.title}`);
    refresh(task.project_id);
    return actionSuccess("Task removed.");
  } catch (error) {
    return fail("delete task", error);
  }
}

// ---------------------------------------------------------------------------
// Notes and documents (OneDrive links)
// ---------------------------------------------------------------------------

export async function addNoteAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = text(formData, "project_id", 64);
  const note = text(formData, "note", 4000);
  if (!UUID.test(projectId)) return actionFailure("This project could not be found.");
  if (!note) return actionFailure("Write the note.");
  try {
    const { db, who } = await actor();
    const { error } = await db.from("ops_project_activity").insert({
      project_id: projectId,
      actor_id: who.id,
      actor_label: who.label,
      kind: "note",
      summary: note,
    });
    if (error) throw error;
    refresh(projectId);
    return actionSuccess("Note added.");
  } catch (error) {
    return fail("note", error);
  }
}

export async function addDocumentAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = text(formData, "project_id", 64);
  const title = text(formData, "title", 200);
  const kind = text(formData, "kind", 30) || "other";
  const url = httpsUrl(optionalText(formData, "url", 1000));
  if (!UUID.test(projectId)) return actionFailure("This project could not be found.");
  if (!title) return actionFailure("Name the document.");
  if (!url || url === "invalid") return actionFailure("Paste the OneDrive share link (https://…).");
  if (!(DOCUMENT_KINDS as readonly string[]).includes(kind)) return actionFailure("Choose a document type.");
  try {
    const { db, who } = await actor();
    const { error } = await db.from("ops_project_documents").insert({ project_id: projectId, title, url, kind, created_by: who.id });
    if (error) throw error;
    await log(db, projectId, who, "document.added", `Document linked: ${title}`);
    refresh(projectId);
    return actionSuccess("Document linked.");
  } catch (error) {
    return fail("document", error);
  }
}

export async function removeDocumentAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This document could not be found.");
  try {
    const { db, who } = await actor();
    const { data: doc, error } = await db.from("ops_project_documents").delete().eq("id", id).select("project_id, title").maybeSingle();
    if (error) throw error;
    if (!doc) return actionFailure("This document link no longer exists.");
    await log(db, doc.project_id, who, "document.removed", `Document link removed: ${doc.title}`);
    refresh(doc.project_id);
    return actionSuccess("Link removed. The file itself stays in OneDrive.");
  } catch (error) {
    return fail("remove document", error);
  }
}

// ---------------------------------------------------------------------------
// Supplier orders: full edit
// ---------------------------------------------------------------------------

export async function editMaterialOrderAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const supplier = text(formData, "supplier_name", 200);
  const description = text(formData, "description", 1000);
  const received = optionalDate(formData, "received_date");
  const expected = optionalDate(formData, "expected_date");
  const cost = money(formData, "cost_excl_vat");
  if (!UUID.test(id)) return actionFailure("This supplier order could not be found.");
  if (!supplier || !description) return actionFailure("Supplier and materials are required.");
  if (received === "invalid" || expected === "invalid") return actionFailure("Use valid dates.");
  if (cost === "invalid") return actionFailure("Enter the cost as a number, excluding VAT.");
  try {
    const { db, who } = await actor();
    const { data: order, error } = await db
      .from("ops_material_orders")
      .update({
        supplier_name: supplier,
        description,
        quantity: optionalText(formData, "quantity", 200),
        unit: optionalText(formData, "unit", 40),
        supplier_reference: optionalText(formData, "supplier_reference", 200),
        expected_date: expected,
        received_date: received,
        fulfilment_notes: optionalText(formData, "fulfilment_notes", 1000),
        cost_excl_vat: cost,
        xero_bill_number: optionalText(formData, "xero_bill_number", 60),
        notes: optionalText(formData, "notes", 2000),
      })
      .eq("id", id)
      .select("project_id")
      .maybeSingle();
    if (error) throw error;
    if (!order) return actionFailure("This supplier order no longer exists.");
    await log(db, order.project_id, who, "material.edited", `Supplier order edited: ${supplier} – ${description.slice(0, 80)}`);
    refresh(order.project_id);
    return actionSuccess("Supplier order saved.");
  } catch (error) {
    return fail("edit material", error);
  }
}

// ---------------------------------------------------------------------------
// Unmatched Xero invoices: link once, or dismiss
// ---------------------------------------------------------------------------

export async function linkUnmatchedInvoiceAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  const projectId = text(formData, "project_id", 64);
  if (!UUID.test(id)) return actionFailure("This Xero record could not be found.");
  if (!UUID.test(projectId)) return actionFailure("Choose the project this invoice belongs to.");
  try {
    const { db, admin, who } = await actor();
    const { data: entry, error: readError } = await db.from("ops_xero_unmatched").select("*").eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!entry) return actionFailure("This Xero record no longer exists.");
    if (entry.status !== "open") return actionFailure("This record was already handled.");
    const { data: project, error: projectError } = await db
      .from("ops_projects")
      .select("id, title, quoted_total_incl_vat, xero_invoice_numbers")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return actionFailure("That project no longer exists.");

    const quoted = project.quoted_total_incl_vat === null ? null : Number(project.quoted_total_incl_vat);
    const { error: linkError } = await db.from("ops_xero_invoice_links").upsert(
      {
        project_id: projectId,
        xero_invoice_id: entry.xero_invoice_id,
        invoice_number: entry.invoice_number,
        reference: entry.reference,
        kind: guessInvoiceKind(entry.reference, Number(entry.total_incl_vat), quoted),
        xero_status: entry.xero_status,
        total_incl_vat: entry.total_incl_vat,
        amount_paid: entry.amount_paid,
        amount_due: entry.amount_due,
        invoice_date: entry.invoice_date,
        due_date: entry.due_date,
        match_method: "manual",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "xero_invoice_id" },
    );
    if (linkError) throw linkError;
    // Remember the relationship so later syncs never ask again.
    if (entry.invoice_number) {
      await db
        .from("ops_projects")
        .update({ xero_invoice_numbers: [...new Set([...(project.xero_invoice_numbers ?? []), String(entry.invoice_number).toUpperCase()])] })
        .eq("id", projectId);
    }
    const { error: closeError } = await db
      .from("ops_xero_unmatched")
      .update({ status: "linked", resolved_project_id: projectId, resolved_by: who.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (closeError) throw closeError;

    await recomputeProjectPayment(db, projectId, quoted);
    await log(db, projectId, who, "invoice.linked_manually", `Invoice ${entry.invoice_number ?? entry.xero_invoice_id} linked by hand`);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "ops.xero_invoice_linked",
      entityType: "ops_project",
      entityId: projectId,
      afterData: { invoice: entry.invoice_number, xero_invoice_id: entry.xero_invoice_id },
    });
    refresh(projectId);
    return actionSuccess(`${entry.invoice_number ?? "Invoice"} linked to ${project.title}.`);
  } catch (error) {
    return fail("link unmatched", error);
  }
}

export async function dismissUnmatchedAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return actionFailure("This Xero record could not be found.");
  try {
    const { db, who } = await actor();
    const { data, error } = await db
      .from("ops_xero_unmatched")
      .update({ status: "dismissed", resolved_by: who.id, resolved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "open")
      .select("invoice_number")
      .maybeSingle();
    if (error) throw error;
    if (!data) return actionFailure("This record was already handled.");
    refresh();
    return actionSuccess(`${data.invoice_number ?? "Invoice"} marked as not belonging to a project.`);
  } catch (error) {
    return fail("dismiss unmatched", error);
  }
}

/** Recompute a project's cached payment fields from its linked invoices (same rules as the sync). */
async function recomputeProjectPayment(db: SupabaseClient, projectId: string, quoted: number | null) {
  const { data: links, error } = await db
    .from("ops_xero_invoice_links")
    .select("xero_status, total_incl_vat, amount_paid, amount_due, due_date")
    .eq("project_id", projectId);
  if (error) throw error;
  const summary = summarisePayment(
    (links ?? []).map((l) => ({
      status: l.xero_status,
      total: Number(l.total_incl_vat),
      amount_paid: Number(l.amount_paid),
      amount_due: Number(l.amount_due),
      due_date: l.due_date,
    })),
    quoted,
    todayInSouthAfrica(),
  );
  const { error: updateError } = await db
    .from("ops_projects")
    .update({
      payment_status: summary.status,
      amount_invoiced: summary.invoiced,
      amount_paid: summary.paid,
      amount_due: summary.due,
      payment_synced_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (updateError) throw updateError;
}
