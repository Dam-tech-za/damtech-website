/** CSV text parsing: BOM, delimiters, UTF-8 normalisation. */

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  delimiter: "," | ";" | "\t";
  hadBom: boolean;
};

const MAX_FILE_BYTES_DEFAULT = 5 * 1024 * 1024;
const MAX_ROWS_DEFAULT = 5000;

export function getImportLimits() {
  return {
    maxFileBytes: Number(process.env.PRICING_CSV_MAX_BYTES ?? MAX_FILE_BYTES_DEFAULT),
    maxRows: Number(process.env.PRICING_CSV_MAX_ROWS ?? MAX_ROWS_DEFAULT),
  };
}

export function stripBom(text: string): { text: string; hadBom: boolean } {
  if (text.charCodeAt(0) === 0xfeff || text.startsWith("\uFEFF")) {
    return { text: text.replace(/^\uFEFF/, ""), hadBom: true };
  }
  // UTF-8 BOM often appears as EF BB BF decoded
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

/** Parse a single CSV line respecting quoted fields. */
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

export function validateUploadMeta(input: {
  filename: string;
  mimeType?: string | null;
  byteLength: number;
}): { ok: true } | { ok: false; error: string } {
  const limits = getImportLimits();
  const name = input.filename.toLowerCase();
  if (!name.endsWith(".csv")) {
    return { ok: false, error: "Only .csv files are accepted." };
  }
  const mime = (input.mimeType ?? "").toLowerCase();
  if (
    mime &&
    ![
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain",
      "application/octet-stream",
    ].includes(mime)
  ) {
    return { ok: false, error: `Unsupported MIME type: ${mime}` };
  }
  if (input.byteLength > limits.maxFileBytes) {
    return {
      ok: false,
      error: `File exceeds ${Math.round(limits.maxFileBytes / (1024 * 1024))} MB limit.`,
    };
  }
  if (/\.(exe|js|mjs|sh|bat|cmd|ps1)$/i.test(name)) {
    return { ok: false, error: "Executable or script files are not allowed." };
  }
  return { ok: true };
}

export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}
