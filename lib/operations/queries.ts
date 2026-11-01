import { adminOpsDb, isMissingColumnError, isMissingTableError } from "./admin-db";
import { paymentPicture, materialsRollup, type MaterialsRollup, type PaymentLabel, type PaymentPicture } from "./board";
import { parseBoardMetaFromScope, isPaymentLabel } from "./board-meta";
import { locationPatch } from "./distance";
import { todayInSouthAfrica } from "./lifecycle";
import { findTownByName } from "./sa-places";
import type {
  OpsDocument,
  OpsTask,
  OpsUnmatchedInvoice,
  OpsActivity,
  OpsInvoiceLink,
  OpsMaterialOrder,
  OpsProject,
  OpsSyncRun,
  ProjectStage,
} from "./types";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv, type XeroInvoiceSummary, type XeroQuoteSummary } from "./xero-bridge";
import { unclaimedXeroItems, type XeroContactOption, type XeroStartItem } from "./xero-start";
import { daysBefore } from "./sync";

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

const PROJECT_COLUMNS_CORE =
  "id, title, customer_name, xero_contact_id, contact_person, contact_email, contact_phone, service, is_supply_only, site_location, one_way_km, scope, stage, on_hold, on_hold_reason, next_action, next_action_due, project_lead_id, crew, scheduled_start, scheduled_end, xero_quote_numbers, xero_invoice_numbers, quoted_total_incl_vat, quoted_total_excl_vat, payment_status, amount_invoiced, amount_paid, amount_due, payment_synced_at, source, needs_review, monday_item_id, created_at, updated_at, completed_at, next_action_owner, materials_by_client, onedrive_url, archived_at";

const PROJECT_COLUMNS_V3 = `${PROJECT_COLUMNS_CORE}, site_province, site_town, km_from_pretoria, km_from_western_cape`;

const PROJECT_COLUMNS = `${PROJECT_COLUMNS_V3}, project_lead_name, payment_label_override, quoted_total_manual, manual_fields, site_place_id, site_lat, site_lng`;

type ProjectQueryResult<T> = { data: T; error: { code?: string; message?: string } | null };

async function selectProjects<T>(run: (columns: string) => PromiseLike<ProjectQueryResult<T>>): Promise<ProjectQueryResult<T>> {
  const full = await run(PROJECT_COLUMNS);
  if (!full.error || !isMissingColumnError(full.error)) return full;
  const v3 = await run(PROJECT_COLUMNS_V3);
  if (!v3.error || !isMissingColumnError(v3.error)) return v3;
  return run(PROJECT_COLUMNS_CORE);
}

function toProject(row: Record<string, unknown>): OpsProject {
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    ...(row as unknown as OpsProject),
    site_province: (row.site_province as string | null | undefined) ?? null,
    site_town: (row.site_town as string | null | undefined) ?? null,
    one_way_km: n(row.one_way_km),
    km_from_pretoria: n(row.km_from_pretoria),
    km_from_western_cape: n(row.km_from_western_cape),
    quoted_total_incl_vat: n(row.quoted_total_incl_vat),
    quoted_total_excl_vat: n(row.quoted_total_excl_vat),
    amount_invoiced: Number(row.amount_invoiced ?? 0),
    amount_paid: Number(row.amount_paid ?? 0),
    amount_due: Number(row.amount_due ?? 0),
    xero_quote_numbers: Array.isArray(row.xero_quote_numbers) ? (row.xero_quote_numbers as string[]) : [],
    xero_invoice_numbers: Array.isArray(row.xero_invoice_numbers) ? (row.xero_invoice_numbers as string[]) : [],
    project_lead_name: (row.project_lead_name as string | null | undefined) ?? null,
    payment_label_override: (row.payment_label_override as string | null | undefined) ?? null,
    quoted_total_manual: Boolean(row.quoted_total_manual),
    manual_fields: (row.manual_fields as Record<string, boolean> | null | undefined) ?? {},
    site_place_id: (row.site_place_id as string | null | undefined) ?? null,
    site_lat: n(row.site_lat),
    site_lng: n(row.site_lng),
  };
}

export type OverviewOrder = Pick<OpsMaterialOrder, "id" | "project_id" | "supplier_name" | "description" | "status" | "expected_date"> & {
  project_title: string;
};

