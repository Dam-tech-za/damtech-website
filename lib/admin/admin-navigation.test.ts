import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_NAV_ITEMS, getNavItemsForRole } from "../auth/permissions.ts";
import {
  ADMIN_NAV_GROUPS,
  activeNavItemId,
  adminBreadcrumbs,
  adminPageTitle,
  groupNavItems,
} from "./navigation.ts";
import { buildAttentionItems, daysSince, type AttentionCounts } from "./dashboard/attention.ts";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
} from "./action-state.ts";
import {
  communicationStatusLabel,
  orderStatusLabel,
  rfqEventLabel,
} from "./labels.ts";
import { ORDER_STATUSES } from "../orders/types.ts";

describe("admin navigation", () => {
  it("places every nav item in exactly one sidebar group", () => {
    const grouped = ADMIN_NAV_GROUPS.flatMap((group) => group.itemIds);
    for (const item of ADMIN_NAV_ITEMS) {
      assert.equal(
        grouped.filter((id) => id === item.id).length,
        1,
        `${item.id} must appear in one group`,
      );
    }
  });

  it("shows Orders in the expanded sidebar for every role that may open it", () => {
    for (const role of ["owner", "admin", "sales", "estimator", "viewer"] as const) {
      const ids = groupNavItems(getNavItemsForRole(role)).flatMap((entry) =>
        entry.items.map((item) => item.id),
      );
      assert.ok(ids.includes("orders"), `${role} should see Orders`);
    }
  });

  it("drops empty groups for restricted roles", () => {
    const groups = groupNavItems(getNavItemsForRole("viewer")).map((entry) => entry.group.id);
    assert.ok(!groups.includes("administration"));
  });

  it("highlights only the most specific item", () => {
    const items = ADMIN_NAV_ITEMS;
    assert.equal(activeNavItemId("/admin/", items), "dashboard");
    assert.equal(activeNavItemId("/admin", items), "dashboard");
    assert.equal(activeNavItemId("/admin/pricing/materials/", items), "pricing");
    assert.equal(activeNavItemId("/admin/pricing/suppliers/", items), "suppliers");
    assert.equal(
      activeNavItemId("/admin/pricing/project-templates/abc/edit/", items),
      "project-templates",
    );
    assert.equal(activeNavItemId("/admin/rfqs/123/?status=new", items), "rfqs");
    assert.equal(activeNavItemId("/admin/orders", items), "orders");
  });

  it("does not treat /admin/rfqsx as the enquiries section", () => {
    assert.equal(activeNavItemId("/admin/rfqsx/", ADMIN_NAV_ITEMS), null);
  });

  it("builds readable breadcrumbs without raw ids", () => {
    const crumbs = adminBreadcrumbs(
      "/admin/rfqs/5b0f6c2e-1d2a-4b3c-9d8e-7f6a5b4c3d2e/",
    );
    assert.deepEqual(crumbs, [
      { label: "Overview", href: "/admin/" },
      { label: "Enquiries", href: "/admin/rfqs/" },
      { label: "Enquiry" },
    ]);
    assert.deepEqual(adminBreadcrumbs("/admin/settings/system/").map((c) => c.label), [
      "Overview",
      "Settings",
      "System health",
    ]);
  });

  it("titles pages in plain English", () => {
    assert.equal(adminPageTitle("/admin/"), "Overview");
    assert.equal(adminPageTitle("/admin/rfqs/"), "Enquiries");
    assert.equal(adminPageTitle("/admin/quotes/new/"), "Quotations");
    assert.equal(adminPageTitle("/admin/audit/"), "Audit log");
  });
});

const ZERO: AttentionCounts = {
  newEnquiries: 0,
  oldestNewSubmittedAt: null,
  informationRequired: 0,
  siteMeasurement: 0,
  readyForQuote: 0,
  ordersAwaitingInvoice: 0,
  failedEmails: 0,
  failedEmailHref: null,
  quotesAwaitingApproval: 0,
  quotesExpiringSoon: 0,
};

describe("overview attention items", () => {
  const now = new Date("2026-10-18T12:00:00Z");

  it("returns nothing when everything is zero", () => {
    assert.deepEqual(buildAttentionItems(ZERO, now), []);
  });

  it("lists failed emails first and links to the affected record", () => {
    const items = buildAttentionItems(
      {
        ...ZERO,
        newEnquiries: 3,
        failedEmails: 2,
        failedEmailHref: "/admin/rfqs/x/#rfq-communication",
      },
      now,
    );
    assert.equal(items[0].id, "failed-emails");
    assert.equal(items[0].tone, "urgent");
    assert.equal(items[0].href, "/admin/rfqs/x/#rfq-communication");
    assert.equal(items[0].label, "2 emails failed to send");
    assert.equal(items[1].id, "new-enquiries");
  });

  it("marks old unreviewed enquiries as urgent and says how old", () => {
    const [item] = buildAttentionItems(
      { ...ZERO, newEnquiries: 61, oldestNewSubmittedAt: "2026-07-16T08:00:00Z" },
      now,
    );
    assert.equal(item.label, "61 new enquiries not yet reviewed");
    assert.equal(item.tone, "urgent");
    assert.match(item.hint, /Oldest is 94 days old/);
    assert.equal(item.href, "/admin/rfqs/?status=new&sort=submitted_asc");
  });

  it("uses singular wording for one item", () => {
    const [item] = buildAttentionItems({ ...ZERO, ordersAwaitingInvoice: 1 }, now);
    assert.equal(item.label, "1 order awaiting an invoice");
  });

  it("shows failed queries as unavailable instead of zero", () => {
    const items = buildAttentionItems({ ...ZERO, ordersAwaitingInvoice: null }, now);
    assert.equal(items.length, 1);
    assert.equal(items[0].tone, "unavailable");
    assert.equal(items[0].count, null);
    assert.match(items[0].label, /could not be loaded/);
  });

  it("computes whole days and ignores bad dates", () => {
    assert.equal(daysSince("2026-10-17T13:00:00Z", now), 0);
    assert.equal(daysSince("2026-10-16T11:00:00Z", now), 2);
    assert.equal(daysSince("not a date", now), null);
    assert.equal(daysSince(null, now), null);
  });
});

