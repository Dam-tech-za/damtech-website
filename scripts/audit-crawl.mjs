#!/usr/bin/env node
/**
 * Full live-site audit crawl (read-only).
 *
 *   node scripts/audit-crawl.mjs [baseUrl] [outDir]
 *
 * URL universe = live sitemap + Search Console page export + legacy redirect
 * sources (lib/redirects.ts) + every internal link discovered while crawling.
 * For each URL: redirect chain (manual follow), status, X-Robots-Tag, then a
 * real Chromium render at 1366 px and 390 px collecting metadata, headings,
 * JSON-LD validity, social tags, images/alt, console + request failures and
 * mobile horizontal overflow. Every link/image/asset found is status-checked.
 *
 * Analytics (GTM, GA, Meta, Vercel insights) are blocked so the crawl does not
 * pollute production analytics. No forms are submitted.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] ?? "https://www.dam-tech.co.za").replace(/\/$/, "");
const OUT = process.argv[3] ?? "docs/audit";
const SHOTS = "test-results/audit-screens";
const HOST = new URL(BASE).host;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 DamtechAudit/1.0";
const BLOCK = /googletagmanager|google-analytics|analytics\.google|doubleclick|facebook\.(net|com)|googleadservices|vercel-insights|\/_vercel\/(insights|speed-insights)/;

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

const norm = (p) => {
  try {
    const u = new URL(p, BASE);
    if (u.host.replace(/^www\./, "") !== HOST.replace(/^www\./, "")) return null;
    let pathname = u.pathname;
    if (!pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) pathname += "/";
    return pathname + (u.search ?? "");
  } catch {
    return null;
  }
};

/* ---------- 1. URL universe ---------- */
const sources = new Map(); // path -> Set(source)
const add = (p, src) => {
  const n = norm(p);
  if (!n) return;
  if (!sources.has(n)) sources.set(n, new Set());
  sources.get(n).add(src);
};

const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": UA } })).text();
const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: m[1].match(/<loc>([^<]+)<\/loc>/)?.[1],
  lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
}));
const sitemapPaths = new Set();
for (const e of sitemapEntries) {
  const n = norm(e.loc);
  sitemapPaths.add(n);
  add(e.loc, "sitemap");
}

const gscFile = "google_analytics/Pages.csv";
const gsc = {};
if (fs.existsSync(gscFile)) {
  for (const line of fs.readFileSync(gscFile, "utf8").split(/\r?\n/).slice(1)) {
    const [url, clicks, impressions, ctr, position] = line.split(",");
    if (!url?.startsWith("http")) continue;
    const n = norm(url);
    if (!n) continue;
    gsc[n] = { clicks: +clicks, impressions: +impressions, ctr, position: +position };
    add(url, "gsc");
  }
}

const redirectSrc = fs.readFileSync("lib/redirects.ts", "utf8");
for (const m of redirectSrc.matchAll(/source:\s*"([^"]+)"/g)) {
  if (m[1].includes(":") || m[1] === "/") continue;
  add(m[1], "legacy-redirect");
}
// Known non-sitemap app routes worth classifying.
for (const p of ["/quote/", "/quote/success/", "/quote/fallback/", "/thank-you/", "/order/", "/order/success/", "/order/fallback/",
  "/admin/", "/admin/login/", "/calculators/quote-preparation/", "/feeds/google-merchant.tsv", "/category/dam-liner-guides/",
  "/author/infodam-tech-co-za/", "/this-page-does-not-exist-audit/", "/robots.txt", "/sitemap.xml"]) add(p, "app-route");

/* ---------- 2. HTTP layer: manual redirect chains ---------- */
async function httpCheck(p) {
  const chain = [];
  let url = p.startsWith("http") ? p : `${BASE}${p}`;
  for (let i = 0; i < 8; i++) {
    let res;
    try {
      res = await fetch(url, { redirect: "manual", headers: { "user-agent": UA } });
    } catch (e) {
      chain.push({ url, status: 0, error: String(e.message) });
      break;
    }
    const entry = {
      url,
      status: res.status,
      xRobots: res.headers.get("x-robots-tag"),
      contentType: res.headers.get("content-type"),
    };
    chain.push(entry);
    const loc = res.headers.get("location");
    await res.arrayBuffer().catch(() => {});
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).href;
      continue;
    }
    break;
  }
  return chain;
}

