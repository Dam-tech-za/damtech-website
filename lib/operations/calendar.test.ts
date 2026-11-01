import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  bookingLabel,
  bookingDays,
  bookingTimeLabel,
  describeBookingSaveError,
  groupByTeamAndDay,
  isBacklogCandidate,
  layoutBars,
  monthGridStart,
  parseBookingForm,
  readinessWarnings,
  saDate,
  saTime,
  saToUtc,
  weekStart,
  type CalendarBooking,
} from "./calendar.ts";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";
const P1 = "33333333-3333-4333-8333-333333333333";

function booking(partial: Partial<CalendarBooking>): CalendarBooking {
  return {
    id: "b",
    project_id: P1,
    kind: "project",
    title: "Install",
    status: "confirmed",
    start_at: saToUtc("2026-11-02", "07:00"),
    end_at: saToUtc("2026-11-02", "16:00"),
    all_day: false,
    notes: null,
    allow_overlap: false,
    overlap_reason: null,
    version: 1,
    team_ids: [T1],
    project: null,
    ...partial,
  };
}

describe("calendar time helpers", () => {
  it("converts South African local time to UTC and back", () => {
    const iso = saToUtc("2026-11-02", "07:00");
    assert.equal(iso, "2026-11-02T05:00:00.000Z");
    assert.equal(saDate(iso), "2026-11-02");
    assert.equal(saTime(iso), "07:00");
  });
  it("keeps late-evening bookings on the local day", () => {
    const iso = saToUtc("2026-11-02", "23:30");
    assert.equal(iso, "2026-11-02T21:30:00.000Z");
    assert.equal(saDate(iso), "2026-11-02");
  });
  it("finds Monday and the month grid start", () => {
    assert.equal(weekStart("2026-11-04"), "2026-11-02");
    assert.equal(weekStart("2026-11-08"), "2026-11-02");
    assert.equal(weekStart("2026-11-02"), "2026-11-02");
    assert.equal(monthGridStart("2026-11-18"), "2026-10-26");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  });
  it("rejects bad times", () => {
    assert.throws(() => saToUtc("2026-11-02", "25:00"));
  });
});

describe("bookingDays", () => {
  it("treats the end as exclusive", () => {
    const all = booking({ start_at: saToUtc("2026-11-02", "00:00"), end_at: saToUtc("2026-11-05", "00:00") });
    assert.deepEqual(bookingDays(all), ["2026-11-02", "2026-11-03", "2026-11-04"]);
  });
  it("spans days for multi-day work", () => {
    const multi = booking({ start_at: saToUtc("2026-11-02", "07:00"), end_at: saToUtc("2026-11-04", "15:00") });
    assert.deepEqual(bookingDays(multi), ["2026-11-02", "2026-11-03", "2026-11-04"]);
    assert.equal(bookingTimeLabel(multi, "2026-11-02"), "From 07:00");
    assert.equal(bookingTimeLabel(multi, "2026-11-03"), "All day (continued)");
    assert.equal(bookingTimeLabel(multi, "2026-11-04"), "Until 15:00");
    assert.equal(bookingTimeLabel(booking({}), "2026-11-02"), "07:00–16:00");
  });
});

describe("groupByTeamAndDay", () => {
  it("puts multi-team bookings in each team row and skips hidden days", () => {
    const b = booking({ team_ids: [T1, T2], end_at: saToUtc("2026-11-03", "16:00") });
    const grid = groupByTeamAndDay([b], ["2026-11-03"]);
    assert.equal(grid.get(T1)?.get("2026-11-03")?.length, 1);
    assert.equal(grid.get(T2)?.get("2026-11-03")?.length, 1);
    assert.equal(grid.get(T1)?.get("2026-11-02"), undefined);
  });
  it("collects bookings with no team as unassigned", () => {
    const grid = groupByTeamAndDay([booking({ team_ids: [] })], ["2026-11-02"]);
    assert.equal(grid.get("unassigned")?.get("2026-11-02")?.length, 1);
  });
});

describe("parseBookingForm", () => {
  const base = { kind: "project", status: "tentative", project_id: P1, start_date: "2026-11-02", start_time: "07:00", end_time: "16:00", team_ids: [T1] };
  it("accepts a normal day booking", () => {
    const r = parseBookingForm(base);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.value.start_at, "2026-11-02T05:00:00.000Z");
      assert.equal(r.value.end_at, "2026-11-02T14:00:00.000Z");
      assert.equal(r.value.title, "Installation");
      assert.deepEqual(r.value.team_ids, [T1]);
    }
  });
  it("makes all-day bookings run to midnight after the end date", () => {
    const r = parseBookingForm({ ...base, all_day: "on", end_date: "2026-11-04" });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.end_at, saToUtc("2026-11-05", "00:00"));
  });
  it("requires a project for project work but not for leave", () => {
    assert.equal(parseBookingForm({ ...base, project_id: "" }).ok, false);
    assert.equal(parseBookingForm({ ...base, kind: "leave", project_id: "" }).ok, true);
  });
  it("rejects end before start and overrides without a reason", () => {
    assert.equal(parseBookingForm({ ...base, start_time: "16:00", end_time: "07:00" }).ok, false);
    assert.equal(parseBookingForm({ ...base, end_date: "2026-11-01" }).ok, false);
    assert.equal(parseBookingForm({ ...base, allow_overlap: "on" }).ok, false);
    assert.equal(parseBookingForm({ ...base, allow_overlap: "on", overlap_reason: "Second crew" }).ok, true);
  });
  it("rejects junk ids", () => {
    assert.equal(parseBookingForm({ ...base, team_ids: ["x"] }).ok, false);
    assert.equal(parseBookingForm({ ...base, project_id: "drop table" }).ok, false);
  });
});

