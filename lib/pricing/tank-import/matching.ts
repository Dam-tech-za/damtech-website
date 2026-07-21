/** Pure RFQ capacity-matching for the tank catalogue. */

export type CapacityCandidate = {
  id: string;
  usableCapacityKl: number | null;
  isActive: boolean;
};

export type TankSuggestion<T> = {
  model: T;
  role: "below" | "match" | "above";
  deltaPercent: number | null;
};

function delta(usable: number | null, requiredKl: number): number | null {
  if (usable == null || requiredKl <= 0) return null;
  return Math.round(((usable - requiredKl) / requiredKl) * 100);
}

/**
 * Suggest the smallest active model meeting the required usable capacity, plus
 * one model below and one above where available. Never auto-selects.
 */
export function suggestTankModels<T extends CapacityCandidate>(
  models: T[],
  requiredKl: number,
): TankSuggestion<T>[] {
  const active = models
    .filter((m) => m.isActive && m.usableCapacityKl != null)
    .sort((a, b) => (a.usableCapacityKl ?? 0) - (b.usableCapacityKl ?? 0));

  if (requiredKl <= 0) {
    return active.slice(0, 5).map((model) => ({
      model,
      role: "match" as const,
      deltaPercent: null,
    }));
  }

  const matchIndex = active.findIndex((m) => (m.usableCapacityKl ?? 0) >= requiredKl);
  if (matchIndex === -1) {
    // Nothing large enough — show the largest available as the closest option.
    const largest = active[active.length - 1];
    return largest
      ? [{ model: largest, role: "below", deltaPercent: delta(largest.usableCapacityKl, requiredKl) }]
      : [];
  }

  const out: TankSuggestion<T>[] = [];
  const below = matchIndex > 0 ? active[matchIndex - 1] : null;
  const match = active[matchIndex];
  const above = active[matchIndex + 1] ?? null;

  if (below) out.push({ model: below, role: "below", deltaPercent: delta(below.usableCapacityKl, requiredKl) });
  out.push({ model: match, role: "match", deltaPercent: delta(match.usableCapacityKl, requiredKl) });
  if (above) out.push({ model: above, role: "above", deltaPercent: delta(above.usableCapacityKl, requiredKl) });

  return out;
}
