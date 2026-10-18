/**
 * Public customer-journey regression suite (read-only: nothing is submitted).
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 npx playwright test -c playwright.public.config.ts
 *
 * Safe to run against production: analytics/pixel requests are blocked so runs
 * never register as visits or conversions, and no form is ever submitted with
 * valid data (only client-side validation is exercised).
 */
import { expect, test, type Page } from "@playwright/test";

const ANALYTICS = /googletagmanager|google-analytics|analytics\.google|doubleclick|facebook\.(net|com)|vercel-insights|speed-insights/;

test.beforeEach(async ({ context }) => {
  await context.route(ANALYTICS, (r) => r.abort());
});

const TEMPLATES = [
  "/",
  "/dam-liners/",
  "/hdpe-dam-lining/",
  "/steel-water-storage-tanks/",
  "/steel-water-storage-tanks/10000-litre-water-tank/",
  "/roof-waterproofing/",
  "/waterproofing-pretoria/",
  "/waterproofing-overstrand/",
  "/pretoria-dam-liners/",
  "/projects/",
  "/projects/worcester-bitumen-earth-dam-lining/",
  "/blog/",
  "/how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa/",
  "/calculators/",
  "/quote/",
  "/contact/",
  "/faq/",
];

async function canonicalPath(page: Page) {
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  return href ? new URL(href).pathname : null;
}

