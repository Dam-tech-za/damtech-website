#!/usr/bin/env node
/**
 * Full-page screenshots of representative routes at mobile and desktop widths.
 *   node scripts/screenshots.mjs <baseUrl> <outDir> [route ...]
 */
import fs from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3100", outDir = "screenshots", ...routeArgs] = process.argv.slice(2);
const routes = routeArgs.length
  ? routeArgs
  : [
      "/",
      "/waterproofing/",
      "/roof-waterproofing/",
      "/waterproofing-pretoria/",
      "/waterproofing-overstrand/",
      "/dam-liners/",
      "/steel-water-storage-tanks/",
      "/projects/",
      "/services/",
      "/quote/",
      "/contact/",
      "/calculators/",
      "/blog/",
    ];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const route of routes) {
    const page = await ctx.newPage();
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    // Trigger lazy images, then return to top so fixed headers render normally.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    const slug = route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\//g, "_");
    await page.screenshot({
      path: `${outDir}/${slug}-${vp.name}.jpg`,
      fullPage: true,
      type: "jpeg",
      quality: 55,
    });
    await page.close();
    console.log(`${vp.name} ${route}`);
  }
  await ctx.close();
}
await browser.close();
