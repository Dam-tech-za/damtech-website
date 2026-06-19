export const TOPIC_RULES: {
  pattern: RegExp;
  href: string;
  weight: number;
}[] = [
  { pattern: /\bhdpe\b/i, href: "/hdpe-dam-lining/", weight: 3 },
  { pattern: /\bdam liner/i, href: "/dam-liners/", weight: 3 },
  { pattern: /\bpvc\b/i, href: "/pvc-dam-lining/", weight: 2 },
  { pattern: /\bfarm dam/i, href: "/farm-dam-liners/", weight: 3 },
  { pattern: /\bearth dam/i, href: "/farm-dam-liners/", weight: 2 },
  { pattern: /\bseepage\b/i, href: "/dam-liners/", weight: 2 },
  { pattern: /\bcorrugated steel/i, href: "/steel-water-storage-tanks/", weight: 3 },
  { pattern: /\bsteel (reservoir|tank)/i, href: "/steel-water-storage-tanks/", weight: 3 },
  { pattern: /\breservoir/i, href: "/steel-water-storage-tanks/", weight: 1 },
  { pattern: /\btorch[- ]on/i, href: "/torch-on-dam-lining/", weight: 3 },
  { pattern: /\bbitumen/i, href: "/bitumen-waterproofing/", weight: 2 },
  { pattern: /\bwaterproof/i, href: "/bitumen-waterproofing/", weight: 2 },
  { pattern: /\bleak repair/i, href: "/dam-repair-services/", weight: 2 },
  { pattern: /\birrigation/i, href: "/agricultural-water-storage/", weight: 2 },
  { pattern: /\bagricultural|livestock|farm water/i, href: "/agricultural-water-storage/", weight: 2 },
  { pattern: /\bmining\b/i, href: "/mining-dam-liners/", weight: 2 },
  { pattern: /\bborehole/i, href: "/agricultural-water-storage/", weight: 1 },
];

export function scoreTopics(text: string): Map<string, number> {
  const scores = new Map<string, number>();

  for (const rule of TOPIC_RULES) {
    if (!rule.pattern.test(text)) continue;
    scores.set(rule.href, (scores.get(rule.href) ?? 0) + rule.weight);
  }

  return scores;
}

export function topicOverlapScore(textA: string, textB: string): number {
  let score = 0;

  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(textA) && rule.pattern.test(textB)) {
      score += rule.weight;
    }
  }

  return score;
}
