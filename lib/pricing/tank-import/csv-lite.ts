/**
 * Self-contained CSV helpers for the tank-model importer.
 *
 * Kept dependency-free (no cross-package value imports) so the pure pipeline
 * can be exercised directly by the Node test runner.
 */

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  delimiter: "," | ";" | "\t";
  hadBom: boolean;
};

export function stripBom(text: string): { text: string; hadBom: boolean } {
  if (text.charCodeAt(0) === 0xfeff || text.startsWith("\uFEFF")) {
    return { text: text.replace(/^\uFEFF/, ""), hadBom: true };
  }
  if (text.startsWith("ï»¿")) {
    return { text: text.slice(3), hadBom: true };
  }
  return { text, hadBom: false };
}

export function detectDelimiter(headerLine: string): "," | ";" | "\t" {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

export function splitCsvLine(line: string, delimiter: "," | ";" | "\t"): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells.map((c) => c.replace(/^"|"$/g, "").trim());
}

export function parseCsvText(raw: string): ParsedCsv {
  const { text, hadBom } = stripBom(raw);
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalised) {
    return { headers: [], rows: [], delimiter: ",", hadBom };
  }
  const lines = normalised.split("\n").filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = splitCsvLine(lines[0] ?? "", delimiter);
  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  return { headers, rows, delimiter, hadBom };
}

export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}

export function normaliseHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseOptionalNumber(raw: unknown): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(/,/g, "").trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseBoolean(raw: unknown, fallback = true): boolean {
  if (raw == null || String(raw).trim() === "") return fallback;
  const v = String(raw).trim().toLowerCase();
  if (["true", "yes", "1", "active", "y"].includes(v)) return true;
  if (["false", "no", "0", "inactive", "n"].includes(v)) return false;
  return fallback;
}
