import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1600x900", width: 1600, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

const ZOOM_LEVELS = [1, 1.25, 1.5, 2] as const;

const ROUTES = [
  { slug: "admin", path: "/admin/" },
  { slug: "admin-rfqs", path: "/admin/rfqs/" },
  { slug: "admin-quotes", path: "/admin/quotes/" },
  { slug: "admin-quotes-new", path: "/admin/quotes/new/" },
  { slug: "admin-customers", path: "/admin/customers/" },
  { slug: "admin-pricing", path: "/admin/pricing/materials/" },
  { slug: "admin-suppliers", path: "/admin/pricing/suppliers/" },
  { slug: "admin-settings", path: "/admin/settings/company/" },
  { slug: "admin-audit", path: "/admin/audit/" },
] as const;

const outputRoot = join(process.cwd(), "test-results", "admin-visual");

async function maybeLogin(page: Page) {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  if (!email || !password) return false;

  await page.goto("/admin/login/");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });
  return true;
}

async function setSidebarCollapsed(page: Page, collapsed: boolean) {
  await page.evaluate((value) => {
    localStorage.setItem("damtech-admin-sidebar-collapsed", value ? "1" : "0");
  }, collapsed);
  await page.reload({ waitUntil: "networkidle" });
}

test.describe("admin visual QA", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await maybeLogin(page);
    test.skip(
      !loggedIn && !process.env.PLAYWRIGHT_ALLOW_UNAUTH,
      "Set PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or PLAYWRIGHT_ALLOW_UNAUTH=1",
    );
  });

  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      for (const collapsed of [false, true] as const) {
        test(`${route.slug} @ ${viewport.name} sidebar=${collapsed ? "collapsed" : "expanded"}`, async ({
          page,
        }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          if (collapsed) {
            await page.goto("/admin/");
            await setSidebarCollapsed(page, true);
          }
          await page.goto(route.path, { waitUntil: "networkidle" });
          const dir = join(
            outputRoot,
            route.slug,
            viewport.name,
            collapsed ? "sidebar-collapsed" : "sidebar-expanded",
          );
          mkdirSync(dir, { recursive: true });
          await page.screenshot({
            path: join(dir, "page.png"),
            fullPage: true,
          });
        });
      }
    }
  }

  for (const zoom of ZOOM_LEVELS) {
    test(`admin dashboard zoom ${Math.round(zoom * 100)}%`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/admin/", { waitUntil: "networkidle" });
      await page.evaluate((factor) => {
        document.documentElement.style.zoom = String(factor);
      }, zoom);
      const dir = join(outputRoot, "admin", "1280x800", "zoom", `${Math.round(zoom * 100)}pct`);
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: join(dir, "page.png"), fullPage: true });
    });
  }
});
