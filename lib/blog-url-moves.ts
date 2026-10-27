/**
 * Blog posts moved from root-level WordPress slugs to `/blog/<slug>/` (Oct 2026).
 * Old slug → new slug. Several old posts were merged into one surviving post, so
 * more than one old slug can map to the same new slug. Every entry gets a 301.
 */
export const BLOG_URL_MOVES: Readonly<Record<string, string>> = {
  "essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa":
    "farm-dam-leak-repair",
  "powerful-strategies-to-optimize-borehole-and-farm-dam-water-integration-for-reliable-irrigation-in-south-africa":
    "integrating-borehole-water-farm-dams",
  "strategies-to-prevent-costly-farm-dam-liner-failure": "prevent-farm-dam-liner-failure",
  "proven-leak-repair-solutions-for-corrugated-steel-reservoirs": "steel-reservoir-leak-repair",
  "water-saving-hacks-for-south-african-farm-dams": "farm-dam-water-saving-tips",
  "critical-water-storage-tips-to-overcome-borehole-water-shortages-during-south-african-droughts":
    "borehole-shortage-water-storage",
  "understanding-the-impact-of-soil-types-on-dam-liner-selection-and-longevity":
    "dam-lining-sandy-clay-soils",
  "innovative-maintenance-strategies-to-extend-the-life-of-corrugated-steel-reservoirs-in-harsh-agricultural-environments":
    "steel-reservoir-maintenance",
  "proper-dam-and-borehole-water-management": "integrating-borehole-water-farm-dams",
  "proper-water-storage-and-borehole-integration": "borehole-irrigation-storage-sizing",
  "maximizing-irrigation-efficiency-with-proper-reservoir-maintenance": "steel-reservoir-maintenance",
  "cost-benefit-analysis-of-corrugated-steel-reservoir": "steel-reservoir-cost-benefit",
  "how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa":
    "farm-dam-drought-water-levels",
  "the-best-practices-for-repairing-leaks-in-corrugated-steel-reservoirs-to-avoid-costly-water-loss":
    "steel-reservoir-leak-repair",
  "protect-your-farm-dam-from-contamination-during-load-shedding":
    "farm-dam-load-shedding-contamination",
  "integrating-borehole-water-with-farm-dams": "integrating-borehole-water-farm-dams",
  "how-to-optimize-farm-dam-water-quality-to-prevent-livestock-illnesses-in-south-africa":
    "farm-dam-water-quality-livestock",
  "choosing-the-best-dam-lining-solutions-to-prevent-seepage-in-sandy-and-clay-soils-common-in-south-african-farmlands":
    "dam-lining-sandy-clay-soils",
  "how-seasonal-rainfall-patterns-influence-dam-design-and-reservoir-capacity-in-south-africa":
    "rainfall-dam-design-capacity",
  "the-role-of-vegetation-management-around-reservoirs-to-prevent-liner-damage-and-water-contamination":
    "reservoir-vegetation-management",
  "assessing-the-environmental-impact-of-different-dam-lining-materials-on-south-african-farmland":
    "dam-lining-materials-environmental-impact",
  "the-importance-of-proper-dam-liners-how-hdpe-protects-your-investment":
    "hdpe-dam-liner-benefits",
};

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`;
}
