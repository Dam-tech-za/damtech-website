import type { MaterialFulfilment, MaterialOrderStatus, ProjectService, ProjectStage } from "./types.ts";

/**
 * One-off normalisation of the Monday.com boards "Projects - Won Jobs" and
 * "Material Orders & Collections" into the Operations 2.0 model.
 *
 * Deliberately NOT copied: Monday's Payment column, Balance due and the
 * subitem checklists. Payment comes from Xero after the first sync; Monday's
 * hand-typed balances were already out of date (Kingdom Pumps showed a
 * balance to collect that Xero had settled with a credit note).
 */

export type MondayProjectItem = {
  id: string;
  name: string;
  stage: string | null;
  service: string | null;
  client: string | null;
  xeroRefs: string | null;
  valueInclVat: number | null;
  site: string | null;
  oneWayKm: number | null;
  siteStart: string | null;
  siteEnd: string | null;
  crew: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  phone: string | null;
  email: string | null;
  scope: string | null;
  safetyFile: string | null;
  /** Exact Xero contact name, when known. Used as customer_name so later invoices match by contact. */
  xeroContact?: string | null;
};

export type MondayMaterialItem = {
  id: string;
  name: string;
  projectItemId: string | null;
  supplier: string | null;
  status: string | null;
  materials: string | null;
  supplierRef: string | null;
  date: string | null;
  deliveryNote: string | null;
  cost: number | null;
  notes: string | null;
};

export type MigratedProject = {
  monday_item_id: string;
  title: string;
  customer_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  service: ProjectService;
  is_supply_only: boolean;
  site_location: string | null;
  one_way_km: number | null;
  scope: string | null;
  stage: ProjectStage;
  on_hold: boolean;
  next_action: string;
  next_action_due: string;
  crew: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  xero_quote_numbers: string[];
  xero_invoice_numbers: string[];
  quoted_total_incl_vat: number | null;
  source: "monday_migration";
  needs_review: boolean;
  review_notes: string[];
};

export type MigratedMaterialOrder = {
  monday_item_id: string;
  project_monday_item_id: string;
  supplier_name: string;
  description: string;
  supplier_reference: string | null;
  status: MaterialOrderStatus;
  fulfilment: MaterialFulfilment;
  expected_date: string | null;
  cost_excl_vat: number | null;
  notes: string | null;
};

const STAGE_MAP: Record<string, { stage: ProjectStage; onHold?: boolean; review?: string }> = {
  "awaiting deposit": { stage: "awaiting_deposit" },
  "planning & materials": { stage: "planning" },
  scheduled: { stage: "scheduled" },
  "on site": { stage: "in_progress" },
  "snags / handover": { stage: "handover" },
  // "Final invoice" mixed up work and money. Put it in Handover and ask a
  // person to confirm whether the work is actually finished.
  "final invoice": { stage: "handover", review: "Monday said Final invoice: confirm whether the work is finished, then mark Completed." },
  "closed - paid": { stage: "completed" },
  "on hold": { stage: "planning", onHold: true, review: "Monday said On hold: confirm the real stage." },
};

const SERVICE_MAP: Record<string, { service: ProjectService; supplyOnly: boolean }> = {
  "hdpe farm dam": { service: "hdpe_dam_lining", supplyOnly: false },
  "steel reservoir": { service: "steel_reservoir", supplyOnly: false },
  "reservoir lining": { service: "reservoir_lining", supplyOnly: false },
  "torch-on bitumen": { service: "torch_on_bitumen", supplyOnly: false },
  "roof waterproofing": { service: "roof_waterproofing", supplyOnly: false },
  "foundation waterproofing": { service: "foundation_waterproofing", supplyOnly: false },
  "pvc liner supply": { service: "pvc_lining", supplyOnly: true },
  "material supply only": { service: "material_supply", supplyOnly: true },
};

const MATERIAL_STATUS_MAP: Record<string, MaterialOrderStatus> = {
  "not ordered": "quote_requested",
  "quote requested": "quote_requested",
  ordered: "ordered",
  "ordered / paid": "ordered",
  "partly in": "ordered",
  ready: "ready",
  "collected / delivered": "received",
};

const key = (v: string | null) => (v ?? "").trim().toLowerCase();