export type OverviewData = {
  open: OpsProject[];
  openMaterialOrders: number;
  openOrders: OverviewOrder[];
  unmatchedInvoices: number;
  lastSync: OpsSyncRun | null;
  lastSuccessfulSync: OpsSyncRun | null;
  hasBaseline: boolean;
};

export async function getOperationsOverview(): Promise<OpsLoad<OverviewData>> {
  const { db } = await adminOpsDb();
  const [projects, orders, runs, baseline, unmatched] = await Promise.all([
    selectProjects((columns) =>
      db.from("ops_projects").select(columns).neq("stage", "completed").is("archived_at", null).order("next_action_due", { ascending: true }),
    ),
    db
      .from("ops_material_orders")
      .select("id, project_id, supplier_name, description, status, expected_date, ops_projects(title)", { count: "exact" })
      .not("status", "in", "(collected_delivered,cancelled)")
      .order("expected_date", { ascending: true, nullsFirst: true })
      .limit(200),
    db.from("ops_sync_runs").select("*").eq("kind", "xero_projects").order("started_at", { ascending: false }).limit(20),
    db
      .from("ops_sync_runs")
      .select("id", { count: "exact", head: true })
      .eq("kind", "xero_projects")
      .in("status", ["ok", "partial"])
      .eq("detail->>baseline", "true"),
    db.from("ops_xero_unmatched").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const err = projects.error ?? orders.error ?? runs.error ?? baseline.error ?? unmatched.error;
  if (err) return failure(err, "overview");
  const runRows = (runs.data ?? []) as OpsSyncRun[];
  return {
    ok: true,
    setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() },
    data: {
      open: ((projects.data ?? []) as unknown as Record<string, unknown>[]).map(toProject),
      openMaterialOrders: orders.count ?? 0,
      openOrders: (orders.data ?? []).map((o) => ({
        id: o.id as string,
        project_id: o.project_id as string,
        supplier_name: o.supplier_name as string,
        description: o.description as string,
        status: o.status as OverviewOrder["status"],
        expected_date: (o.expected_date as string | null) ?? null,
        project_title: ((o.ops_projects as { title?: string } | null)?.title) ?? "Unknown project",
      })),
      unmatchedInvoices: unmatched.count ?? 0,
      lastSync: runRows[0] ?? null,
      lastSuccessfulSync: runRows.find((r) => r.status === "ok" || r.status === "partial") ?? null,
      hasBaseline: (baseline.count ?? 0) > 0,
    },
  };
}

export async function listOpsProjects(filter: { stage?: ProjectStage | "open" | "all" } = {}): Promise<OpsLoad<OpsProject[]>> {
  const { db } = await adminOpsDb();
  const { data, error } = await selectProjects((columns) => {
    let query = db.from("ops_projects").select(columns).order("updated_at", { ascending: false }).limit(500);
    if (!filter.stage || filter.stage === "open") query = query.neq("stage", "completed");
    else if (filter.stage !== "all") query = query.eq("stage", filter.stage);
    return query;
  });
  if (error) return failure(error, "list projects");
  return { ok: true, setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() }, data: ((data ?? []) as unknown as Record<string, unknown>[]).map(toProject) };
}

export type ProjectDetail = {
  project: OpsProject;
  tasks: OpsTask[];
  documents: OpsDocument[];
  leads: StaffOption[];
  payment: PaymentPicture;
  materialsStatus: MaterialsRollup;
  materials: OpsMaterialOrder[];
  invoices: OpsInvoiceLink[];
  quotes: { xero_quote_id: string; quote_number: string; xero_status: string; total_incl_vat: number | null }[];
  activity: OpsActivity[];
};

