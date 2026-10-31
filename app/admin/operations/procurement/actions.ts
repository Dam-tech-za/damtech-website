"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { actionFailure, actionSuccess, describeActionError, type AdminActionState } from "@/lib/admin/action-state";
import { canPerform } from "@/lib/auth/permissions";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { MATERIAL_STATUS_LABELS } from "@/lib/operations/lifecycle";
import {
  ALLOWED_DOC_TYPES,
  MAX_DOC_BYTES,
  ORDER_STATUS_CHOICES,
  deliveryProgress,
  isDocType,
  parseQty,
  safeFileName,
  sniffMatchesType,
  statusAfterReceipt,
} from "@/lib/operations/procurement";
import { loadOrderExtras, type OrderDocument, type OrderReceipt } from "@/lib/operations/procurement-store";
import { MATERIAL_FULFILMENT, type MaterialFulfilment, type MaterialOrderStatus } from "@/lib/operations/types";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv, type XeroInvoiceSummary } from "@/lib/operations/xero-bridge";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const BUCKET = "procurement-documents";

const text = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? "").trim().slice(0, max) || null;
const date = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return DATE.test(v) ? v : null;
};

function fail(context: string, error: unknown): AdminActionState {
  unstable_rethrow(error);
  console.error(`[procurement] ${context}:`, error);
  return actionFailure(describeActionError(error));
}

function refresh(projectId: string) {
  revalidatePath("/admin/operations/procurement/");
  revalidatePath(`/admin/operations/projects/${projectId}/`);
  revalidatePath("/admin/operations/calendar/");
}

async function actor() {
  const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
  return { db, admin, label: admin.profile.full_name || admin.profile.email };
}

async function log(db: SupabaseClient, projectId: string, who: { id: string; label: string }, kind: string, summary: string, data: Record<string, unknown>) {
  const { error } = await db.from("ops_project_activity").insert({ project_id: projectId, actor_id: who.id, actor_label: who.label, kind, summary, data });
  if (error) console.error("[procurement] activity log failed:", error.message);
}

async function orderRow(db: SupabaseClient, id: string) {
  const { data } = await db.from("ops_material_orders").select("id, project_id, status, supplier_name, version, received_date").eq("id", id).maybeSingle();
  return data as { id: string; project_id: string; status: MaterialOrderStatus; supplier_name: string; version: number | null; received_date: string | null } | null;
}

// ---------------------------------------------------------------------------
// Order header
// ---------------------------------------------------------------------------