export function mapMondayStage(label: string | null) {
  return STAGE_MAP[key(label)] ?? { stage: "planning" as ProjectStage, review: `Unknown Monday stage "${label ?? ""}".` };
}

export function mapMondayService(label: string | null) {
  return SERVICE_MAP[key(label)] ?? { service: "unclassified" as ProjectService, supplyOnly: false };
}

export function mapMondayMaterialStatus(label: string | null): MaterialOrderStatus {
  return MATERIAL_STATUS_MAP[key(label)] ?? "quote_requested";
}

/** "QU0283 + QU0285 / INV0139 + INV0140" → quotes and invoices. */
export function parseXeroRefs(text: string | null): { quotes: string[]; invoices: string[] } {
  const upper = (text ?? "").toUpperCase();
  const quotes = [...new Set(upper.match(/\bQU\d{3,6}\b/g) ?? [])];
  const invoices = [...new Set(upper.match(/\bINV\d{3,6}\b/g) ?? [])];
  return { quotes, invoices };
}

export function inferFulfilment(text: string | null): MaterialFulfilment {
  const t = key(text);
  if (/customer|client\)|\(customer/.test(t)) return "customer_collects";
  if (/to confirm|tbc/.test(t)) return "tbc";
  if (/collect/.test(t)) return "collection";
  if (/deliver/.test(t)) return "delivery";
  return "tbc";
}

export function migrateMondayProject(item: MondayProjectItem, today: string): MigratedProject {
  const stage = mapMondayStage(item.stage);
  const service = mapMondayService(item.service);
  const refs = parseXeroRefs(item.xeroRefs);
  const review: string[] = [];
  if (stage.review) review.push(stage.review);
  if (refs.quotes.length === 0) review.push("No Xero quote number on the Monday item: link the quote by hand.");
  if (/still sent|mark accepted/i.test(item.xeroRefs ?? "")) review.push("Quote is not marked Accepted in Xero yet.");

  let nextAction = (item.nextAction ?? "").trim();
  let due = item.nextActionDate;
  if (stage.stage !== "completed") {
    if (!nextAction) {
      nextAction = "Set the next action";
      review.push("Monday had no next action.");
    }
    if (!due) {
      due = today;
      review.push("Monday had no next action date; set to the migration date.");
    }
  }

  return {
    monday_item_id: item.id,
    title: item.name.trim(),
    customer_name: (item.xeroContact || item.client || item.name.split(" - ")[0]).trim(),
    contact_email: item.email,
    contact_phone: item.phone,
    service: service.service,
    is_supply_only: service.supplyOnly,
    site_location: item.site,
    one_way_km: item.oneWayKm,
    scope: item.scope,
    stage: stage.stage,
    on_hold: stage.onHold === true,
    next_action: nextAction || "Completed",
    next_action_due: due ?? today,
    crew: item.crew,
    scheduled_start: item.siteStart,
    scheduled_end: item.siteEnd,
    xero_quote_numbers: refs.quotes,
    xero_invoice_numbers: refs.invoices,
    quoted_total_incl_vat: item.valueInclVat,
    source: "monday_migration",
    needs_review: review.length > 0,
    review_notes: review,
  };
}

export function migrateMondayMaterial(item: MondayMaterialItem): MigratedMaterialOrder | null {
  if (!item.projectItemId) return null;
  const notes = [item.notes, item.deliveryNote].map((v) => v?.trim()).filter(Boolean).join("\n");
  return {
    monday_item_id: item.id,
    project_monday_item_id: item.projectItemId,
    supplier_name: (item.supplier ?? "Unknown supplier").trim(),
    description: (item.materials ?? item.name).trim(),
    supplier_reference: item.supplierRef,
    status: mapMondayMaterialStatus(item.status),
    fulfilment: inferFulfilment(item.deliveryNote),
    expected_date: item.date,
    // Monday's cost column did not say whether VAT was included; keep it as a
    // note for a person to confirm rather than store it as excl. VAT.
    cost_excl_vat: null,
    notes: [notes, item.cost !== null ? `Monday cost: R${item.cost} (VAT basis not recorded)` : ""].filter(Boolean).join("\n") || null,
  };
}