export async function getOpsProject(id: string): Promise<OpsLoad<ProjectDetail | null>> {
  const { db } = await adminOpsDb();
  const [project, materials, invoices, quotes, activity, tasks, documents, leads] = await Promise.all([
    selectProjects((columns) => db.from("ops_projects").select(columns).eq("id", id).maybeSingle()),
    db.from("ops_material_orders").select("*").eq("project_id", id).order("created_at"),
    db.from("ops_xero_invoice_links").select("*").eq("project_id", id).order("invoice_date"),
    db.from("ops_xero_quote_links").select("xero_quote_id, quote_number, xero_status, total_incl_vat").eq("project_id", id),
    db.from("ops_project_activity").select("id, project_id, at, actor_label, kind, summary").eq("project_id", id).order("at", { ascending: false }).limit(100),
    db.from("ops_project_tasks").select("*").eq("project_id", id).order("done").order("due_date", { ascending: true, nullsFirst: false }).order("created_at"),
    db.from("ops_project_documents").select("id, project_id, title, url, kind, created_at").eq("project_id", id).order("created_at", { ascending: false }),
    db.from("admin_profiles").select("id, email, full_name").eq("is_active", true).order("email"),
  ]);
  const err = project.error ?? materials.error ?? invoices.error ?? quotes.error ?? activity.error ?? tasks.error ?? documents.error ?? leads.error;
  if (err) return failure(err, "project detail");
  const setup = { tablesReady: true, bridgeConfigured: bridgeConfigured() };
  if (!project.data) return { ok: true, setup, data: null };
  const projectRow = toProject(project.data as unknown as Record<string, unknown>);
  const materialRows = (materials.data ?? []).map((m) => ({ ...m, cost_excl_vat: m.cost_excl_vat === null ? null : Number(m.cost_excl_vat) })) as OpsMaterialOrder[];
  const invoiceRows = (invoices.data ?? []).map((i) => ({
    ...i,
    total_incl_vat: Number(i.total_incl_vat),
    amount_paid: Number(i.amount_paid),
    amount_due: Number(i.amount_due),
  })) as OpsInvoiceLink[];
  return {
    ok: true,
    setup,
    data: {
      project: projectRow,
      tasks: (tasks.data ?? []) as OpsTask[],
      documents: (documents.data ?? []) as OpsDocument[],
      leads: (leads.data ?? []) as StaffOption[],
      payment: paymentPicture(invoiceRows, projectRow.quoted_total_incl_vat, todayInSouthAfrica()),
      materialsStatus: materialsRollup(materialRows, projectRow.materials_by_client),
      materials: materialRows,
      invoices: invoiceRows,
      quotes: (quotes.data ?? []).map((q) => ({ ...q, total_incl_vat: q.total_incl_vat === null ? null : Number(q.total_incl_vat) })),
      activity: (activity.data ?? []) as OpsActivity[],
    },
  };
}

export type StaffOption = { id: string; email: string; full_name: string | null };

export type BoardProject = OpsProject & {
  payment: PaymentPicture;
  materialsStatus: MaterialsRollup;
  openOrders: number;
  leadName: string | null;
};