/* ---------- 3. Browser layer ---------- */
function extract() {
  const meta = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
  const n = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try {
      const j = JSON.parse(s.textContent);
      const types = [];
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === "object") {
          if (o["@type"]) types.push([].concat(o["@type"]).join("|"));
          if (o["@graph"]) walk(o["@graph"]);
        }
      };
      walk(j);
      return { ok: true, types };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
  const imgs = [...document.querySelectorAll("img")].map((i) => ({
    src: i.currentSrc || i.getAttribute("src"),
    alt: i.getAttribute("alt"),
    decorative: i.getAttribute("role") === "presentation" || i.getAttribute("aria-hidden") === "true",
    complete: i.complete,
    natural: i.naturalWidth,
  }));
  const anchors = [...document.querySelectorAll("a[href]")].map((a) => ({
    href: a.getAttribute("href"),
    text: n(a.textContent || a.getAttribute("aria-label") || a.querySelector("img")?.alt || ""),
    inMain: !!a.closest("main"),
    inNav: !!a.closest("header, nav"),
    inFooter: !!a.closest("footer"),
  }));
  const main = document.querySelector("main") ?? document.body;
  const words = n(main.innerText).split(" ").filter(Boolean).length;
  return {
    title: document.title,
    description: meta('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    robots: meta('meta[name="robots"]'),
    lang: document.documentElement.lang,
    viewport: meta('meta[name="viewport"]'),
    og: {
      title: meta('meta[property="og:title"]'),
      description: meta('meta[property="og:description"]'),
      image: meta('meta[property="og:image"]'),
      url: meta('meta[property="og:url"]'),
      type: meta('meta[property="og:type"]'),
    },
    twitter: { card: meta('meta[name="twitter:card"]'), image: meta('meta[name="twitter:image"]') },
    headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName.toLowerCase()}: ${n(h.textContent)}`),
    breadcrumbs: !!document.querySelector('nav[aria-label*="readcrumb" i], [class*="breadcrumb" i]'),
    jsonLd: ld,
    images: imgs,
    anchors,
    words,
    hasGtm: !!document.querySelector('script[src*="googletagmanager"], script#gtm, script[id*="gtm" i]') ||
      [...document.scripts].some((s) => /googletagmanager|GTM-/.test(s.textContent || "")),
    hasPixel: [...document.scripts].some((s) => /fbq\(|connect\.facebook\.net/.test(s.textContent || "") || /connect\.facebook/.test(s.src)),
    forms: [...document.querySelectorAll("form")].map((f) => ({ action: f.getAttribute("action"), fields: f.querySelectorAll("input,select,textarea").length })),
    telLinks: anchors.filter((a) => a.href.startsWith("tel:")).map((a) => a.href),
    waLinks: anchors.filter((a) => /wa\.me|whatsapp/.test(a.href)).map((a) => a.href),
    mailLinks: anchors.filter((a) => a.href.startsWith("mailto:")).map((a) => a.href),
  };
}

function overflow() {
  const w = document.documentElement.clientWidth;
  const offenders = [];
  if (document.documentElement.scrollWidth > w + 1) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.right > w + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed") {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
        if (offenders.length > 4) break;
      }
    }
  }
  return { scrollWidth: document.documentElement.scrollWidth, width: w, offenders };
}

function tapTargets() {
  const small = [];
  for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [role=button]")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    // inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception)
    if (el.tagName === "A" && el.closest("p, li") && s.display === "inline") continue;
    if (r.width < 24 || r.height < 24) small.push(`${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}`);
  }
  return small.slice(0, 10);
}

const browser = await chromium.launch();
const mkCtx = async (viewport, isMobile) => {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, userAgent: UA, reducedMotion: "reduce" });
  await ctx.route(BLOCK, (r) => r.abort());
  return ctx;
};
const desktop = await mkCtx({ width: 1366, height: 900 }, false);
const mobile = await mkCtx({ width: 390, height: 844 }, true);

const results = {};
const linkGraph = {}; // target -> Set(from)
const assetSet = new Set();
const externalSet = new Map(); // url -> Set(from)

async function render(p, ctx, label) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 200)}`));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (BLOCK.test(u)) return;
    failed.push(`${r.failure()?.errorText} ${u.slice(0, 160)}`);
  });
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !BLOCK.test(u)) failed.push(`${r.status()} ${u.slice(0, 160)}`);
  });
  const t0 = Date.now();
  let resp;
  try {
    resp = await page.goto(`${BASE}${p}`, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  } catch (e) {
    await page.close();
    return { error: String(e.message).slice(0, 200) };
  }
  const loadMs = Date.now() - t0;
  const data = label === "desktop" ? await page.evaluate(extract) : {};
  const ov = await page.evaluate(overflow);
  const taps = label === "mobile" ? await page.evaluate(tapTargets) : [];
  const nav = await page.evaluate(() => {
    const e = performance.getEntriesByType("navigation")[0];
    const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1);
    return { ttfb: e ? Math.round(e.responseStart) : null, domContentLoaded: e ? Math.round(e.domContentLoadedEventEnd) : null, lcp: lcp ? Math.round(lcp.startTime) : null };
  });
  const safe = p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
  const shot = `${SHOTS}/${label}-${safe}.jpg`;
  await page.screenshot({ path: shot, type: "jpeg", quality: 55 }).catch(() => {});
  await page.close();
  return { status: resp?.status(), finalUrl: page.url(), loadMs, nav, consoleErrors, failed: [...new Set(failed)], overflow: ov, smallTapTargets: taps, screenshot: shot, ...data };
}