describe("describeBookingSaveError", () => {
  it("explains clashes and stale edits", () => {
    assert.match(describeBookingSaveError({ code: "23P01" }), /already booked/);
    assert.match(describeBookingSaveError({ message: "version_conflict" }), /changed this booking/);
  });
});

describe("readinessWarnings", () => {
  const p = { stage: "planning", on_hold: false, payment_status: "part_paid", is_supply_only: false, materials_by_client: false, material_statuses: [] as string[] };
  it("is quiet when ready", () => {
    assert.deepEqual(readinessWarnings(p), []);
  });
  it("warns about deposit, materials and hold", () => {
    const w = readinessWarnings({ ...p, stage: "awaiting_deposit", payment_status: "not_invoiced", on_hold: true, material_statuses: ["ordered", "collected_delivered"] });
    assert.equal(w.length, 3);
  });
  it("ignores materials the client supplies", () => {
    assert.deepEqual(readinessWarnings({ ...p, materials_by_client: true, material_statuses: ["ordered"] }), []);
  });
});

describe("isBacklogCandidate", () => {
  it("includes install jobs before work starts", () => {
    assert.ok(isBacklogCandidate({ stage: "planning", is_supply_only: false, archived_at: null, on_hold: false }));
    assert.ok(!isBacklogCandidate({ stage: "planning", is_supply_only: true, archived_at: null, on_hold: false }));
    assert.ok(!isBacklogCandidate({ stage: "completed", is_supply_only: false, archived_at: null, on_hold: false }));
  });
});

describe("layoutBars", () => {
  const week = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
  it("draws a multi-day job as one bar", () => {
    const b = booking({ start_at: saToUtc("2026-10-29", "00:00"), end_at: saToUtc("2026-11-03", "00:00"), all_day: true });
    const { segments, lanes } = layoutBars([b], week);
    assert.equal(lanes, 1);
    assert.deepEqual([segments[0].start, segments[0].span, segments[0].continuesBefore, segments[0].continuesAfter], [0, 1, true, false]);
  });
  it("stacks overlapping bars and reuses free lanes", () => {
    const a = booking({ id: "a", end_at: saToUtc("2026-11-04", "16:00") });
    const b = booking({ id: "b", start_at: saToUtc("2026-11-03", "07:00"), end_at: saToUtc("2026-11-03", "12:00") });
    const c = booking({ id: "c", start_at: saToUtc("2026-11-05", "07:00"), end_at: saToUtc("2026-11-05", "12:00") });
    const { segments, lanes } = layoutBars([c, b, a], week);
    const lane = Object.fromEntries(segments.map((s) => [s.booking.id, s.lane]));
    assert.equal(lanes, 2);
    assert.deepEqual(lane, { a: 0, b: 1, c: 0 });
  });
  it("skips bookings outside the row", () => {
    const b = booking({ start_at: saToUtc("2026-11-10", "07:00"), end_at: saToUtc("2026-11-10", "16:00") });
    assert.equal(layoutBars([b], week).segments.length, 0);
  });
});

describe("site inspections", () => {
  const base = { kind: "site_inspection", status: "tentative", start_date: "2026-11-05", start_time: "07:00", end_time: "16:00" };
  it("needs a quote or a client typed by hand, never a project", () => {
    assert.equal(parseBookingForm(base).ok, false);
    const manual = parseBookingForm({ ...base, client_name_manual: "Sample Farm", site_manual: "Hermanus", project_id: P1 });
    assert.ok(manual.ok);
    if (manual.ok) {
      assert.equal(manual.value.project_id, null);
      assert.equal(manual.value.title, "Site inspection – Sample Farm");
      assert.equal(manual.value.quote_number, null);
    }
  });
  it("keeps an inspection's existing project link while its quote is unchanged", () => {
    const r = parseBookingForm({ ...base, quote_number: "QU0372", project_id: P1 });
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value.project_id, P1);
  });
  it("keeps the quote snapshot only when it matches the quote", () => {
    const snap = { quote_id: null, number: "QU0372", status: "SENT", client: "Sample Client", person: null, phone: null, email: null, reference: null, title: null, total: 1000, address: null, fetched_at: "2026-11-01T00:00:00Z" };
    const ok = parseBookingForm({ ...base, quote_number: "qu0372", quote_snapshot: JSON.stringify(snap) });
    assert.ok(ok.ok);
    if (ok.ok) {
      assert.equal(ok.value.quote_number, "QU0372");
      assert.equal(ok.value.quote_snapshot?.client, "Sample Client");
      assert.equal(ok.value.title, "Site inspection – Sample Client");
    }
    const wrong = parseBookingForm({ ...base, quote_number: "QU0999", quote_snapshot: JSON.stringify(snap) });
    assert.ok(wrong.ok && wrong.value.quote_snapshot === undefined);
  });
  it("labels bars with the client", () => {
    assert.equal(bookingLabel({ kind: "site_inspection", title: "x", project: null, quote_snapshot: null, client_name_manual: "Sample Farm" }), "Site inspection · Sample Farm");
  });
  it("other kinds are unchanged", () => {
    const leave = parseBookingForm({ kind: "leave", status: "confirmed", start_date: "2026-11-05", all_day: "on" });
    assert.ok(leave.ok && leave.value.quote_number === undefined);
  });
});
