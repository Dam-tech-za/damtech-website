export type Clause = {
  id: string;
  text: string;
  included: boolean;
};

let clauseSeq = 0;
function nextClauseId(): string {
  clauseSeq += 1;
  return `clause-${Date.now().toString(36)}-${clauseSeq}`;
}

/**
 * Parse a text block (numbered list, bulleted list, or free lines) into
 * individual clauses. Leading list markers ("1.", "-", "•") are stripped.
 */
export function parseClauses(text: string | null | undefined): Clause[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => ({
    id: nextClauseId(),
    text: line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, "").trim(),
    included: true,
  }));
}

/** Serialise clauses back into a numbered text block (included clauses only). */
export function clausesToText(clauses: Clause[]): string {
  const included = clauses.filter((c) => c.included && c.text.trim().length > 0);
  return included.map((c, index) => `${index + 1}. ${c.text.trim()}`).join("\n");
}

export function newClause(text = ""): Clause {
  return { id: nextClauseId(), text, included: true };
}

export function countClauses(text: string | null | undefined): number {
  return parseClauses(text).filter((c) => c.text.length > 0).length;
}