const queue = [...sources.keys()].sort();
const seen = new Set(queue);
const CONC = 4;

async function processPath(p) {
  const chain = await httpCheck(p);
  const last = chain.at(-1);
  const finalPath = norm(last.url);
  const rec = {
    path: p,
    sources: [...sources.get(p)],
    inSitemap: sitemapPaths.has(p),
    gsc: gsc[p] ?? null,
    chain,
    redirectHops: chain.length - 1,
    finalPath,
    finalStatus: last.status,
    xRobots: last.xRobots,
    contentType: last.contentType,
  };
  const isHtml = (last.contentType ?? "").includes("text/html");
  if (chain.length === 1 && isHtml && !p.startsWith("/admin")) {
    rec.desktop = await render(p, desktop, "desktop");
    rec.mobile = await render(p, mobile, "mobile");
    for (const a of rec.desktop.anchors ?? []) {
      if (!a.href || a.href.startsWith("#") || /^(tel|mailto|javascript):/.test(a.href)) continue;
      const n = norm(a.href);
      if (n) {
        (linkGraph[n] ??= new Set()).add(p);
        if (!seen.has(n) && !n.startsWith("/admin") && !n.startsWith("/_next") && !/\.(jpg|jpeg|png|webp|pdf|svg|tsv)$/i.test(n.split("?")[0])) {
          seen.add(n);
          sources.set(n, new Set(["internal-link"]));
          queue.push(n);
        } else if (/\.(jpg|jpeg|png|webp|pdf|svg)$/i.test(n)) assetSet.add(n);
      } else if (/^https?:/.test(a.href)) {
        if (!externalSet.has(a.href)) externalSet.set(a.href, new Set());
        externalSet.get(a.href).add(p);
      }
    }
    for (const img of rec.desktop.images ?? []) if (img.src) assetSet.add(img.src.startsWith("http") ? img.src : `${BASE}${img.src}`);
    if (rec.desktop.og?.image) assetSet.add(rec.desktop.og.image);
  }
  results[p] = rec;
  process.stdout.write(`${rec.finalStatus} ${rec.redirectHops ? `(${rec.redirectHops} hop → ${finalPath}) ` : ""}${p}\n`);
}

let idx = 0;
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (idx < queue.length) {
      const p = queue[idx++];
      await processPath(p);
    }
  }),
);

/* ---------- 4. Assets and external links ---------- */
async function status(url, method = "HEAD") {
  try {
    let r = await fetch(url, { method, redirect: "follow", headers: { "user-agent": UA } });
    if ((r.status === 405 || r.status === 403 || r.status === 400) && method === "HEAD") r = await fetch(url, { redirect: "follow", headers: { "user-agent": UA } });
    return r.status;
  } catch (e) {
    return `ERR ${e.cause?.code ?? e.message}`.slice(0, 60);
  }
}
const assets = {};
for (const a of assetSet) {
  const u = a.startsWith("http") ? a : `${BASE}${a}`;
  assets[u] = await status(u);
}
const external = {};
for (const [u, from] of externalSet) external[u] = { status: await status(u, "GET"), from: [...from] };