/** Create or edit a supplier order. Approval needs approveProcurement. */
export async function saveOrderAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const id = String(fd.get("id") ?? "");
    const projectId = String(fd.get("project_id") ?? "");
    const supplier = text(fd, "supplier_name", 200);
    const description = text(fd, "description", 500);
    const status = String(fd.get("status") ?? "not_ordered") as MaterialOrderStatus;
    const fulfilment = String(fd.get("fulfilment") ?? "tbc") as MaterialFulfilment;
    if (id && !UUID.test(id)) return actionFailure("That order could not be found.");
    if (!id && !UUID.test(projectId)) return actionFailure("Pick the project this order is for.");
    if (!supplier) return actionFailure("Enter the supplier.");
    if (!description) return actionFailure("Describe what is being ordered.");
    if (!ORDER_STATUS_CHOICES.includes(status)) return actionFailure("Choose a status.");
    if (!(MATERIAL_FULFILMENT as readonly string[]).includes(fulfilment)) return actionFailure("Choose delivery or collection.");
    const lead = parseQty(String(fd.get("lead_time_days") ?? ""));
    if (lead !== null && (!Number.isInteger(lead) || lead < 0 || lead > 365)) return actionFailure("Lead time is a whole number of days (0–365).");

    const { db, admin, label } = await actor();
    const who = { id: admin.user.id, label };
    const before = id ? await orderRow(db, id) : null;
    if (id && !before) return actionFailure("That order no longer exists.");

    const approving = status === "approved" && before?.status !== "approved";
    if (approving && !canPerform(admin.profile.role, "approveProcurement")) {
      return actionFailure("Only an owner or admin can approve a supplier order.");
    }

    const row = {
      supplier_name: supplier,
      description,
      status,
      fulfilment,
      order_reference: text(fd, "order_reference", 80),
      supplier_reference: text(fd, "supplier_reference", 80),
      order_date: date(fd, "order_date"),
      expected_date: date(fd, "expected_date"),
      required_on_site: date(fd, "required_on_site"),
      quote_valid_until: date(fd, "quote_valid_until"),
      lead_time_days: lead,
      delivery_instructions: text(fd, "delivery_instructions", 1000),
      notes: text(fd, "notes", 2000),
      updated_by: admin.user.id,
      ...(approving ? { approved_by: admin.user.id, approved_at: new Date().toISOString() } : {}),
    };

    if (before) {
      const expected = Number(fd.get("expected_version"));
      const current = before.version ?? 1;
      if (Number.isInteger(expected) && expected > 0 && expected !== current) {
        return actionFailure("Someone else changed this order a moment ago. Close it and open it again.");
      }
      const { data, error } = await db
        .from("ops_material_orders")
        .update({ ...row, version: current + 1 })
        .eq("id", before.id)
        .eq("version", current)
        .select("id");
      if (error) return fail("update order", error);
      if (!data?.length) return actionFailure("Someone else changed this order a moment ago. Close it and open it again.");
      if (before.status !== status) {
        await log(db, before.project_id, who, "material.status", `${supplier}: ${MATERIAL_STATUS_LABELS[before.status] ?? before.status} → ${MATERIAL_STATUS_LABELS[status]}`, { order_id: before.id });
      }
      refresh(before.project_id);
      return actionSuccess("Order saved.");
    }

    const { data, error } = await db
      .from("ops_material_orders")
      .insert({ ...row, project_id: projectId, created_by: admin.user.id })
      .select("id")
      .single();
    if (error) return fail("add order", error);
    await log(db, projectId, who, "material.added", `Supplier order added: ${supplier} (${description})`, { order_id: data.id });
    refresh(projectId);
    return actionSuccess("Order added.");
  } catch (error) {
    return fail("save order", error);
  }
}

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------

export async function saveLineAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const orderId = String(fd.get("order_id") ?? "");
    const lineId = String(fd.get("line_id") ?? "");
    if (!UUID.test(orderId) || (lineId && !UUID.test(lineId))) return actionFailure("That order line could not be found.");
    const description = text(fd, "description", 300);
    const quantity = parseQty(String(fd.get("quantity") ?? ""));
    const unitCost = parseQty(String(fd.get("unit_cost_excl_vat") ?? ""));
    const discount = parseQty(String(fd.get("discount_pct") ?? "")) ?? 0;
    const vat = parseQty(String(fd.get("vat_rate") ?? "")) ?? 15;
    if (!description) return actionFailure("Describe the item.");
    if (quantity === null || quantity <= 0) return actionFailure("Enter a quantity above zero.");
    if (unitCost !== null && unitCost < 0) return actionFailure("The price cannot be negative.");
    if (discount < 0 || discount > 100 || vat < 0 || vat > 100) return actionFailure("Discount and VAT are percentages (0–100).");

    const { db } = await actor();
    const order = await orderRow(db, orderId);
    if (!order) return actionFailure("That order no longer exists.");
    const row = {
      description,
      specification: text(fd, "specification", 500),
      unit: text(fd, "unit", 20) ?? "each",
      quantity,
      unit_cost_excl_vat: unitCost,
      discount_pct: discount,
      vat_rate: vat,
    };
    if (lineId) {
      const { data: received } = await db.from("ops_order_line_progress").select("quantity_received").eq("line_id", lineId).maybeSingle();
      if (received && Number(received.quantity_received) > quantity) {
        return actionFailure(`${received.quantity_received} has already been received; the quantity cannot be lower than that.`);
      }
      const { error } = await db.from("ops_order_lines").update(row).eq("id", lineId).eq("order_id", orderId);
      if (error) return fail("update line", error);
    } else {
      const { count } = await db.from("ops_order_lines").select("id", { count: "exact", head: true }).eq("order_id", orderId);
      const { error } = await db.from("ops_order_lines").insert({ ...row, order_id: orderId, sort_order: count ?? 0 });
      if (error) return fail("add line", error);
    }
    refresh(order.project_id);
    return actionSuccess(lineId ? "Line saved." : "Line added.");
  } catch (error) {
    return fail("save line", error);
  }
}