describe("admin action results", () => {
  it("wraps success and failure", () => {
    assert.equal(actionSuccess("Saved.")?.ok, true);
    assert.equal(actionFailure("Nope.")?.ok, false);
  });

  it("never exposes raw database errors", () => {
    const message = describeActionError({
      message: 'duplicate key value violates unique constraint "rfqs_pkey"',
    });
    assert.doesNotMatch(message, /constraint|rfqs_pkey/);
  });

  it("explains auth failures", () => {
    assert.match(
      describeActionError({ name: "AdminAuthError", code: "unauthenticated" }),
      /session has expired/,
    );
    assert.match(
      describeActionError({ name: "AdminAuthError", code: "forbidden" }),
      /role is not allowed/,
    );
  });
});

describe("admin labels", () => {
  it("labels every order status", () => {
    for (const status of ORDER_STATUSES) {
      assert.doesNotMatch(orderStatusLabel(status), /_/);
    }
    assert.equal(orderStatusLabel("pending_invoice"), "Awaiting invoice");
  });

  it("falls back to readable text for unknown codes", () => {
    assert.equal(rfqEventLabel("something_new"), "Something new");
    assert.equal(communicationStatusLabel(null), "Unknown");
    assert.equal(communicationStatusLabel("failed"), "Failed");
  });
});

describe("operations navigation", () => {
  it("highlights Procurement, not Projects, on the supplier orders page", () => {
    assert.equal(activeNavItemId("/admin/operations/procurement/", ADMIN_NAV_ITEMS), "procurement");
    assert.equal(activeNavItemId("/admin/operations/projects/abc/", ADMIN_NAV_ITEMS), "ops-projects");
    assert.equal(activeNavItemId("/admin/operations/", ADMIN_NAV_ITEMS), "operations");
    assert.equal(activeNavItemId("/admin/operations/xero-review/", ADMIN_NAV_ITEMS), "xero-review");
  });

  it("shows Financials to owner and admin only", () => {
    const ids = (role: "owner" | "admin" | "sales" | "viewer") => getNavItemsForRole(role).map((i) => i.id);
    assert.ok(ids("owner").includes("financials"));
    assert.ok(ids("admin").includes("financials"));
    assert.ok(!ids("sales").includes("financials"));
    assert.ok(!ids("viewer").includes("financials"));
  });

  it("names project pages in breadcrumbs", () => {
    assert.deepEqual(
      adminBreadcrumbs("/admin/operations/projects/5b0f6c2e-1d2a-4b3c-9d8e-7f6a5b4c3d2e/").map((c) => c.label),
      ["Overview", "Operations", "Projects", "Project"],
    );
  });
});

describe("six-section menu", () => {
  it("shows owners six sections with sub-pages as tabs", async () => {
    const { visibleSections } = await import("./navigation.ts");
    const sections = visibleSections(getNavItemsForRole("owner"));
    assert.deepEqual(sections.map((s) => s.section.label), ["Overview", "Enquiries", "Projects", "Customers", "Money", "Settings"]);
    assert.equal(sections.find((s) => s.section.id === "projects")?.href, "/admin/operations/projects/");
  });

  it("highlights exactly one section for a page, including detail pages", async () => {
    const { activeSectionId } = await import("./navigation.ts");
    const items = getNavItemsForRole("owner");
    assert.equal(activeSectionId("/admin/quotes/abc/", items), "enquiries");
    assert.equal(activeSectionId("/admin/operations/procurement/", items), "projects");
    assert.equal(activeSectionId("/admin/operations/xero-review/", items), "money");
    assert.equal(activeSectionId("/admin/pricing/materials/", items), "settings");
    assert.equal(activeSectionId("/admin/", items), "overview");
  });

  it("hides Money from sales except the unmatched Xero tab", async () => {
    const { visibleSections } = await import("./navigation.ts");
    const money = visibleSections(getNavItemsForRole("sales")).find((s) => s.section.id === "money");
    assert.deepEqual(money?.tabs.map((t) => t.item.id), ["xero-review"]);
  });

  it("shows breadcrumbs only on detail pages", async () => {
    const { detailBreadcrumbs } = await import("./navigation.ts");
    assert.deepEqual(detailBreadcrumbs("/admin/rfqs/"), []);
    assert.ok(detailBreadcrumbs("/admin/rfqs/5b0f6c2e-1d2a-4b3c-9d8e-7f6a5b4c3d2e/").length > 0);
  });
});