await browser.close();

/* ---------- 5. Classification + issues ---------- */
const PRIVATE = /^\/(admin|auth|api|q|order)\b|^\/quote\/(success|fallback|info|[^/]+\/upload)|^\/thank-you/;
for (const rec of Object.values(results)) {
  const d = rec.desktop ?? {};
  const issues = [];
  const robots = `${d.robots ?? ""} ${rec.xRobots ?? ""}`.toLowerCase();
  const noindex = robots.includes("noindex");
  if (rec.redirectHops > 0) rec.category = rec.finalStatus >= 400 ? "redirect-to-error" : "redirect";
  else if (rec.finalStatus === 404 || rec.finalStatus === 410) rec.category = "not-found";
  else if (rec.finalStatus >= 400) rec.category = "error";
  else if (rec.path.startsWith("/admin")) rec.category = "authenticated/private";
  else if (!(rec.contentType ?? "").includes("text/html")) rec.category = "asset/feed";
  else if (PRIVATE.test(rec.path) || noindex) rec.category = "public/non-indexable";
  else rec.category = "public/indexable";

  const sev = (s, m) => issues.push({ severity: s, issue: m });
  if (rec.redirectHops > 1) sev("P2", `redirect chain of ${rec.redirectHops} hops`);
  if (rec.category === "redirect-to-error") sev(rec.gsc ? "P0" : "P1", "redirect ends in error");
  if ((rec.category === "not-found" || rec.category === "error") && !rec.path.includes("does-not-exist")) sev(rec.gsc || rec.inSitemap ? "P0" : "P1", `HTTP ${rec.finalStatus}`);
  if (rec.inSitemap && rec.category !== "public/indexable") sev("P1", `in sitemap but ${rec.category}`);
  if (rec.category === "public/indexable") {
    if (!rec.inSitemap && !rec.path.includes("?")) sev("P2", "indexable but not in sitemap");
    const canon = d.canonical ? norm(d.canonical) : null;
    if (!d.canonical) sev("P1", "missing canonical");
    else if (canon !== rec.path) sev("P1", `canonical points elsewhere: ${d.canonical}`);
    if (!d.title) sev("P1", "missing title");
    else if (d.title.length > 65) sev("P3", `title ${d.title.length} chars (may truncate)`);
    if (!d.description) sev("P2", "missing meta description");
    else if (d.description.length > 165) sev("P3", `description ${d.description.length} chars`);
    const h1 = (d.headings ?? []).filter((h) => h.startsWith("h1:"));
    if (h1.length === 0) sev("P1", "no H1");
    if (h1.length > 1) sev("P2", `${h1.length} H1s`);
    let prev = 0;
    for (const h of d.headings ?? []) {
      const lvl = +h[1];
      if (prev && lvl > prev + 1) { sev("P3", `heading level skip h${prev}→h${lvl}`); break; }
      prev = lvl;
    }
    if (!d.og?.image) sev("P2", "no og:image");
    if (!d.og?.title) sev("P3", "no og:title");
    if ((d.jsonLd ?? []).some((j) => !j.ok)) sev("P1", "invalid JSON-LD");
    if (d.words < 150) sev("P2", `thin main content (${d.words} words)`);
  }
  const noAlt = (d.images ?? []).filter((i) => i.alt === null && !i.decorative);
  if (noAlt.length) sev("P2", `${noAlt.length} <img> without alt attribute`);
  const broken = (d.images ?? []).filter((i) => i.complete && i.natural === 0 && i.src && !i.src.startsWith("data:"));
  if (broken.length) sev("P1", `${broken.length} broken image(s): ${broken.map((b) => b.src).slice(0, 2).join(", ")}`);
  for (const v of ["desktop", "mobile"]) {
    const r = rec[v];
    if (!r) continue;
    if (r.error) sev("P1", `${v} render error: ${r.error}`);
    if (r.consoleErrors?.length) sev("P2", `${v} console errors: ${r.consoleErrors.slice(0, 2).join(" | ")}`);
    if (r.failed?.length) sev("P2", `${v} failed requests: ${r.failed.slice(0, 2).join(" | ")}`);
    if (r.overflow && r.overflow.scrollWidth > r.overflow.width + 1) sev("P1", `${v} horizontal overflow ${r.overflow.scrollWidth}>${r.overflow.width} (${r.overflow.offenders.join(", ")})`);
  }
  if (rec.mobile?.smallTapTargets?.length) sev("P3", `small tap targets (<24px): ${rec.mobile.smallTapTargets.slice(0, 3).join("; ")}`);
  rec.inboundInternalLinks = linkGraph[rec.path] ? linkGraph[rec.path].size : 0;
  if (rec.category === "public/indexable" && rec.inboundInternalLinks === 0 && rec.path !== "/") sev("P2", "orphan: no inbound internal links found");
  rec.issues = issues;
}