export async function deleteLineAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const lineId = String(fd.get("line_id") ?? "");
    if (!UUID.test(lineId)) return actionFailure("That order line could not be found.");
    const { db } = await actor();
    const { count } = await db.from("ops_order_receipts").select("id", { count: "exact", head: true }).eq("line_id", lineId);
    if (count) return actionFailure("Deliveries were recorded against this line, so it cannot be removed. Reverse them first.");
    const { data, error } = await db.from("ops_order_lines").delete().eq("id", lineId).select("order_id").maybeSingle();
    if (error) return fail("delete line", error);
    const order = data ? await orderRow(db, data.order_id as string) : null;
    if (order) refresh(order.project_id);
    return actionSuccess("Line removed.");
  } catch (error) {
    return fail("delete line", error);
  }
}

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

async function settleStatus(db: SupabaseClient, orderId: string, receivedOn: string | null) {
  const order = await orderRow(db, orderId);
  if (!order) return null;
  const { data } = await db.from("ops_order_line_progress").select("quantity_ordered, quantity_received").eq("order_id", orderId);
  const progress = deliveryProgress(((data ?? []) as { quantity_ordered: number; quantity_received: number }[]).map((p) => ({ quantity: Number(p.quantity_ordered), quantity_received: Number(p.quantity_received) })));
  const next = statusAfterReceipt(order.status, progress);
  if (next !== order.status) {
    await db
      .from("ops_material_orders")
      .update({
        status: next,
        received_date: next === "collected_delivered" ? (receivedOn ?? order.received_date) : null,
        version: (order.version ?? 1) + 1,
      })
      .eq("id", orderId);
  }
  return { order, next };
}

/** One delivery or collection: accepted and rejected quantities per line. */
export async function recordReceiptAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const orderId = String(fd.get("order_id") ?? "");
    const receivedOn = date(fd, "received_on");
    if (!UUID.test(orderId)) return actionFailure("That order could not be found.");
    if (!receivedOn) return actionFailure("Enter the date it arrived or was collected.");
    const { db, admin, label } = await actor();
    const order = await orderRow(db, orderId);
    if (!order) return actionFailure("That order no longer exists.");

    const rows: Record<string, unknown>[] = [];
    for (const [key, value] of fd.entries()) {
      const m = /^accepted_([0-9a-f-]{36})$/i.exec(key);
      if (!m) continue;
      const accepted = parseQty(String(value)) ?? 0;
      const rejected = parseQty(String(fd.get(`rejected_${m[1]}`) ?? "")) ?? 0;
      if (accepted < 0 || rejected < 0) return actionFailure("Quantities cannot be negative.");
      if (accepted + rejected === 0) continue;
      rows.push({
        order_id: orderId,
        line_id: m[1],
        received_on: receivedOn,
        quantity_accepted: accepted,
        quantity_rejected: rejected,
        delivery_note_ref: text(fd, "delivery_note_ref", 80),
        notes: text(fd, "notes", 500),
        received_by: admin.user.id,
        received_by_label: label,
      });
    }
    if (!rows.length) return actionFailure("Enter at least one quantity received.");
    const { error } = await db.from("ops_order_receipts").insert(rows);
    if (error) {
      if (/over_receipt/.test(error.message)) return actionFailure("That is more than was ordered on one of the lines. Check the quantities.");
      return fail("record receipt", error);
    }
    const settled = await settleStatus(db, orderId, receivedOn);
    await log(db, order.project_id, { id: admin.user.id, label }, "material.received", `${order.supplier_name}: delivery recorded (${rows.length} line${rows.length === 1 ? "" : "s"})`, { order_id: orderId });
    refresh(order.project_id);
    return actionSuccess(settled && settled.next !== order.status ? `Delivery recorded. Status is now ${MATERIAL_STATUS_LABELS[settled.next]}.` : "Delivery recorded.");
  } catch (error) {
    return fail("record receipt", error);
  }
}

