/**
 * Calendar rules shared by the server and the Calendar tab. Pure functions
 * only, so they run under the node test runner.
 *
 * Times are stored in UTC and shown in Africa/Johannesburg. South Africa has
 * had no daylight saving since 1944, so a fixed +02:00 offset converts a
 * local date and time to an instant without a timezone library.
 */

export const CALENDAR_TZ = "Africa/Johannesburg";
const SA_OFFSET = "+02:00";

export const BOOKING_STATUSES = ["tentative", "confirmed", "in_progress", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  tentative: "Tentative",
  confirmed: "Confirmed",
  in_progress: "On site",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_KINDS = ["project", "leave", "maintenance", "travel", "other"] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

export const BOOKING_KIND_LABELS: Record<BookingKind, string> = {
  project: "Project work",
  leave: "Leave",
  maintenance: "Vehicle / equipment maintenance",
  travel: "Travel / preparation",
  other: "Other",
};

export type CalendarTeam = { id: string; name: string; colour: string; leader_name: string | null; active: boolean };

export type CalendarBooking = {
  id: string;
  project_id: string | null;
  kind: BookingKind;
  title: string;
  status: BookingStatus;
  start_at: string;
  end_at: string;
  all_day: boolean;
  notes: string | null;
  allow_overlap: boolean;
  overlap_reason: string | null;
  version: number;
  team_ids: string[];
  project: { title: string; customer_name: string | null; site_town: string | null; stage: string } | null;
  /** Outlook sync state per linked calendar; empty when never sent to Outlook. */
  sync_statuses?: string[];
};

/** What to say about Outlook for one booking. Only "synced" after Microsoft confirmed the write. */
export function outlookLabel(outlookCalendars: number, statuses: string[] | undefined): string {
  if (outlookCalendars === 0) return "Outlook not connected: saved in DamTech only.";
  const s = statuses ?? [];
  if (!s.length) return "Not sent to Outlook yet.";
  if (s.includes("failed")) return "Outlook update failed; it will be retried.";
  if (s.includes("conflict")) return "Changed in Outlook: needs review.";
  if (s.every((x) => x === "synced")) return "In Outlook.";
  return "Waiting to update Outlook.";
}

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

export function isBookingKind(value: string): value is BookingKind {
  return (BOOKING_KINDS as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "YYYY-MM-DD" in South Africa for an instant. */
export function saDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CALENDAR_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

/** "HH:MM" (24-hour) in South Africa for an instant. */
export function saTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: CALENDAR_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

/** South African local date + time → UTC ISO string. */
export function saToUtc(date: string, time: string): string {
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) throw new Error("Invalid date or time.");
  return new Date(`${date}T${time}:00${SA_OFFSET}`).toISOString();
}

/** Calendar arithmetic on "YYYY-MM-DD" strings (no timezone involved). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export function monthGridStart(date: string): string {
  return weekStart(`${date.slice(0, 7)}-01`);
}

export function isIsoDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export function dayList(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** Local dates a booking occupies. The end is exclusive: ending at 00:00 does not touch that day. */
export function bookingDays(booking: Pick<CalendarBooking, "start_at" | "end_at">): string[] {
  const first = saDate(booking.start_at);
  const lastInstant = new Date(new Date(booking.end_at).getTime() - 1);
  const last = saDate(lastInstant);
  const days: string[] = [];
  for (let d = first; d <= last && days.length < 366; d = addDays(d, 1)) days.push(d);
  return days;
}

/** team id → date → bookings, plus "unassigned" for bookings without a team. */
export function groupByTeamAndDay(bookings: CalendarBooking[], days: string[]): Map<string, Map<string, CalendarBooking[]>> {
  const visible = new Set(days);
  const grid = new Map<string, Map<string, CalendarBooking[]>>();
  const sorted = [...bookings].sort((a, b) => a.start_at.localeCompare(b.start_at));
  for (const booking of sorted) {
    const teams = booking.team_ids.length ? booking.team_ids : ["unassigned"];
    for (const day of bookingDays(booking)) {
      if (!visible.has(day)) continue;
      for (const team of teams) {
        if (!grid.has(team)) grid.set(team, new Map());
        const row = grid.get(team)!;
        row.set(day, [...(row.get(day) ?? []), booking]);
      }
    }
  }
  return grid;
}

/** Times shown on a booking card for one day of a multi-day booking. */
export function bookingTimeLabel(booking: Pick<CalendarBooking, "start_at" | "end_at" | "all_day">, day: string): string {
  if (booking.all_day) return "All day";
  const startDay = saDate(booking.start_at);
  const endDay = saDate(new Date(new Date(booking.end_at).getTime() - 1));
  const starts = startDay === day;
  const ends = endDay === day;
  if (starts && ends) return `${saTime(booking.start_at)}–${saTime(booking.end_at)}`;
  if (starts) return `From ${saTime(booking.start_at)}`;
  if (ends) return `Until ${saTime(booking.end_at)}`;
  return "All day (continued)";
}

export type BookingInput = {
  id?: string;
  expected_version?: number;
  project_id: string | null;
  kind: BookingKind;
  title: string;
  status: BookingStatus;
  start_at: string;
  end_at: string;
  all_day: boolean;
  notes: string | null;
  allow_overlap: boolean;
  overlap_reason: string | null;
  team_ids: string[];
};

export type RawBookingForm = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turn the booking form into a validated save payload. Dates and times are
 * South African local; "all day" bookings run 00:00 on the start date to 00:00
 * after the end date.
 */
export function parseBookingForm(form: RawBookingForm): { ok: true; value: BookingInput } | { ok: false; error: string } {
  const kind = str(form.kind) || "project";
  if (!isBookingKind(kind)) return { ok: false, error: "Choose what kind of booking this is." };
  const status = str(form.status) || "tentative";
  if (!isBookingStatus(status)) return { ok: false, error: "Choose a booking status." };

  const projectId = str(form.project_id) || null;
  if (projectId && !UUID_RE.test(projectId)) return { ok: false, error: "That project could not be found." };
  if (kind === "project" && !projectId) return { ok: false, error: "Pick the project this work is for." };

  const startDate = str(form.start_date);
  const endDate = str(form.end_date) || startDate;
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return { ok: false, error: "Enter a start and end date." };
  if (endDate < startDate) return { ok: false, error: "The end date is before the start date." };

  const allDay = str(form.all_day) === "on" || str(form.all_day) === "true";
  let startAt: string;
  let endAt: string;
  try {
    if (allDay) {
      startAt = saToUtc(startDate, "00:00");
      endAt = saToUtc(addDays(endDate, 1), "00:00");
    } else {
      startAt = saToUtc(startDate, str(form.start_time) || "07:00");
      endAt = saToUtc(endDate, str(form.end_time) || "16:00");
    }
  } catch {
    return { ok: false, error: "Enter times as HH:MM, for example 07:00." };
  }
  if (endAt <= startAt) return { ok: false, error: "The booking must end after it starts." };
  if (new Date(endAt).getTime() - new Date(startAt).getTime() > 62 * 86_400_000) {
    return { ok: false, error: "A booking can cover at most two months. Split longer work into sessions." };
  }

  const rawTeams = form.team_ids;
  const teamIds = [...new Set((Array.isArray(rawTeams) ? rawTeams : rawTeams ? [rawTeams] : []).map((t) => t.trim()).filter(Boolean))];
  if (teamIds.some((t) => !UUID_RE.test(t))) return { ok: false, error: "One of the teams could not be found." };

  const allowOverlap = str(form.allow_overlap) === "on" || str(form.allow_overlap) === "true";
  const overlapReason = str(form.overlap_reason) || null;
  if (allowOverlap && !overlapReason) return { ok: false, error: "Say why this team may be double-booked." };

  const fallbackTitle = kind === "project" ? "Installation" : BOOKING_KIND_LABELS[kind];
  const title = (str(form.title) || fallbackTitle).slice(0, 200);
  const notes = str(form.notes).slice(0, 2000) || null;

  const id = str(form.id);
  if (id && !UUID_RE.test(id)) return { ok: false, error: "That booking could not be found." };
  const expected = Number(str(form.expected_version));

  return {
    ok: true,
    value: {
      ...(id ? { id, expected_version: Number.isInteger(expected) && expected > 0 ? expected : undefined } : {}),
      project_id: kind === "project" ? projectId : projectId,
      kind,
      title,
      status,
      start_at: startAt,
      end_at: endAt,
      all_day: allDay,
      notes,
      allow_overlap: allowOverlap,
      overlap_reason: allowOverlap ? overlapReason : null,
      team_ids: teamIds,
    },
  };
}

/** Plain-language message for a failed save. */
export function describeBookingSaveError(error: { code?: string; message?: string } | null | undefined): string {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  if (code === "23P01" || /no_overlap/.test(message)) {
    return "That team (or vehicle) is already booked at that time. Pick another time or team, or tick “Allow double-booking” and give a reason.";
  }
  if (/version_conflict/.test(message)) return "Someone else changed this booking a moment ago. Close it and open it again to see their change.";
  if (/booking_not_found/.test(message)) return "That booking no longer exists.";
  if (code === "23503") return "The project or team on this booking no longer exists.";
  if (code === "23514") return "Some booking details are not valid. Check the dates and the project.";
  return "The booking could not be saved. Try again in a moment.";
}

export type ReadinessInput = {
  stage: string;
  on_hold: boolean;
  payment_status: string | null;
  is_supply_only: boolean;
  materials_by_client: boolean;
  material_statuses: string[];
};

const MATERIALS_READY = new Set(["collected_delivered", "ready_for_collection", "cancelled"]);

/**
 * Warnings shown before a booking is confirmed. Warnings, not blocks: the
 * manager decides. Payment status comes from Xero and is never changed here.
 */
export function readinessWarnings(p: ReadinessInput): string[] {
  const warnings: string[] = [];
  if (p.on_hold) warnings.push("The project is on hold.");
  if (p.stage === "completed") warnings.push("The project is already marked completed.");
  const depositIn = p.payment_status === "part_paid" || p.payment_status === "paid_in_full";
  if (p.stage === "awaiting_deposit" && !depositIn) warnings.push("Deposit not received yet (per Xero). Keep the booking tentative.");
  if (!p.materials_by_client) {
    const open = p.material_statuses.filter((s) => !MATERIALS_READY.has(s));
    if (open.length) warnings.push(`${open.length} supplier order${open.length === 1 ? " is" : "s are"} not ready yet.`);
  }
  return warnings;
}

/** Projects that still need installation time on the calendar. */
export function isBacklogCandidate(p: { stage: string; is_supply_only: boolean; archived_at: string | null; on_hold: boolean }): boolean {
  if (p.archived_at || p.is_supply_only) return false;
  return p.stage === "awaiting_deposit" || p.stage === "planning" || p.stage === "scheduled";
}

export type BarSegment = {
  booking: CalendarBooking;
  /** Index into the visible days. */
  start: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/**
 * Lay bookings out as continuous bars across a row of days (a week). Each
 * booking gets one bar per row, on the lowest free lane, so a five-day job is
 * one bar instead of five separate entries.
 */
export function layoutBars(bookings: CalendarBooking[], days: string[]): { segments: BarSegment[]; lanes: number } {
  const index = new Map(days.map((d, i) => [d, i]));
  const items = bookings
    .map((booking) => {
      const all = bookingDays(booking);
      const visible = all.map((d) => index.get(d)).filter((i): i is number => i !== undefined);
      if (!visible.length) return null;
      const start = Math.min(...visible);
      const end = Math.max(...visible);
      return {
        booking,
        start,
        span: end - start + 1,
        continuesBefore: all[0] < days[0],
        continuesAfter: all[all.length - 1] > days[days.length - 1],
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.start - b.start || b.span - a.span || a.booking.start_at.localeCompare(b.booking.start_at));

  const laneEnds: number[] = [];
  const segments: BarSegment[] = [];
  for (const item of items) {
    let lane = laneEnds.findIndex((end) => end < item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.start + item.span - 1;
    segments.push({ ...item, lane });
  }
  return { segments, lanes: laneEnds.length };
}
