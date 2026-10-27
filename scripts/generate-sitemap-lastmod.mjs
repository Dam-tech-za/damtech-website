#!/usr/bin/env node
/**
 * Writes lib/sitemap-lastmod.generated.ts — a per-URL "last significant change" date
 * for the sitemap, taken from git history of each page's own content:
 *   - the route file (app/.../page.tsx), and
 *   - the page's own data block: the `slug: "<slug>"` entry in lib/**.ts, any
 *     ALL_CAPS constant the route imports from @/lib (when it is a page-sized block),
 *     and its PAGE_SEO["key"] metadata entry.
 * Blame is per line (whitespace ignored), so editing one region or product entry
 * does not bump every URL that shares the data file. Uncommitted lines count as today.
 *
 * Run after content changes and commit the output (Vercel clones shallowly, so the
 * build reads the committed file rather than git):
 *   node scripts/generate-sitemap-lastmod.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "lib", "sitemap-lastmod.generated.ts");
const MAX_IMPORTED_BLOCK_LINES = 400;
/** Non-indexable route trees; /quote itself is kept, its sub-routes are not. */
const SKIP_ROUTES = ["admin", "auth", "api", "author", "order", "q", "thank-you", "category"];

const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
const nowSec = Math.floor(Date.now() / 1000);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const libFiles = walk("lib").filter((f) => /\.tsx?$/.test(f) && !/\.test\.ts$|\.generated\.ts$/.test(f));
const libText = new Map(libFiles.map((f) => [f, read(f).split("\n")]));

const uncommitted = new Set(
  git(["status", "--porcelain", "--untracked-files=all", "--", "app", "lib"])
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3).trim().replace(/\\/g, "/")),
);

function fileTime(file) {
  if (uncommitted.has(file)) return nowSec;
  const out = git(["log", "-1", "--format=%at", "--", file]).trim();
  return out ? Number(out) : nowSec;
}

const blameCache = new Map();
function blameTimes(file) {
  if (blameCache.has(file)) return blameCache.get(file);
  let times;
  try {
    const out = git(["blame", "-w", "--line-porcelain", "--", file]);
    times = [];
    for (const line of out.split("\n")) {
      if (line.startsWith("author-time ")) times.push(Number(line.slice(12)));
    }
  } catch {
    times = libText.get(file).map(() => nowSec);
  }
  blameCache.set(file, times);
  return times;
}

const isCommentLine = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

function rangeTime(file, start, end) {
  const times = blameTimes(file);
  const lines = libText.get(file) ?? [];
  let max = 0;
  for (let i = start; i <= end && i < times.length; i++) {
    if (!isCommentLine(lines[i] ?? "")) max = Math.max(max, times[i]);
  }
  return max;
}

/** Object block around a `slug: "<slug>"` line: from its opening `{` to the matching `}`. */
function slugBlocks(slug) {
  const hits = [];
  const needle = new RegExp(`^\\s*slug:\\s*"${slug.replace(/[-/]/g, "\\$&")}",?\\s*$`);
  for (const [file, lines] of libText) {
    lines.forEach((line, i) => {
      if (!needle.test(line)) return;
      const indent = line.match(/^\s*/)[0].length - 2;
      let start = i;
      while (start > 0 && !(lines[start].match(/^\s*/)[0].length === indent && /[{=]\s*\{?\s*$|^\s*\{\s*$/.test(lines[start]))) start--;
      let end = i;
      while (end < lines.length - 1 && !(lines[end].match(/^\s*/)[0].length === indent && /^\s*\}/.test(lines[end]))) end++;
      hits.push({ file, start, end });
    });
  }
  return hits;
}

function exportBlock(file, name) {
  const lines = libText.get(file);
  if (!lines) return null;
  const start = lines.findIndex((l) => new RegExp(`^export const ${name}\\b`).test(l));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !/^export /.test(lines[end])) end++;
  end--;
  return end - start <= MAX_IMPORTED_BLOCK_LINES ? { file, start, end } : null;
}

function pageSeoBlock(key) {
  const file = "lib/pages.ts";
  const lines = libText.get(file);
  if (!lines) return null;
  const start = lines.findIndex((l) => new RegExp(`^\\s*"?${key}"?:\\s*\\{`).test(l));
  if (start < 0) return null;
  const indent = lines[start].match(/^\s*/)[0].length;
  let end = start + 1;
  while (end < lines.length && !(lines[end].match(/^\s*/)[0].length === indent && /^\s*\}/.test(lines[end]))) end++;
  return { file, start, end };
}

function resolveLibImport(spec) {
  const base = spec.replace(/^@\//, "");
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (libText.has(candidate)) return candidate;
  }
  return null;
}

function routeContentTime(routeFile, slug) {
  let t = fileTime(routeFile);
  const src = read(routeFile);
  const blocks = slug ? slugBlocks(slug) : [];

  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*"(@\/lib\/[^"]+)"/g)) {
    const file = resolveLibImport(m[2]);
    if (!file) continue;
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (!/^[A-Z][A-Z0-9_]+$/.test(name) || name === "PAGE_SEO") continue;
      const block = exportBlock(file, name);
      if (block) blocks.push(block);
    }
  }
  for (const m of src.matchAll(/PAGE_SEO\[\s*"([^"]+)"\s*\]|PAGE_SEO\.([A-Za-z0-9_]+)/g)) {
    const block = pageSeoBlock(m[1] ?? m[2]);
    if (block) blocks.push(block);
  }
  for (const b of blocks) t = Math.max(t, rangeTime(b.file, b.start, b.end));
  return t;
}

const result = {};
const isoDate = (sec) =>
  new Date(sec * 1000).toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });

for (const file of walk("app").filter((f) => f.endsWith("/page.tsx") || f === "app/page.tsx")) {
  const route = file
    .replace(/^app\/?/, "")
    .replace(/\/?page\.tsx$/, "")
    .split("/")
    .filter((seg) => !/^\(.*\)$/.test(seg))
    .join("/");
  if (route.includes("[")) continue;
  if (SKIP_ROUTES.some((p) => route === p || route.startsWith(`${p}/`)) || route.startsWith("quote/")) continue;
  const urlPath = `/${route}`;
  const slug = route.split("/").pop() || null;
  result[urlPath] = isoDate(routeContentTime(file, slug));
}

const productsFile = "lib/catalogue/products.ts";
const productRoute = "app/steel-water-storage-tanks/[slug]/page.tsx";
for (const m of read(productsFile).matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
  result[`/steel-water-storage-tanks/${m[1]}`] = isoDate(routeContentTime(productRoute, m[1]));
}

const projectRoute = "app/projects/[slug]/page.tsx";
for (const m of read("lib/projects.ts").matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
  result[`/projects/${m[1]}`] = isoDate(routeContentTime(projectRoute, m[1]));
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
const body = [
  "// Generated by scripts/generate-sitemap-lastmod.mjs — do not edit by hand.",
  "// Per-URL date of the last change to that page's own content (git history).",
  "export const SITEMAP_LASTMOD: Readonly<Record<string, string>> = {",
  ...Object.entries(sorted).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
  "};",
  "",
].join("\r\n");
fs.writeFileSync(OUT, body);
console.log(`Wrote ${Object.keys(sorted).length} entries to ${path.relative(ROOT, OUT)}`);
for (const [k, v] of Object.entries(sorted)) console.log(`${v}  ${k}`);
