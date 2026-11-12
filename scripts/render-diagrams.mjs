#!/usr/bin/env node
/**
 * Render blog diagram drawings (SVG) to WebP images for posts.
 *
 *   node scripts/render-diagrams.mjs docs/design/diagrams/<name>.svg [more.svg ...]
 *
 * Each SVG uses the `base-diagram__*` classes from app/brand-pages.css and the
 * colour tokens from app/brand.css, so it renders exactly as the site styles it.
 * Output: public/images/<name>.webp at 3x the SVG viewBox (e.g. 420 wide -> 1260 px),
 * plus the width and height to use on the <img> tag. Needs network for the Inter font.
 *
 * Only for drawn diagrams. Never use this to create or alter photographs.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const SCALE = 3;
const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/render-diagrams.mjs <drawing.svg> [...]");
  process.exit(1);
}

const css = ["app/brand.css", "app/brand-pages.css"]
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

// CHROMIUM_PATH lets you point at an existing Chrome/Chromium if Playwright's own is not installed.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 800, height: 800 } });

for (const file of files) {
  const svg = fs.readFileSync(file, "utf8");
  const [, , , vbW, vbH] = svg.match(/viewBox="(\S+) (\S+) (\S+) (\S+)"/).map(Number);
  await page.setContent(`<!doctype html><html><head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=block">
    <style>${css}
      body { margin: 0; font-family: Inter, sans-serif; }
      .base-diagram__svg { width: ${vbW}px; max-width: none; border: 0; border-radius: 0; }
    </style></head><body>${svg}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.locator("svg").first().screenshot();
  const width = Math.round(vbW * SCALE);
  const height = Math.round(vbH * SCALE);
  const name = path.basename(file, ".svg");
  const out = path.join("public/images", `${name}.webp`);
  await sharp(png)
    .extract({ left: 0, top: 0, width, height })
    .webp({ quality: 88, effort: 6 })
    .toFile(out);
  console.log(`${out}  width="${width}" height="${height}"`);
}

await browser.close();
