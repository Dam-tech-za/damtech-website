#!/usr/bin/env node
/**
 * Lightweight internal QA — scans TSX/TS for internal href/src paths.
 * Run: node scripts/qa-links.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceDirs = ["app", "components", "lib"];
const hrefPattern = /href=["'](\/[^"'#?]+)["']/g;
const srcPattern = /src=["'](\/images\/[^"']+)["']/g;

const routes = new Set(["/"]);
const links = new Set();
const images = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx?|jsx?|json)$/.test(entry.name)) continue;

    const text = fs.readFileSync(full, "utf8");

    if (full.includes(`${path.sep}app${path.sep}`) && entry.name === "page.tsx") {
      const rel = path.relative(path.join(root, "app"), path.dirname(full));
      const route =
        rel === "."
          ? "/"
          : `/${rel.replace(/\[.*?\]/g, "test").replace(/\\/g, "/")}`;
      routes.add(route.replace(/\/page$/, "").replace(/\/$/, "") || "/");
    }

    let match;
    while ((match = hrefPattern.exec(text))) {
      links.add(match[1].replace(/\/$/, "") || "/");
    }
    while ((match = srcPattern.exec(text))) {
      images.add(match[1]);
    }
  }
}

for (const dir of sourceDirs) {
  walk(path.join(root, dir));
}

const publicImages = new Set();
function walkPublic(dir, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) walkPublic(path.join(dir, entry.name), rel);
    else if (/\.(webp|svg|jpg|png)$/i.test(entry.name)) publicImages.add(rel);
  }
}
walkPublic(path.join(root, "public", "images"), "/images");

let failed = false;

for (const image of images) {
  if (!publicImages.has(image)) {
    console.error(`MISSING IMAGE: ${image}`);
    failed = true;
  }
}

console.log(`Scanned ${links.size} internal hrefs and ${images.size} image paths.`);
console.log("Note: dynamic blog/project routes are not fully validated by this script.");
process.exit(failed ? 1 : 0);
