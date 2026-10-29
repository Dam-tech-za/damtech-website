/**
 * Operations 2.0 shared types. Xero owns money; these types describe the
 * operational record of a won job and the cached Xero state shown beside it.
 * Plain `as const` arrays (no enums) so node --experimental-strip-types can
 * run the tests.
 */

export const PROJECT_STAGES = [
  "awaiting_deposit",
  "planning",
  "scheduled",
  "in_progress",
  "handover",
  "completed",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_SERVICES = [
  "hdpe_dam_lining",
  "pvc_lining",
  "reservoir_lining",
  "steel_reservoir",
  "torch_on_bitumen",
  "roof_waterproofing",
  "foundation_waterproofing",
  "material_supply",
  "repairs",
  "other",
  "unclassified",
] as const;
export type ProjectService = (typeof PROJECT_SERVICES)[number];

/** Derived from Xero invoices only. Never set by hand, never inferred from a quote. */
export const PAYMENT_STATUSES = [
  "not_invoiced",
  "awaiting_payment",
  "part_paid",
  "paid_up_to_date",
  "paid_in_full",
  "overdue",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** The Monday "Material Orders & Collections" statuses (procurement only; supplier payment lives in Xero). */
export const MATERIAL_ORDER_STATUSES = [
  "not_ordered",
  "quote_requested",
  "quoted",
  "ordered",
  "paid",
  "ready_for_collection",
  "collected_delivered",
  "problem",
  "cancelled",
] as const;
export type MaterialOrderStatus = (typeof MATERIAL_ORDER_STATUSES)[number];

export const MATERIAL_FULFILMENT = [
  "delivery",
  "collection",
  "customer_collects",
  "tbc",
] as const;
export type MaterialFulfilment = (typeof MATERIAL_FULFILMENT)[number];

export const INVOICE_KINDS = [
  "deposit",
  "progress",
  "final",
  "variation",
  "full",
  "unclassified",
] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export type OpsProject = {
  id: string;
  title: string;
  customer_name: string;
  xero_contact_id: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  service: ProjectService;
  is_supply_only: boolean;
  site_location: string | null;
  site_province: string | null;
  site_town: string | null;
  km_from_pretoria: number | null;
  km_from_western_cape: number | null;
  one_way_km: number | null;
  scope: string | null;
  stage: ProjectStage;
  on_hold: boolean;
  on_hold_reason: string | null;
  next_action: string | null;
  next_action_due: string | null;
  next_action_owner: string | null;
  project_lead_id: string | null;
  crew: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  xero_quote_numbers: string[];
  xero_invoice_numbers: string[];
  quoted_total_incl_vat: number | null;
  quoted_total_excl_vat: number | null;
  payment_status: PaymentStatus;
  amount_invoiced: number;
  amount_paid: number;
  amount_due: number;
  payment_synced_at: string | null;
  source: "xero_quote" | "monday_migration" | "manual";
  needs_review: boolean;
  monday_item_id: string | null;
  materials_by_client: boolean;
  onedrive_url: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type OpsMaterialOrder = {
  id: string;
  project_id: string;
  supplier_id: string | null;
  supplier_name: string;
  description: string;
  quantity: string | null;
  unit: string | null;
  supplier_reference: string | null;
  status: MaterialOrderStatus;
  fulfilment: MaterialFulfilment;
  expected_date: string | null;
  received_date: string | null;
  fulfilment_notes: string | null;
  cost_excl_vat: number | null;
  xero_bill_id: string | null;
  xero_bill_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpsInvoiceLink = {
  id: string;
  project_id: string;
  xero_invoice_id: string;
  invoice_number: string | null;
  reference: string | null;
  kind: InvoiceKind;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  invoice_date: string | null;
  due_date: string | null;
  match_method: "reference" | "contact" | "manual";
  last_synced_at: string;
};

export type OpsTask = {
  id: string;
  project_id: string;
  title: string;
  kind: "task" | "quality" | "handover";
  due_date: string | null;
  owner: string | null;
  done: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
};

export type OpsDocument = {
  id: string;
  project_id: string;
  title: string;
  url: string;
  kind: "safety_file" | "supplier_quote" | "drawing" | "photo" | "handover" | "other";
  created_at: string;
};

export const DOCUMENT_KINDS = ["safety_file", "supplier_quote", "drawing", "photo", "handover", "other"] as const;
export const TASK_KINDS = ["task", "quality", "handover"] as const;

export type OpsUnmatchedInvoice = {
  id: string;
  xero_invoice_id: string;
  invoice_number: string | null;
  reference: string | null;
  contact_name: string | null;
  invoice_date: string | null;
  due_date: string | null;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  reason: string;
  suggested_project_id: string | null;
  status: "open" | "linked" | "dismissed";
  first_seen_at: string;
  last_seen_at: string;
};

export type OpsActivity = {
  id: string;
  project_id: string;
  at: string;
  actor_label: string;
  kind: string;
  summary: string;
};

export type OpsSyncRun = {
  id: string;
  kind: "xero_projects" | "xero_financials";
  trigger: "cron" | "manual";
  status: "running" | "ok" | "partial" | "failed";
  started_at: string;
  finished_at: string | null;
  quotes_seen: number;
  projects_created: number;
  invoices_linked: number;
  projects_updated: number;
  error: string | null;
};

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(value);
}

export function isProjectService(value: string): value is ProjectService {
  return (PROJECT_SERVICES as readonly string[]).includes(value);
}

export function isMaterialOrderStatus(value: string): value is MaterialOrderStatus {
  return (MATERIAL_ORDER_STATUSES as readonly string[]).includes(value);
}

export function isMaterialFulfilment(value: string): value is MaterialFulfilment {
  return (MATERIAL_FULFILMENT as readonly string[]).includes(value);
}
