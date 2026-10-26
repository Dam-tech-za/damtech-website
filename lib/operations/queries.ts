import { adminOpsDb, isMissingTableError } from "./admin-db";
import type {
  OpsActivity,
  OpsInvoiceLink,
  OpsMaterialOrder,
  OpsProject,
  OpsSyncRun,
  ProjectStage,
} from "./types";
import { xeroBridgeConfigFromEnv } from "./xero-bridge";

/**
 * Read side of the Operations screens. Every loader reports `setup` so pages
 * can say plainly when the database tables or the Xero bridge key are missing,
 * instead of showing empty numbers that look real.
 */

export type OpsSetup = {
  tablesReady: boolean;
  bridgeConfigured: boolean;
};

export type OpsLoad<T> =
  | { ok: true; setup: OpsSetup; data: T }
  | { ok: false; setup: OpsSetup; error: "tables_missing" | "load_failed" };

const bridgeConfigured = () => xeroBridgeConfigFromEnv() !== null;

function failure<T>(error: { code?: string; message?: string } | null, context: string): OpsLoad<T> {
  if (isMissingTableError(error)) {
    return { ok: false, setup: { tablesReady: false, bridgeConfigured: bridgeConfigured() }, error: "tables_missing" };
  }
  console.error(`[operations] ${context}:`, error?.message);
  return { ok: false, setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() }, error: "load_failed" };
}

const PROJECT_COLUMNS =
  "id, title, customer_name, xero_contact_id, contact_person, contact_email, contact_phone, service, is_supply_only, site_location, one_way_km, scope, stage, on_hold, on_hold_reason, next_action, next_action_due, project_lead_id, crew, scheduled_start, scheduled_end, xero_quote_numbers, xero_invoice_numbers, quoted_total_incl_vat, quoted_total_excl_vat, payment_status, amount_invoiced, amount_paid, amount_due, payment_synced_at, source, needs_review, monday_item_id, created_at, updated_at, completed_at";

function toProject(row: Record<string, unknown>): OpsProject {
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    ...(row as unknown as OpsProject),
    one_way_km: n(row.one_way_km),
    quoted_total_incl_vat: n(row.quoted_total_incl_vat),
    quoted_total_excl_vat: n(row.quoted_total_excl_vat),
    amount_invoiced: Number(row.amount_invoiced ?? 0),
    amount_paid: Number(row.amount_paid ?? 0),
    amount_due: Number(row.amount_due ?? 0),
    xero_quote_numbers: (row.xero_quote_numbers as string[] | null) ?? [],
    xero_invoice_numbers: (row.xero_invoice_numbers as string[] | null) ?? [],
  };
}

export type OverviewData = {
  open: OpsProject[];
  openMaterialOrders: number;
  lastSync: OpsSyncRun | null;
  lastSuccessfulSync: OpsSyncRun | null;
  hasBaseline: boolean;
};

export async function getOperationsOverview(): Promise<OpsLoad<OverviewData>> {
  const { db } = await adminOpsDb();
  const [projects, orders, runs, baseline] = await Promise.all([
    db.from("ops_projects").select(PROJECT_COLUMNS).neq("stage", "completed").order("next_action_due", { ascending: true }),
    db
      .from("ops_material_orders")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(received,cancelled)"),
    db.from("ops_sync_runs").select("*").eq("kind", "xero_projects").order("started_at", { ascending: false }).limit(20),
    db
      .from("ops_sync_runs")
      .select("id", { count: "exact", head: true })
      .eq("kind", "xero_projects")
      .in("status", ["ok", "partial"])
      .eq("detail->>baseline", "true"),
  ]);
  const err = projects.error ?? orders.error ?? runs.error ?? baseline.error;
  if (err) return failure(err, "overview");
  const runRows = (runs.data ?? []) as OpsSyncRun[];
  return {
    ok: true,
    setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() },
    data: {
      open: (projects.data ?? []).map(toProject),
      openMaterialOrders: orders.count ?? 0,
      lastSync: runRows[0] ?? null,
      lastSuccessfulSync: runRows.find((r) => r.status === "ok" || r.status === "partial") ?? null,
      hasBaseline: (baseline.count ?? 0) > 0,
    },
  };
}