export async function reverseReceiptAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const id = String(fd.get("receipt_id") ?? "");
    const reason = text(fd, "reason", 300);
    if (!UUID.test(id)) return actionFailure("That delivery could not be found.");
    if (!reason) return actionFailure("Say why this delivery is being reversed.");
    const { db, admin, label } = await actor();
    const { data, error } = await db
      .from("ops_order_receipts")
      .update({ reversed_at: new Date().toISOString(), reversed_by: admin.user.id, reversal_reason: reason })
      .eq("id", id)
      .is("reversed_at", null)
      .select("order_id")
      .maybeSingle();
    if (error) return fail("reverse receipt", error);
    if (!data) return actionFailure("That delivery was already reversed.");
    const settled = await settleStatus(db, data.order_id as string, null);
    if (settled) {
      await log(db, settled.order.project_id, { id: admin.user.id, label }, "material.received", `${settled.order.supplier_name}: delivery reversed (${reason})`, { order_id: data.order_id });
      refresh(settled.order.project_id);
    }
    return actionSuccess("Delivery reversed.");
  } catch (error) {
    return fail("reverse receipt", error);
  }
}

export async function orderExtrasAction(orderId: string): Promise<{ receipts: OrderReceipt[]; documents: OrderDocument[] } | null> {
  if (!UUID.test(orderId)) return null;
  try {
    const { db } = await adminOpsDb();
    return await loadOrderExtras(db, orderId);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Documents (private bucket, signed links)
// ---------------------------------------------------------------------------

/**
 * Step 1 of an upload. Files go straight from the browser to the private
 * bucket (Vercel caps request bodies at 4.5 MB), so the server first checks
 * the details and hands out a one-time signed upload URL.
 */
export async function prepareUploadAction(input: {
  orderId: string;
  docType: string;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
}): Promise<{ path: string; uploadUrl: string } | { error: string }> {
  try {
    if (!UUID.test(input.orderId)) return { error: "That order could not be found." };
    if (!isDocType(input.docType)) return { error: "Choose what kind of document this is." };
    if (!(input.size > 0)) return { error: "Choose a file to upload." };
    if (input.size > MAX_DOC_BYTES) return { error: "Files can be at most 20 MB." };
    const ext = ALLOWED_DOC_TYPES[input.contentType];
    if (!ext) return { error: "Upload a PDF, photo (JPG, PNG, WEBP, HEIC), Excel or Word file." };
    if (!/^[0-9a-f]{64}$/.test(input.sha256)) return { error: "The file could not be read. Try again." };
    const { db } = await actor();
    const order = await orderRow(db, input.orderId);
    if (!order) return { error: "That order no longer exists." };
    const { data: dup } = await db.from("ops_procurement_documents").select("file_name").eq("project_id", order.project_id).eq("sha256", input.sha256).maybeSingle();
    if (dup) return { error: `This file is already on the project as “${dup.file_name}”.` };
    const name = safeFileName(input.fileName);
    const path = `${order.project_id}/${input.orderId}/${randomUUID()}-${name.toLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`}`;
    const signed = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (signed.error || !signed.data) return { error: "The upload could not be started. Try again." };
    return { path, uploadUrl: signed.data.signedUrl };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[procurement] prepare upload:", error instanceof Error ? error.message : error);
    return { error: "The upload could not be started. Try again." };
  }
}

/**
 * Step 2: after the browser has uploaded, re-read the stored file, check its
 * real type and fingerprint, then record it. A file that fails is removed.
 */
export async function finishUploadAction(input: { orderId: string; docType: string; fileName: string; path: string }): Promise<{ ok: true } | { error: string }> {
  try {
    if (!UUID.test(input.orderId) || !isDocType(input.docType)) return { error: "That upload could not be matched to an order." };
    const { db, admin, label } = await actor();
    const order = await orderRow(db, input.orderId);
    if (!order || !input.path.startsWith(`${order.project_id}/${input.orderId}/`)) return { error: "That upload could not be matched to an order." };
    const discard = async (message: string) => {
      await db.storage.from(BUCKET).remove([input.path]);
      return { error: message };
    };
    const file = await db.storage.from(BUCKET).download(input.path);
    if (file.error || !file.data) return { error: "The uploaded file could not be found. Try again." };
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    const type = file.data.type;
    if (!ALLOWED_DOC_TYPES[type] || bytes.length === 0 || bytes.length > MAX_DOC_BYTES) return discard("That file type or size is not allowed.");
    if (!sniffMatchesType(bytes, type)) return discard("The file's contents do not match its type. Save it again and retry.");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const { error } = await db.from("ops_procurement_documents").insert({
      project_id: order.project_id,
      order_id: input.orderId,
      doc_type: input.docType,
      file_name: input.fileName.slice(0, 200),
      storage_path: input.path,
      content_type: type,
      size_bytes: bytes.length,
      sha256,
      uploaded_by: admin.user.id,
      uploaded_by_label: label,
    });
    if (error) {
      if (error.code === "23505") return discard("This file is already on the project.");
      console.error("[procurement] save document:", error.message);
      return discard("The document could not be saved. Try again.");
    }
    await log(db, order.project_id, { id: admin.user.id, label }, "material.document", `${order.supplier_name}: ${input.fileName.slice(0, 80)} uploaded`, { order_id: input.orderId });
    refresh(order.project_id);
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[procurement] finish upload:", error instanceof Error ? error.message : error);
    return { error: "The document could not be saved. Try again." };
  }
}

/** Short-lived download link for one document (60 seconds). */
export async function documentLinkAction(documentId: string): Promise<{ url: string } | { error: string }> {
  if (!UUID.test(documentId)) return { error: "That document could not be found." };
  try {
    const { db } = await adminOpsDb();
    const { data } = await db.from("ops_procurement_documents").select("storage_path, file_name").eq("id", documentId).maybeSingle();
    if (!data) return { error: "That document could not be found." };
    const signed = await db.storage.from(BUCKET).createSignedUrl(data.storage_path as string, 60, { download: data.file_name as string });
    if (signed.error || !signed.data) return { error: "The document could not be opened. Try again." };
    return { url: signed.data.signedUrl };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "The document could not be opened. Try again." };
  }
}

// ---------------------------------------------------------------------------
// Xero supplier bills (read through the bridge; never edited here)
// ---------------------------------------------------------------------------

export type BillOption = { id: string; number: string | null; contact: string | null; date: string | null; due_date: string | null; status: string; total: number; amount_due: number; amount_paid: number; reference: string | null };

const toOption = (b: XeroInvoiceSummary): BillOption => ({
  id: b.id,
  number: b.number,
  contact: b.contact,
  date: b.date,
  due_date: b.due_date,
  status: b.status,
  total: b.total,
  amount_due: b.amount_due,
  amount_paid: b.amount_paid,
  reference: b.reference,
});

/** Recent supplier bills for the order's supplier (exact Xero contact name), newest first. */
export async function searchBillsAction(orderId: string, contactName: string): Promise<{ bills: BillOption[] } | { error: string }> {
  if (!UUID.test(orderId)) return { error: "That order could not be found." };
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "Xero is not connected on this site." };
  try {
    const { admin } = await adminOpsDb({ permission: "manageOperations" });
    if (!canPerform(admin.profile.role, "approveProcurement")) return { error: "Only an owner or admin can link Xero bills." };
    const from = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
    const name = contactName.trim().slice(0, 200);
    const bills = await createXeroBridgeClient(config).call<XeroInvoiceSummary[]>("get_invoices", {
      kind: "bills",
      date_from: from,
      ...(name ? { contact_name: name } : {}),
    });
    return { bills: (bills ?? []).filter((b) => !["VOIDED", "DELETED"].includes(b.status)).map(toOption).slice(0, 100) };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[procurement] bill search:", error instanceof Error ? error.message : error);
    return { error: "Xero could not be reached. Try again in a moment." };
  }
}

/** Link one Xero bill, re-read by its id so the stored figures are Xero's. */
export async function linkBillAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const orderId = String(fd.get("order_id") ?? "");
    const billId = String(fd.get("xero_invoice_id") ?? "");
    if (!UUID.test(orderId) || !UUID.test(billId)) return actionFailure("Pick a bill from the list.");
    const { db, admin, label } = await actor();
    if (!canPerform(admin.profile.role, "approveProcurement")) return actionFailure("Only an owner or admin can link Xero bills.");
    const config = xeroBridgeConfigFromEnv();
    if (!config) return actionFailure("Xero is not connected on this site.");
    const order = await orderRow(db, orderId);
    if (!order) return actionFailure("That order no longer exists.");
    const bill = await createXeroBridgeClient(config).call<XeroInvoiceSummary>("get_invoice", { invoice_id: billId });
    if (!bill || bill.type !== "ACCPAY") return actionFailure("That Xero record is not a supplier bill.");
    const { error } = await db.from("ops_order_bill_links").insert({
      order_id: orderId,
      xero_invoice_id: bill.id,
      bill_number: bill.number,
      reference: bill.reference,
      contact_name: bill.contact,
      xero_status: bill.status,
      bill_date: bill.date,
      due_date: bill.due_date,
      total_incl_vat: bill.total,
      amount_paid: bill.amount_paid,
      amount_due: bill.amount_due,
      match_method: "manual",
      linked_by: admin.user.id,
      last_synced_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === "23505") return actionFailure("That bill is already linked to this order.");
      return fail("link bill", error);
    }
    await log(db, order.project_id, { id: admin.user.id, label }, "material.bill", `${order.supplier_name}: Xero bill ${bill.number ?? ""} linked`, { order_id: orderId, xero_invoice_id: bill.id });
    refresh(order.project_id);
    return actionSuccess("Bill linked.");
  } catch (error) {
    return fail("link bill", error);
  }
}

export async function unlinkBillAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const linkId = String(fd.get("link_id") ?? "");
    if (!UUID.test(linkId)) return actionFailure("That link could not be found.");
    const { db, admin } = await actor();
    if (!canPerform(admin.profile.role, "approveProcurement")) return actionFailure("Only an owner or admin can unlink Xero bills.");
    const { data, error } = await db.from("ops_order_bill_links").delete().eq("id", linkId).select("order_id").maybeSingle();
    if (error) return fail("unlink bill", error);
    const order = data ? await orderRow(db, data.order_id as string) : null;
    if (order) refresh(order.project_id);
    return actionSuccess("Bill unlinked. Nothing changed in Xero.");
  } catch (error) {
    return fail("unlink bill", error);
  }
}

/** Re-read every linked bill on an order from Xero. */
export async function refreshBillsAction(_prev: AdminActionState, fd: FormData): Promise<AdminActionState> {
  try {
    const orderId = String(fd.get("order_id") ?? "");
    if (!UUID.test(orderId)) return actionFailure("That order could not be found.");
    const { db } = await actor();
    const config = xeroBridgeConfigFromEnv();
    if (!config) return actionFailure("Xero is not connected on this site.");
    const { data: links } = await db.from("ops_order_bill_links").select("id, xero_invoice_id").eq("order_id", orderId);
    const bridge = createXeroBridgeClient(config);
    let updated = 0;
    for (const link of (links ?? []) as { id: string; xero_invoice_id: string }[]) {
      const bill = await bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: link.xero_invoice_id });
      if (!bill) continue;
      await db
        .from("ops_order_bill_links")
        .update({ xero_status: bill.status, total_incl_vat: bill.total, amount_paid: bill.amount_paid, amount_due: bill.amount_due, due_date: bill.due_date, last_synced_at: new Date().toISOString() })
        .eq("id", link.id);
      updated += 1;
    }
    const order = await orderRow(db, orderId);
    if (order) refresh(order.project_id);
    return actionSuccess(updated ? `Refreshed ${updated} bill${updated === 1 ? "" : "s"} from Xero.` : "No linked bills to refresh.");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[procurement] refresh bills:", error instanceof Error ? error.message : error);
    return actionFailure("Xero could not be reached. The figures shown are from the last refresh.");
  }
}
