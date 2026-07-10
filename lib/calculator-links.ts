/** Shared internal links to the calculator hub — consistent anchor text sitewide. */

export const CALCULATORS_HUB_PATH = "/calculators" as const;

export const CALCULATORS_RELATED_LINK = {
  href: CALCULATORS_HUB_PATH,
  label: "Damtech Calculators",
} as const;

export const CALCULATORS_DAM_LINING_LINK = {
  href: `${CALCULATORS_HUB_PATH}#dam-lining-area`,
  label: "Use the dam lining area calculator",
} as const;

export const CALCULATORS_STEEL_TANK_LINK = {
  href: `${CALCULATORS_HUB_PATH}#steel-tank-size`,
  label: "Estimate steel water tank size",
} as const;

export const CALCULATORS_WATERPROOFING_LINK = {
  href: `${CALCULATORS_HUB_PATH}#waterproofing-area`,
  label: "Estimate waterproofing area",
} as const;

export const CALCULATORS_QUOTE_PREP_LINK = {
  href: `${CALCULATORS_HUB_PATH}#project-budget`,
  label: "Use Damtech's calculators before requesting a quote",
} as const;
