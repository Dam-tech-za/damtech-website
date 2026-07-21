/**
 * Stage: automatic column matching.
 *
 * Deterministic matching priority:
 *   1. Exact canonical match      → 100%  (auto-accept)
 *   2. Exact alias match          →  95%  (auto-accept)
 *   3. Strong normalised/fuzzy    →  80-94% (auto-accept when unambiguous)
 *   4. Suggested fuzzy match      →  60-79% (needs review)
 *   5. Unmatched                  → < 60%  (needs review / ignored)
 *
 * Conflicts (two source columns resolving to the same target) keep the
 * highest-confidence column and flag the rest for explicit resolution.
 */

import {
  CANONICAL_HEADERS,
  HEADER_ALIASES,
  type CanonicalHeader,
} from "../csv/columns";
import { normalizeHeader } from "./normalize-header";
import type { AutoMapResult, ColumnMatch } from "./import-types";

const REQUIRED_FIELDS: CanonicalHeader[] = [
  "item_code",
  "category",
  "product_name",
  "quote_unit",
];

const CANONICAL_SET = new Set<string>(CANONICAL_HEADERS);

/** All candidate strings a fuzzy match can target, grouped by canonical field. */
const FUZZY_CANDIDATES: Array<{ key: string; target: CanonicalHeader }> = (() => {
  const entries: Array<{ key: string; target: CanonicalHeader }> = [];
  for (const canonical of CANONICAL_HEADERS) {
    entries.push({ key: canonical, target: canonical });
  }
  for (const [alias, target] of Object.entries(HEADER_ALIASES)) {
    entries.push({ key: alias, target });
  }
  return entries;
})();

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j += 1) prev[j] = curr[j];
  }
  return prev[n];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

type RawMatch = {
  sourceHeader: string;
  normalised: string;
  target: CanonicalHeader | null;
  confidence: number;
  method: ColumnMatch["method"];
};

function matchSingleHeader(header: string): RawMatch {
  const normalised = normalizeHeader(header);
  if (!normalised) {
    return { sourceHeader: header, normalised, target: null, confidence: 0, method: "unmatched" };
  }

  // 1. Exact canonical match.
  if (CANONICAL_SET.has(normalised)) {
    return {
      sourceHeader: header,
      normalised,
      target: normalised as CanonicalHeader,
      confidence: 100,
      method: "exact",
    };
  }

  // 2. Exact alias match.
  const alias = HEADER_ALIASES[normalised];
  if (alias) {
    return { sourceHeader: header, normalised, target: alias, confidence: 95, method: "alias" };
  }

  // 3-4. Fuzzy against canonical headers + alias keys.
  let best: { target: CanonicalHeader; score: number } | null = null;
  for (const candidate of FUZZY_CANDIDATES) {
    const score = similarity(normalised, candidate.key);
    if (!best || score > best.score) best = { target: candidate.target, score };
  }

  if (best && best.score >= 0.8) {
    return {
      sourceHeader: header,
      normalised,
      target: best.target,
      confidence: Math.round(best.score * 100),
      method: "normalised_alias",
    };
  }
  if (best && best.score >= 0.6) {
    return {
      sourceHeader: header,
      normalised,
      target: best.target,
      confidence: Math.round(best.score * 100),
      method: "fuzzy",
    };
  }

  return { sourceHeader: header, normalised, target: null, confidence: 0, method: "unmatched" };
}

/** Match every CSV header, resolving conflicts and computing statuses. */
export function autoMapColumns(csvHeaders: string[]): AutoMapResult {
  const raw = csvHeaders.map(matchSingleHeader);

  // Detect conflicts: multiple headers resolving to the same target.
  const byTarget = new Map<CanonicalHeader, RawMatch[]>();
  for (const m of raw) {
    if (!m.target) continue;
    const list = byTarget.get(m.target) ?? [];
    list.push(m);
    byTarget.set(m.target, list);
  }

  const conflictLosers = new Set<string>();
  const conflicts: AutoMapResult["conflicts"] = [];
  for (const [target, list] of byTarget) {
    if (list.length <= 1) continue;
    const sorted = [...list].sort((a, b) => b.confidence - a.confidence);
    // Winner keeps the target; the rest become conflicts requiring resolution.
    for (let i = 1; i < sorted.length; i += 1) conflictLosers.add(sorted[i].sourceHeader);
    conflicts.push({ target, headers: list.map((m) => m.sourceHeader) });
  }

  const matches: ColumnMatch[] = raw.map((m) => {
    if (!m.target) {
      return { ...m, status: "unmatched", autoAccepted: false };
    }
    if (conflictLosers.has(m.sourceHeader)) {
      return { ...m, status: "conflict", autoAccepted: false };
    }
    if (m.method === "exact") {
      return { ...m, status: "exact", autoAccepted: true };
    }
    if (m.method === "alias") {
      return { ...m, status: "alias", autoAccepted: true };
    }
    if (m.method === "normalised_alias") {
      // Strong normalised match: auto-accept only when unambiguous.
      return { ...m, status: "alias", autoAccepted: true };
    }
    // Fuzzy suggestions always need review.
    return { ...m, status: "suggested", autoAccepted: false };
  });

  const mapping: Record<string, CanonicalHeader | ""> = {};
  for (const m of matches) {
    // Pre-fill best guess for every resolvable column; the UI decides whether
    // low-confidence guesses are applied. Auto-accepted matches are always applied.
    mapping[m.sourceHeader] = m.autoAccepted && m.target ? m.target : "";
  }

  const acceptedTargets = new Set(
    matches.filter((m) => m.autoAccepted && m.target).map((m) => m.target as CanonicalHeader),
  );
  const missingRequired = REQUIRED_FIELDS.filter((f) => !acceptedTargets.has(f));

  const unmatchedHeaders = matches.filter((m) => m.status === "unmatched").map((m) => m.sourceHeader);
  const suggestedHeaders = matches.filter((m) => m.status === "suggested").map((m) => m.sourceHeader);
  const autoAcceptedCount = matches.filter((m) => m.autoAccepted).length;

  const requiresAttention =
    missingRequired.length > 0 ||
    conflicts.length > 0 ||
    suggestedHeaders.length > 0;

  return {
    matches,
    mapping,
    matchedCount: acceptedTargets.size,
    autoAcceptedCount,
    totalCanonical: CANONICAL_HEADERS.length,
    unmatchedHeaders,
    suggestedHeaders,
    conflicts,
    requiresAttention,
    missingRequired,
  };
}

export { REQUIRED_FIELDS };
