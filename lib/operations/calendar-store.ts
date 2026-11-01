import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/operations/admin-db";
import { readinessIssue } from "@/lib/operations/procurement";
import type { MaterialOrderStatus } from "@/lib/operations/types";
import {
  isBacklogCandidate,
  readinessWarnings,
  saDate,
  saToUtc,
  type BookingKind,
  type BookingStatus,
  type CalendarBooking,
  type CalendarTeam,
} from "@/lib/operations/calendar";

export type BacklogProject = {
  id: string;
  title: string;
  customer_name: string | null;
  site_town: string | null;
  stage: string;
  crew: string | null;
  scheduled_start: string | null;
  warnings: string[];
};

export type ProjectOption = { id: string; title: string; customer_name: string | null; site_town: string | null; warnings: string[] };

export type CalendarLoad =
  | { state: "not_installed" }
  | { state: "error" }
  | {
      state: "ok";
      teams: CalendarTeam[];
      bookings: CalendarBooking[];
      backlog: BacklogProject[];
      projects: ProjectOption[];
      outlookCalendars: number;
    };

type ProjectRow = {
  id: string;
  title: string;
  customer_name: string | null;
  site_town: string | null;
  stage: string;
  crew: string | null;
  on_hold: boolean;
  payment_status: string | null;
  is_supply_only: boolean;
  materials_by_client: boolean | null;
  scheduled_start: string | null;
  archived_at: string | null;
};

type BookingRow = Omit<CalendarBooking, "team_ids" | "project" | "sync_statuses"> & {
  ops_booking_teams: { team_id: string }[] | null;
  ops_calendar_event_links: { sync_status: string }[] | null;
};

/** Everything the Calendar tab shows for the visible date range. */
export async function loadCalendar(db: SupabaseClient, fromDate: string, toDateExclusive: string): Promise<CalendarLoad> {
  const from = saToUtc(fromDate, "00:00");
  const to = saToUtc(toDateExclusive, "00:00");

  const [teams, bookings, projects, orders, futureBookings, outlook] = await Promise.all([
    db.from("ops_teams").select("id, name, colour, leader_name, active").order("sort_order").order("name"),
    db
      .from("ops_bookings")
      .select(
        "id, project_id, kind, title, status, start_at, end_at, all_day, notes, allow_overlap, overlap_reason, version, quote_number, quote_contact_id, quote_snapshot, client_name_manual, site_manual, ops_booking_teams(team_id), ops_calendar_event_links(sync_status)",
      )
      .lt("start_at", to)
      .gt("end_at", from)
      .order("start_at")
      .limit(1000),
    db
      .from("ops_projects")
      .select("id, title, customer_name, site_town, stage, crew, on_hold, payment_status, is_supply_only, materials_by_client, scheduled_start, archived_at")
      .is("archived_at", null)
      .order("title")
      .limit(500),
    db.from("ops_material_orders").select("project_id, status, expected_date, required_on_site").limit(2000),
    db.from("ops_bookings").select("project_id, start_at").neq("status", "cancelled").gte("end_at", new Date().toISOString()).not("project_id", "is", null).limit(2000),
    db.from("ops_calendar_connections").select("id", { count: "exact", head: true }).eq("enabled", true),
  ]);

  if (isMissingTableError(teams.error) || isMissingTableError(bookings.error)) return { state: "not_installed" };
  const failed = [teams, bookings, projects, orders, futureBookings, outlook].find((r) => r.error);
  if (failed?.error) {
    console.error("[calendar] load:", failed.error.message);
    return { state: "error" };
  }

  const projectRows = (projects.data ?? []) as ProjectRow[];
  const byId = new Map(projectRows.map((p) => [p.id, p]));
  type OrderRow = { project_id: string; status: MaterialOrderStatus; expected_date: string | null; required_on_site: string | null };
  const ordersByProject = new Map<string, OrderRow[]>();
  for (const o of (orders.data ?? []) as OrderRow[]) {
    ordersByProject.set(o.project_id, [...(ordersByProject.get(o.project_id) ?? []), o]);
  }
  const statusesByProject = new Map([...ordersByProject].map(([id, list]) => [id, list.map((o) => o.status as string)]));
  const firstBooking = new Map<string, string>();
  for (const b of (futureBookings.data ?? []) as { project_id: string; start_at: string }[]) {
    const day = saDate(b.start_at);
    if (!firstBooking.has(b.project_id) || day < firstBooking.get(b.project_id)!) firstBooking.set(b.project_id, day);
  }
  const today = saDate(new Date());
  const warningsFor = (p: ProjectRow) => {
    const base = readinessWarnings({
      stage: p.stage,
      on_hold: p.on_hold,
      payment_status: p.payment_status,
      is_supply_only: p.is_supply_only,
      materials_by_client: Boolean(p.materials_by_client),
      material_statuses: statusesByProject.get(p.id) ?? [],
    });
    if (p.materials_by_client) return base;
    // Name the order that could hold up the install instead of a bare count.
    const issues = (ordersByProject.get(p.id) ?? [])
      .map((o) => readinessIssue(o, today, firstBooking.get(p.id) ?? p.scheduled_start))
      .filter((x): x is string => Boolean(x));
    if (!issues.length) return base;
    const specific = `Materials: ${issues[0]}${issues.length > 1 ? ` (+${issues.length - 1} more)` : ""}`;
    return [...base.filter((w) => !/supplier order/.test(w)), specific];
  };

  const booked = new Set(((futureBookings.data ?? []) as { project_id: string }[]).map((b) => b.project_id));

  return {
    state: "ok",
    teams: (teams.data ?? []) as CalendarTeam[],
    bookings: ((bookings.data ?? []) as BookingRow[]).map(({ ops_booking_teams, ops_calendar_event_links, ...b }) => {
      const p = b.project_id ? byId.get(b.project_id) : undefined;
      return {
        ...b,
        kind: b.kind as BookingKind,
        status: b.status as BookingStatus,
        team_ids: (ops_booking_teams ?? []).map((t) => t.team_id),
        sync_statuses: (ops_calendar_event_links ?? []).map((l) => l.sync_status),
        project: p ? { title: p.title, customer_name: p.customer_name, site_town: p.site_town, stage: p.stage } : null,
      };
    }),
    backlog: projectRows
      .filter((p) => isBacklogCandidate(p) && !booked.has(p.id))
      .map((p) => ({
        id: p.id,
        title: p.title,
        customer_name: p.customer_name,
        site_town: p.site_town,
        stage: p.stage,
        crew: p.crew,
        scheduled_start: p.scheduled_start,
        warnings: warningsFor(p),
      })),
    projects: projectRows
      .filter((p) => p.stage !== "completed")
      .map((p) => ({ id: p.id, title: p.title, customer_name: p.customer_name, site_town: p.site_town, warnings: warningsFor(p) })),
    outlookCalendars: outlook.count ?? 0,
  };
}

export type BookingHistoryItem = { at: string; actor: string | null; action: string };

export async function bookingHistory(db: SupabaseClient, bookingId: string): Promise<BookingHistoryItem[]> {
  const { data, error } = await db
    .from("ops_booking_audit")
    .select("created_at, actor_label, action")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return (data ?? []).map((r) => ({ at: r.created_at as string, actor: (r.actor_label as string | null) ?? null, action: r.action as string }));
}