/** Projects with their Xero payment picture and materials status, for the board and table. */
export async function listBoardProjects(show: "active" | "completed" | "archived" = "active"): Promise<OpsLoad<BoardProject[]>> {
  try {
    const { db } = await adminOpsDb();
    const { data, error } = await selectProjects((columns) => {
      // Stable board order: created date within each stage (not last update).
      let query = db.from("ops_projects").select(columns).order("created_at", { ascending: true }).limit(500);
      if (show === "active") query = query.is("archived_at", null);
      else if (show === "completed") query = query.eq("stage", "completed").is("archived_at", null);
      else query = query.not("archived_at", "is", null);
      return query;
    });
    if (error) return failure(error, "board projects");
    const projects = ((data ?? []) as unknown as Record<string, unknown>[]).map(toProject);
    const ids = projects.map((p) => p.id);
    const setup = { tablesReady: true, bridgeConfigured: bridgeConfigured() };
    if (!ids.length) return { ok: true, setup, data: [] };
    const [links, orders, staff] = await Promise.all([
      db.from("ops_xero_invoice_links").select("project_id, invoice_number, reference, invoice_date, kind, xero_status, total_incl_vat, amount_paid, amount_due, due_date").in("project_id", ids),
      db.from("ops_material_orders").select("project_id, status").in("project_id", ids),
      db.from("admin_profiles").select("id, email, full_name"),
    ]);
    const err = links.error ?? orders.error ?? staff.error;
    if (err) return failure(err, "board details");
    const today = todayInSouthAfrica();
    const names = new Map((staff.data ?? []).map((s) => [s.id as string, (s.full_name as string | null) || (s.email as string)]));
    return {
      ok: true,
      setup,
      data: projects.map((p) => {
        const projectLinks = (links.data ?? [])
          .filter((l) => l.project_id === p.id)
          .map((l) => ({ ...l, total_incl_vat: Number(l.total_incl_vat), amount_paid: Number(l.amount_paid), amount_due: Number(l.amount_due) }));
        const projectOrders = (orders.data ?? []).filter((o) => o.project_id === p.id) as Pick<OpsMaterialOrder, "status">[];
        const fromTitle =
        !p.site_province && !p.site_town ? findTownByName(p.title) || findTownByName(p.site_location) : null;
      const inferred = fromTitle ? locationPatch(fromTitle.province, fromTitle.name) : null;
      const scopeMeta = parseBoardMetaFromScope(p.scope);
      const overrideRaw = p.payment_label_override || scopeMeta.payment || null;
      const override: PaymentLabel | null =
        overrideRaw && isPaymentLabel(overrideRaw) ? overrideRaw : null;
      const picture = paymentPicture(projectLinks as Parameters<typeof paymentPicture>[0], p.quoted_total_incl_vat, today);
      const payment: PaymentPicture = override ? { ...picture, label: override } : picture;
      const leadName =
        (p.project_lead_name?.trim() || scopeMeta.lead?.trim() || p.crew?.trim() || null) ??
        (p.project_lead_id ? names.get(p.project_lead_id) ?? null : null);
      return {
          ...p,
          contact_person: p.contact_person?.trim() || null,
          site_province: p.site_province ?? inferred?.site_province ?? null,
          site_town: p.site_town ?? inferred?.site_town ?? null,
          km_from_pretoria: p.km_from_pretoria ?? inferred?.km_from_pretoria ?? null,
          km_from_western_cape: p.km_from_western_cape ?? inferred?.km_from_western_cape ?? null,
          payment,
          materialsStatus: materialsRollup(projectOrders, p.materials_by_client),
          openOrders: projectOrders.filter((o) => o.status !== "collected_delivered" && o.status !== "cancelled").length,
          leadName,
        };
      }),
    };
  } catch (error) {
    return failure({ message: error instanceof Error ? error.message : "unknown" }, "board projects");
  }
}

export type ReviewQueue = {
  open: OpsUnmatchedInvoice[];
  projects: { id: string; title: string; customer_name: string; stage: ProjectStage }[];
};

export async function listUnmatchedInvoices(): Promise<OpsLoad<ReviewQueue>> {
  const { db } = await adminOpsDb();
  const [queue, projects] = await Promise.all([
    db.from("ops_xero_unmatched").select("*").eq("status", "open").order("invoice_date", { ascending: false }).limit(200),
    db.from("ops_projects").select("id, title, customer_name, stage").is("archived_at", null).order("customer_name").limit(500),
  ]);
  const err = queue.error ?? projects.error;
  if (err) return failure(err, "review queue");
  return {
    ok: true,
    setup: { tablesReady: true, bridgeConfigured: bridgeConfigured() },
    data: {
      open: (queue.data ?? []).map((q) => ({
        ...q,
        total_incl_vat: Number(q.total_incl_vat),
        amount_paid: Number(q.amount_paid),
        amount_due: Number(q.amount_due),
      })) as OpsUnmatchedInvoice[],
      projects: (projects.data ?? []) as ReviewQueue["projects"],
    },
  };
}

export async function countUnmatchedInvoices(): Promise<number | null> {
  const { db } = await adminOpsDb();
  const { count, error } = await db.from("ops_xero_unmatched").select("id", { count: "exact", head: true }).eq("status", "open");
  if (error) return null;
  return count ?? 0;
}

export type ProcurementRow = OpsMaterialOrder & { project_title: string; project_stage: ProjectStage };

