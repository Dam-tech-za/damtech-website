/**
 * Submission behaviour with no database or email provider configured.
 * Runs ONLY against a local build that has no Supabase/Resend env (it refuses
 * any non-localhost base URL), so it can never create a real lead.
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 npx playwright test -c playwright.public.config.ts quote-submit-offline
 */
import { expect, test } from "@playwright/test";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3200";
test.skip(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base), "local offline build only");

test("a complete residential roof enquiry fails gracefully when storage is unavailable", async ({ page }) => {
  await page.goto("/quote/?service=Roof%20%2F%20home%20waterproofing");
  const form = page.locator("form").filter({ has: page.locator('input[name="email"]') }).first();
  await form.locator('[name="name"]').fill("Audit Test (synthetic)");
  await form.locator('[name="email"]').fill("audit-test@example.invalid");
  await form.locator('[name="phone"]').fill("0820000000");
  await form.locator('select[name="province"]').selectOption({ label: "Gauteng" });
  await form.locator('[name="message"]').fill("Synthetic audit test: flat concrete roof in Pretoria East leaking at parapet, about 80 m².");
  await page.waitForTimeout(4200); // server rejects forms completed in under 4 s (bot guard)
  const submit = form.locator('button[type="submit"]');
  await submit.click();
  // Duplicate-click guard: the button is disabled while the request is in flight.
  await expect(form.getByRole("alert").or(page.getByRole("alert")).first()).toBeVisible({ timeout: 30_000 });
  const alertText = await page.getByRole("alert").first().innerText();
  expect(alertText).toMatch(/whatsapp|call|try again|could not|unable|problem/i);
  // The visitor is offered a working alternative contact route.
  await expect(page.locator('a[href^="tel:"], a[href*="wa.me"]').first()).toBeVisible();
});

test("the bot-speed guard rejects a form completed in under 4 seconds", async ({ page }) => {
  await page.goto("/quote/");
  const form = page.locator("form").filter({ has: page.locator('input[name="email"]') }).first();
  await form.locator('[name="name"]').fill("Audit Speed");
  await form.locator('[name="email"]').fill("audit-test@example.invalid");
  await form.locator('select[name="province"]').selectOption({ label: "Western Cape" });
  await form.locator('[name="message"]').fill("Synthetic audit test: foundation damp in Kleinmond.");
  const service = form.locator('select[name="serviceRequired"]');
  if (await service.count()) {
    const values = await service.locator("option").evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value).filter(Boolean));
    await service.selectOption(values[0]);
  }
  await form.locator('button[type="submit"]').click();
  await expect(page.getByText("Please take a moment to review your details.")).toBeVisible({ timeout: 15_000 });
});

test("quote-preparation wizard re-checks assets on submit after jumping ahead", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/calculators/#project-budget");
  const wizard = page.locator(".rfq-wizard");
  await expect(wizard).toBeVisible();
  // Continue with nothing filled in is blocked with a clear message.
  await wizard.getByRole("button", { name: "Continue" }).click();
  await expect(wizard.getByRole("alert")).toHaveText("Full name is required.");
  await wizard.getByLabel("Full name *").fill("Audit Wizard (synthetic)");
  await wizard.getByLabel("Email *").fill("audit-test@example.invalid");
  await wizard.getByRole("button", { name: "Continue" }).click();
  await wizard.getByLabel("Province *").selectOption({ label: "Western Cape" });
  // Clear the default asset name on the Measurements step, then jump straight to Review.
  await wizard.locator(".rfq-wizard__progress button", { hasText: "Measurements" }).click();
  await wizard.getByLabel("Asset name").first().fill("");
  await wizard.locator(".rfq-wizard__progress button", { hasText: "Services" }).click();
  const firstService = wizard.locator('input[type="checkbox"]').first();
  if (!(await firstService.isChecked())) await firstService.check();
  await wizard.locator(".rfq-wizard__progress button", { hasText: "Review" }).click();
  await wizard.getByRole("button", { name: "Submit RFQ" }).click();
  await expect(wizard.getByRole("alert")).toHaveText("Each asset needs a name.");
  await expect(wizard.getByLabel("Asset name").first()).toBeVisible(); // sent back to Measurements
});