const brokenAssets = Object.entries(assets).filter(([, s]) => s !== 200);
const brokenInternalLinks = Object.entries(linkGraph)
  .filter(([t]) => results[t] && results[t].finalStatus >= 400 && !t.includes("does-not-exist"))
  .map(([t, from]) => ({ target: t, status: results[t].finalStatus, from: [...from] }));
const redirectedInternalLinks = Object.entries(linkGraph)
  .filter(([t]) => results[t] && results[t].redirectHops > 0)
  .map(([t, from]) => ({ target: t, to: results[t].finalPath, from: [...from].slice(0, 10), count: from.size }));

const summary = {
  base: BASE,
  capturedAt: new Date().toISOString(),
  sitemapUrls: sitemapEntries.length,
  sitemapWithLastmod: sitemapEntries.filter((e) => e.lastmod).length,
  totalUrlsChecked: Object.keys(results).length,
  byCategory: Object.values(results).reduce((acc, r) => ((acc[r.category] = (acc[r.category] ?? 0) + 1), acc), {}),
  brokenAssets,
  brokenInternalLinks,
  redirectedInternalLinks,
  external: Object.fromEntries(Object.entries(external).filter(([, v]) => v.status !== 200)),
  externalChecked: Object.keys(external).length,
};

fs.writeFileSync(path.join(OUT, "01-route-inventory.json"), JSON.stringify({ summary, routes: results, assets, external }, null, 1));

const csvEsc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const header = ["route", "category", "sources", "in_sitemap", "gsc_clicks_3m", "gsc_impressions_3m", "http_status", "redirect_hops", "final_path", "x_robots", "meta_robots", "canonical", "title", "title_len", "description_len", "h1", "h1_count", "words", "jsonld_types", "og_image", "inbound_links", "desktop_console_errors", "mobile_overflow", "load_ms_desktop", "issues", "max_severity", "fix_status", "evidence"];
const rows = [header.join(",")];
for (const r of Object.values(results).sort((a, b) => a.path.localeCompare(b.path))) {
  const d = r.desktop ?? {};
  const h1 = (d.headings ?? []).filter((h) => h.startsWith("h1:"));
  const sevs = r.issues.map((i) => i.severity).sort();
  rows.push([
    r.path, r.category, r.sources.join("|"), r.inSitemap, r.gsc?.clicks ?? "", r.gsc?.impressions ?? "", r.finalStatus, r.redirectHops, r.finalPath,
    r.xRobots ?? "", d.robots ?? "", d.canonical ?? "", d.title ?? "", d.title?.length ?? "", d.description?.length ?? "", h1[0]?.slice(4) ?? "", h1.length,
    d.words ?? "", (d.jsonLd ?? []).flatMap((j) => j.types ?? ["INVALID"]).join("|"), d.og?.image ? "yes" : "", r.inboundInternalLinks,
    r.desktop?.consoleErrors?.length ?? "", r.mobile?.overflow ? r.mobile.overflow.scrollWidth > r.mobile.overflow.width + 1 : "", r.desktop?.loadMs ?? "",
    r.issues.map((i) => `${i.severity}: ${i.issue}`).join(" ; "), sevs[0] ?? "", r.issues.length ? "open" : "ok", r.desktop?.screenshot ?? "",
  ].map(csvEsc).join(","));
}
fs.writeFileSync(path.join(OUT, "01-route-inventory.csv"), rows.join("\n") + "\n");
console.log(JSON.stringify(summary, null, 1));