export async function listProcurement(includeClosed = false): Promise<OpsLoad<ProcurementRow[]>> {
  const { db } = await adminOpsDb();
  let query = db
    .from("ops_material_orders")
    .select("*, ops_projects(title, stage)")
    .order("expected_date", { ascending: true, nullsFirst: false })
    .limit(500);
  if (!includeClosed) query = query.not("status", "in", "(collected_delivered,cancelled)");
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

export type XeroStartData = {
  items: XeroStartItem[];
  contacts: XeroContactOption[];
  /** Plain-words problem reading Xero; the form still works by hand. */
  xeroError: string | null;
};

export async function listStaffOptions(): Promise<StaffOption[]> {
  const { db } = await adminOpsDb();
  const { data, error } = await db.from("admin_profiles").select("id, email, full_name").eq("is_active", true).order("email");
  if (error) return [];
  return (data ?? []) as StaffOption[];
}

/**
 * Recent accepted quotes (and, on the old new-project form, sales invoices)
 * that are not on a project yet. Read-only through the bridge.
 */
export async function loadXeroStart(
  options: {
    search?: string;
    contact?: { id: string; name: string } | null;
    /** Board picker: accepted/invoiced quotes from the last 30 days, no invoices. */
    quotesOnly?: boolean;
    quoteDays?: number;
  } = {},
): Promise<OpsLoad<XeroStartData>> {
  const { db } = await adminOpsDb();
  const [projects, invoiceLinks, quoteLinks] = await Promise.all([
    db.from("ops_projects").select("xero_quote_numbers, xero_invoice_numbers").limit(2000),
    db.from("ops_xero_invoice_links").select("xero_invoice_id").limit(5000),
    db.from("ops_xero_quote_links").select("xero_quote_id").limit(5000),
  ]);
  const err = projects.error ?? invoiceLinks.error ?? quoteLinks.error;
  if (err) return failure(err, "xero start");
  const setup = { tablesReady: true, bridgeConfigured: bridgeConfigured() };
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { ok: true, setup, data: { items: [], contacts: [], xeroError: "The Xero connection is not set up on this site." } };

  const bridge = createXeroBridgeClient({ ...config, timeoutMs: 15000 });
  const today = todayInSouthAfrica();
  const search = options.search?.trim().slice(0, 80) ?? "";
  const quoteDays = options.quoteDays ?? (options.quotesOnly ? 30 : 180);
  const forContact = (days: number) => (options.contact ? { contact_id: options.contact.id } : { date_from: daysBefore(today, days) });
  try {
    const [accepted, invoiced, invoices, contacts] = await Promise.all([
      bridge.call<XeroQuoteSummary[]>("get_quotes", { status: "ACCEPTED", ...forContact(quoteDays), page: 1 }),
      bridge.call<XeroQuoteSummary[]>("get_quotes", { status: "INVOICED", ...forContact(options.quotesOnly ? quoteDays : 120), page: 1 }),
      options.quotesOnly
        ? Promise.resolve([] as XeroInvoiceSummary[])
        : bridge.call<XeroInvoiceSummary[]>("get_invoices", {
            kind: "sales",
            status: "AUTHORISED,PAID",
            ...(options.contact?.name ? { contact_name: options.contact.name } : { date_from: daysBefore(today, 120) }),
            page: 1,
          }),
      search
        ? bridge.call<{ id: string; name: string; email: string | null; is_customer?: boolean; status?: string }[]>("get_contacts", { search, page: 1 })
        : Promise.resolve([]),
    ]);
    const claimed = {
      quoteNumbers: new Set((projects.data ?? []).flatMap((p) => (p.xero_quote_numbers ?? []).map((n: string) => n.toUpperCase()))),
      invoiceNumbers: new Set((projects.data ?? []).flatMap((p) => (p.xero_invoice_numbers ?? []).map((n: string) => n.toUpperCase()))),
      quoteIds: new Set((quoteLinks.data ?? []).map((q) => q.xero_quote_id as string)),
      invoiceIds: new Set((invoiceLinks.data ?? []).map((i) => i.xero_invoice_id as string)),
    };
    return {
      ok: true,
      setup,
      data: {
        items: unclaimedXeroItems([...accepted, ...invoiced], invoices, claimed, options.contact).slice(0, 40),
        contacts: contacts
          .filter((c) => c.status !== "ARCHIVED")
          .slice(0, 15)
          .map((c) => ({ id: c.id, name: c.name, email: c.email ?? null })),
        xeroError: null,
      },
    };
  } catch (error) {
    console.error("[operations] xero start:", error instanceof Error ? error.message : error);
    return { ok: true, setup, data: { items: [], contacts: [], xeroError: "Xero could not be reached just now. You can still fill in the form by hand." } };
  }
}