export async function listOpsProjects(filter: { stage?: ProjectStage | "open" | "all" } = {}): Promise<OpsLoad<OpsProject[]>> {
  const { db } = await adminOpsDb();
  let query = db.from("ops_projects").select(PROJECT_COLUMNS).order("updated_at", { ascending: false }).limit(500);
  if (!filter.stage || filter.stage === "open") query = query.neq("stage", "completed");
  else if (filter.stage !== "all") query = query.eq("stage", filter.stage);
  const { data, error } = await query;
  if (error) return failure(error, "list projects");
  return { ok: true, setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() }, data: (data ?? []).map(toProject) };
}

export type ProjectDetail = {
  project: OpsProject;
  materials: OpsMaterialOrder[];
  invoices: OpsInvoiceLink[];
  quotes: { xero_quote_id: string; quote_number: string; xero_status: string; total_incl_vat: number | null }[];
  activity: OpsActivity[];
};

export async function getOpsProject(id: string): Promise<OpsLoad<ProjectDetail | null>> {
  const { db } = await adminOpsDb();
  const [project, materials, invoices, quotes, activity] = await Promise.all([
    db.from("ops_projects").select(PROJECT_COLUMNS).eq("id", id).maybeSingle(),
    db.from("ops_material_orders").select("*").eq("project_id", id).order("created_at"),
    db.from("ops_xero_invoice_links").select("*").eq("project_id", id).order("invoice_date"),
    db.from("ops_xero_quote_links").select("xero_quote_id, quote_number, xero_status, total_incl_vat").eq("project_id", id),
    db.from("ops_project_activity").select("id, project_id, at, actor_label, kind, summary").eq("project_id", id).order("at", { ascending: false }).limit(50),
  ]);
  const err = project.error ?? materials.error ?? invoices.error ?? quotes.error ?? activity.error;
  if (err) return failure(err, "project detail");
  const setup = { tablesReady: true, bridgeConfigured: bridgeConfigured() };
  if (!project.data) return { ok: true, setup, data: null };
  return {
    ok: true,
    setup,
    data: {
      project: toProject(project.data),
      materials: (materials.data ?? []).map((m) => ({ ...m, cost_excl_vat: m.cost_excl_vat === null ? null : Number(m.cost_excl_vat) })) as OpsMaterialOrder[],
      invoices: (invoices.data ?? []).map((i) => ({
        ...i,
        total_incl_vat: Number(i.total_incl_vat),
        amount_paid: Number(i.amount_paid),
        amount_due: Number(i.amount_due),
      })) as OpsInvoiceLink[],
      quotes: (quotes.data ?? []).map((q) => ({ ...q, total_incl_vat: q.total_incl_vat === null ? null : Number(q.total_incl_vat) })),
      activity: (activity.data ?? []) as OpsActivity[],
    },
  };
}

export type ProcurementRow = OpsMaterialOrder & { project_title: string; project_stage: ProjectStage };

export async function listProcurement(includeClosed = false): Promise<OpsLoad<ProcurementRow[]>> {
  const { db } = await adminOpsDb();
  let query = db
    .from("ops_material_orders")
    .select("*, ops_projects(title, stage)")
    .order("expected_date", { ascending: true, nullsFirst: false })
    .limit(500);
  if (!includeClosed) query = query.not("status", "in", "(received,cancelled)");
  const { data, error } = await query;
  if (error) return failure(error, "procurement");
  return {
    ok: true,
    setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() },
    data: (data ?? []).map((row) => {
      const parent = row.ops_projects as { title: string; stage: ProjectStage } | null;
      return {
        ...(row as OpsMaterialOrder),
        cost_excl_vat: row.cost_excl_vat === null ? null : Number(row.cost_excl_vat),
        project_title: parent?.title ?? "Unknown project",
        project_stage: parent?.stage ?? "planning",
      };
    }),
  };
}
