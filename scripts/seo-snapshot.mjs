#!/usr/bin/env node
/**
 * SEO/content snapshot of every sitemap URL, for before/after regression diffs.
 *
 *   node scripts/seo-snapshot.mjs <baseUrl> <out.json>
 *   node scripts/seo-snapshot.mjs --diff <before.json> <after.json> [report.md]
 *
 * Captures per route: HTTP status, title, meta description, canonical, robots,
 * Open Graph text, H1–H6 wording/order, main visible text, internal links and
 * JSON-LD. Text is captured from the rendered DOM at a mobile and a desktop
 * width so content hidden at one breakpoint is detected.
 */
import fs from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);

if (args[0] === "--diff") {
  diff(args[1], args[2], args[3]);
} else {
  await snapshot(args[0] ?? "http://127.0.0.1:3100", args[1] ?? "seo-snapshot.json");
}

async function snapshot(baseUrl, outFile) {
  const base = baseUrl.replace(/\/$/, "");
  const sitemapXml = await (await fetch(`${base}/sitemap.xml`)).text();
  const paths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .filter((p, i, all) => all.indexOf(p) === i)
    .sort();

  const browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // Never send analytics hits from audit runs (keeps production GA4/Meta clean).
  const analytics = /googletagmanager|google-analytics|analytics\.google|doubleclick|facebook\.(net|com)|vercel-insights|speed-insights/;
  await desktop.route(analytics, (r) => r.abort());
  await mobile.route(analytics, (r) => r.abort());
  const result = { base, capturedAt: new Date().toISOString(), routes: {} };

  for (const path of paths) {
    const page = await desktop.newPage();
    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const data = await page.evaluate(extractPage);
    data.status = response?.status() ?? 0;
    await page.close();

    const mPage = await mobile.newPage();
    await mPage.goto(`${base}${path}`, { waitUntil: "networkidle" });
    data.mobileVisibleText = await mPage.evaluate(visibleText);
    data.desktopVisibleText = data.visibleText;
    delete data.visibleText;
    await mPage.close();

    result.routes[path] = data;
    process.stdout.write(`${data.status} ${path}\n`);
  }

  await browser.close();
  fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
  console.log(`Wrote ${paths.length} routes to ${outFile}`);
}

/* Runs in the page. */
function extractPage() {
  const meta = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const main = document.querySelector("main") ?? document.body;
  const headings = [...main.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
    (h) => `${h.tagName.toLowerCase()}: ${norm(h.textContent)}`,
  );
  const links = [
    ...new Set(
      [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && (h.startsWith("/") || h.includes("dam-tech.co.za")))
        .map((h) => h.replace(/^https?:\/\/(www\.)?dam-tech\.co\.za/, "").split("#")[0] || "/")
        .map((h) => (h.endsWith("/") || h.includes("?") || h.includes(".") ? h : `${h}/`)),
    ),
  ].sort();
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
    (s) => s.textContent,
  );
  // Paragraph-level text blocks in main, in DOM order (layout-independent).
  const blocks = [...main.querySelectorAll("p, li, td, th, dd, dt, blockquote, figcaption")]
    .filter((el) => !el.querySelector("p, li"))
    .map((el) => norm(el.textContent))
    .filter((t) => t.length > 0);
  const visible = (() => {
    const out = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
      const t = norm(walker.currentNode.textContent);
      if (!t) continue;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
      out.push(t);
    }
    return out.join(" ");
  })();
  return {
    title: document.title,
    description: meta('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    robots: meta('meta[name="robots"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    headings,
    blocks: [...new Set(blocks)],
    links,
    jsonLd,
    visibleText: visible,
  };
}

function visibleText() {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const main = document.querySelector("main") ?? document.body;
  const out = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    const t = norm(walker.currentNode.textContent);
    if (!t) continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })) continue;
    out.push(t);
  }
  return out.join(" ");
}

function diff(beforeFile, afterFile, reportFile) {
  const before = JSON.parse(fs.readFileSync(beforeFile, "utf8")).routes;
  const after = JSON.parse(fs.readFileSync(afterFile, "utf8")).routes;
  const lines = [];
  let issues = 0;
  const allPaths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  for (const path of allPaths) {
    const b = before[path];
    const a = after[path];
    const out = [];
    if (!b) out.push("NEW route (not in baseline)");
    else if (!a) out.push("REMOVED from sitemap");
    else {
      for (const key of ["status", "title", "description", "canonical", "robots", "ogTitle", "ogDescription"]) {
        if (b[key] !== a[key]) out.push(`${key}: ${JSON.stringify(b[key])} → ${JSON.stringify(a[key])}`);
      }
      const hb = b.headings.join("\n");
      const ha = a.headings.join("\n");
      if (hb !== ha) {
        const removed = b.headings.filter((h) => !a.headings.includes(h));
        const added = a.headings.filter((h) => !b.headings.includes(h));
        if (removed.length) out.push(`headings removed: ${removed.map((h) => `"${h}"`).join(", ")}`);
        if (added.length) out.push(`headings added: ${added.map((h) => `"${h}"`).join(", ")}`);
        if (!removed.length && !added.length) out.push("heading order changed");
      }
      const removedBlocks = b.blocks.filter((t) => !a.blocks.includes(t) && !a.desktopVisibleText.includes(t));
      if (removedBlocks.length) {
        out.push(`text blocks missing (${removedBlocks.length}): ${removedBlocks.slice(0, 8).map((t) => `"${t.slice(0, 90)}"`).join("; ")}`);
      }
      const mobileMissing = b.blocks.filter(
        (t) => b.mobileVisibleText.includes(t) && !a.mobileVisibleText.includes(t),
      );
      if (mobileMissing.length) {
        out.push(`text visible on mobile before but not after (${mobileMissing.length}): ${mobileMissing.slice(0, 5).map((t) => `"${t.slice(0, 80)}"`).join("; ")}`);
      }
      const lostLinks = b.links.filter((l) => !a.links.includes(l));
      if (lostLinks.length) out.push(`internal links lost: ${lostLinks.join(", ")}`);
      const ldB = b.jsonLd.slice().sort().join("\n");
      const ldA = a.jsonLd.slice().sort().join("\n");
      if (ldB !== ldA) out.push("JSON-LD changed");
    }
    if (out.length) {
      issues += out.length;
      lines.push(`### \`${path}\``, ...out.map((o) => `- ${o}`), "");
    }
  }

  const header = [
    `# SEO snapshot diff`,
    "",
    `Before: \`${beforeFile}\` · After: \`${afterFile}\``,
    `Routes compared: ${allPaths.length} · Findings: ${issues}`,
    "",
  ];
  const report = [...header, ...(lines.length ? lines : ["No differences found."])].join("\n");
  if (reportFile) fs.writeFileSync(reportFile, report);
  console.log(report);
}