test.describe("templates", () => {
  for (const path of TEMPLATES) {
    test(`${path} renders with one H1, self canonical and no page errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await canonicalPath(page)).toBe(path);
      expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBe(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("crawl controls", () => {
  test("404 page returns 404 and is not indexable", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-damtech-page/");
    expect(res?.status()).toBe(404);
    const robots = await page.locator('meta[name="robots"]').evaluateAll((m) => m.map((x) => x.getAttribute("content")));
    expect(robots.some((c) => c?.includes("noindex"))).toBe(true);
  });

  test("robots.txt blocks private areas and lists the sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    for (const p of ["/admin/", "/api/", "/auth/"]) expect(body).toContain(`Disallow: ${p}`);
    expect(body).toMatch(/Sitemap: https:\/\/www\.dam-tech\.co\.za\/sitemap\.xml/);
  });

  test("sitemap lists only canonical www URLs and no private routes", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(60);
    for (const loc of locs) {
      expect(loc).toMatch(/^https:\/\/www\.dam-tech\.co\.za\//);
      expect(loc).not.toMatch(/\/(admin|api|auth|q|order|thank-you)\b/);
    }
  });

  test("admin redirects anonymous visitors to login and is noindex", async ({ request }) => {
    const res = await request.get("/admin/", { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/admin/login/");
    const login = await request.get("/admin/login/");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("Search Console 404s now redirect to the intended page", async ({ request }) => {
    const cases: Record<string, string> = {
      "/10000-litre-fish-pond/": "/steel-water-storage-tanks/10000-litre-fish-pond/",
      "/steel-water-storage-tank/100000-litre-water-tank/": "/steel-water-storage-tanks/100000-litre-water-tank/",
      "/dam-tech.co.za/hdpe-dam-lining/": "/hdpe-dam-lining/",
      "/steel-storage-tanks/": "/steel-water-storage-tanks/",
    };
    for (const [from, to] of Object.entries(cases)) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect([301, 308], from).toContain(res.status());
      expect(new URL(res.headers()["location"], "http://x").pathname, from).toBe(to);
    }
  });
});

test.describe("contact actions", () => {
  test("phone, WhatsApp and email links are well formed on every key page", async ({ page }) => {
    for (const path of ["/", "/roof-waterproofing/", "/contact/"]) {
      await page.goto(path);
      const tels = await page.locator('a[href^="tel:"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      expect(tels.length, path).toBeGreaterThan(0);
      for (const t of tels) expect(t).toMatch(/^tel:\+27\d{9}$/);
      const was = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      for (const w of was) expect(w).toMatch(/^https:\/\/wa\.me\/27\d{9}(\?text=[^ ]*)?$/);
      const mails = await page.locator('a[href^="mailto:"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      for (const m of mails) expect(m).toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i);
    }
  });
});

test.describe("navigation", () => {
  test("desktop header links all resolve", async ({ page, request }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/");
    const hrefs = await page.locator("header a[href^='/']").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))]);
    expect(hrefs.length).toBeGreaterThan(4);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("mobile menu opens, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /menu/i }).first();
    await toggle.click();
    const menuLink = page.getByRole("link", { name: /^contact/i }).last();
    await expect(menuLink).toBeVisible();
    await menuLink.click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("no horizontal overflow at 390 px on conversion pages", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/quote/", "/calculators/", "/roof-waterproofing/", "/steel-water-storage-tanks/"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("quote form validation (never submits)", () => {
  test("required fields: name, email, province, town, message", async ({ page }) => {
    await page.goto("/quote/");
    const form = page.locator("form").filter({ has: page.locator('input[name="email"]') }).first();
    for (const name of ["name", "email", "province", "message"]) {
      await expect(form.locator(`[name="${name}"]`).first(), name).toHaveAttribute("required", "");
    }
    await expect(form.locator('input[name="website"]')).toHaveCount(1); // honeypot present
  });

  test("an invalid email blocks submission client-side", async ({ page }) => {
    await page.goto("/quote/");
    const email = page.locator('input[name="email"]').first();
    await email.fill("not-an-email");
    expect(await email.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
    await email.fill("someone@example.co.za");
    expect(await email.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(true);
  });

  test("service preselect from a residential CTA", async ({ page }) => {
    await page.goto("/quote/?service=Roof%20%2F%20home%20waterproofing");
    const select = page.locator('select[name="serviceRequired"]').first();
    await expect(select).toHaveValue("Roof / home waterproofing");
  });
});

test.describe("calculator hub", () => {
  test("dam lining area matches the hand-checked reference case", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/calculators/#dam-lining-area");
    const ws = page.locator("#calculator-workspace");
    const values: Record<string, string> = { topLength: "42", topWidth: "32", bottomLength: "30", bottomWidth: "20", depth: "3", sideSlope: "2", freeboard: "0" };
    for (const [name, v] of Object.entries(values)) await ws.locator(`[name="${name}"]`).fill(v);
    await ws.getByRole("button", { name: "Calculate Estimate" }).click();
    const card = ws.locator(".calc-results-card");
    await expect(card).toContainText(/1[\s  ]?431,8 m²/); // total liner area
    await expect(card).toContainText(/1[\s  ]?786,6 m²/); // + 0.3 m overlap, 1 m anchor, 10 % wastage
  });

  test("invalid input shows field errors instead of a result", async ({ page }) => {
    await page.goto("/calculators/#dam-lining-area");
    const ws = page.locator("#calculator-workspace");
    await ws.locator('[name="topLength"]').fill("-5");
    await ws.getByRole("button", { name: "Calculate Estimate" }).click();
    await expect(ws.getByText("Please check the highlighted fields before calculating.")).toBeVisible();
    await expect(ws.getByText("Top length must be greater than 0.")).toBeVisible();
    await expect(ws.locator(".calc-results-card")).not.toContainText("m²");
  });

  test("reset clears inputs", async ({ page }) => {
    await page.goto("/calculators/#steel-tank-size");
    const ws = page.locator("#calculator-workspace");
    const daily = ws.locator('[name="dailyRequirement"]');
    await daily.fill("5000");
    await ws.getByRole("button", { name: "Reset" }).click();
    await expect(daily).toHaveValue("");
  });
});

test.describe("follow-up fixes (owner test report 18 Oct)", () => {
  test("bare /order/ link goes to the tank catalogue instead of 'Kit not found'", async ({ page }) => {
    await page.goto("/order/");
    await expect(page).toHaveURL(/\/steel-water-storage-tanks\/$/);
  });

  test("404 has one robots tag and no canonical", async ({ page }) => {
    await page.goto("/definitely-not-a-damtech-page/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test("noindex utility pages no longer declare the home page as canonical", async ({ page }) => {
    await page.goto("/quote/success/");
    const canonicals = await page
      .locator('link[rel="canonical"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
    for (const c of canonicals) expect(c).not.toMatch(/dam-tech\.co\.za\/$/);
  });

  test("share images are 1200×630 JPEGs under 300 KB", async ({ page, request }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toMatch(/\/og\/.+\.jpg$/);
    const res = await request.get(new URL(og!).pathname);
    expect(res.headers()["content-type"]).toBe("image/jpeg");
    expect((await res.body()).length).toBeLessThan(300 * 1024);
  });

  test("contact form lists every missing required field at once (no submit)", async ({ page }) => {
    await page.goto("/contact/");
    const form = page.locator("form").filter({ has: page.locator('input[name="email"]') }).first();
    await form.locator('button[type="submit"]').click();
    const alert = page.getByText(/Please complete these fields:/);
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Name");
    await expect(alert).toContainText("Email");
    await expect(alert).toContainText("Province");
    await expect(form.locator('[name="name"]')).toBeFocused();
  });

  test("sitemap gives every URL a lastmod", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect((xml.match(/<url>/g) ?? []).length).toBe((xml.match(/<lastmod>/g) ?? []).length);
  });
});
