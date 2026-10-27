import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReminderEmail, isReminderDay, type ReminderOrder, type ReminderProject } from "./reminders.ts";

const TODAY = "2026-10-27";
const SITE = "https://www.dam-tech.co.za";

const project = (extra: Partial<ReminderProject>): ReminderProject => ({
  id: "p1",
  title: "Smith farm dam",
  stage: "planning",
  on_hold: false,
  on_hold_reason: null,
  next_action: "Order liner",
  next_action_due: "2026-11-20",
  next_action_owner: null,
  needs_review: false,
  archived_at: null,
  ...extra,
});

const order = (extra: Partial<ReminderOrder>): ReminderOrder => ({
  id: "o1",
  project_id: "p1",
  supplier_name: "Liner supplier",
  description: "1.0 mm HDPE",
  status: "ordered",
  expected_date: "2026-11-30",
  project_title: "Smith farm dam",
  ...extra,
});

describe("daily operations reminder", () => {
  it("sends nothing when nothing is due", () => {
    assert.equal(buildReminderEmail([project({})], [order({})], 0, TODAY, SITE), null);
  });

  it("lists overdue actions first and says so in the subject", () => {
    const email = buildReminderEmail(
      [project({ id: "a", title: "Late job", next_action_due: "2026-10-20" }), project({ id: "b", title: "Today job", next_action_due: TODAY })],
      [],
      0,
      TODAY,
      SITE,
    );
    assert.ok(email);
    assert.match(email.subject, /1 overdue action/);
    assert.ok(email.text.indexOf("Late job") < email.text.indexOf("Today job"));
    assert.ok(email.text.includes(`${SITE}/admin/operations/projects/a/`));
    assert.equal(email.itemCount, 2);
  });

  it("includes jobs without a next action, late supplier orders and unmatched invoices", () => {
    const email = buildReminderEmail(
      [project({ next_action: null, next_action_due: null })],
      [order({ expected_date: "2026-10-01" }), order({ id: "o2", status: "collected_delivered", expected_date: "2026-10-01" })],
      2,
      TODAY,
      SITE,
    );
    assert.ok(email);
    assert.equal(email.itemCount, 3);
    assert.ok(email.text.includes("Liner supplier"));
    assert.ok(email.text.includes("2 Xero invoice(s)"));
  });

  it("leaves out completed and archived jobs and escapes HTML", () => {
    const email = buildReminderEmail(
      [
        project({ stage: "completed", next_action_due: "2026-10-01" }),
        project({ id: "x", archived_at: "2026-10-01T00:00:00Z", next_action_due: "2026-10-01" }),
        project({ id: "y", title: "<b>Tank</b>", next_action_due: "2026-10-01" }),
      ],
      [],
      0,
      TODAY,
      SITE,
    );
    assert.ok(email);
    assert.equal(email.itemCount, 1);
    assert.ok(email.html.includes("&lt;b&gt;Tank&lt;/b&gt;"));
    assert.ok(!email.html.includes("<b>Tank</b>"));
  });

  it("does not run on Sundays", () => {
    assert.equal(isReminderDay("2026-10-25"), false);
    assert.equal(isReminderDay("2026-10-26"), true);
    assert.equal(isReminderDay("2026-10-31"), true);
  });
});
