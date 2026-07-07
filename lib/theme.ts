/**
 * Damtech design tokens — keep in sync with :root in app/globals.css.
 * Use CSS variables in components; import these only for non-CSS contexts (email, OG, etc.).
 */
export const DAMTECH_THEME = {
  /** Backgrounds only */
  navyDark: "#0A1929",
  /** Secondary dark surfaces */
  navyMid: "#0F2947",
  /** CTAs, buttons, highlighted headline keywords, active nav links, and kicker/eyebrow headings */
  accentBlue: "#2563EB",
  /** Phone number links and icon badges ONLY — never body copy, sublabels, or kicker headings */
  accentBlueLight: "#7DD3FC",
  /** Secondary/supporting text on dark backgrounds */
  bodyGray: "#CBD5E1",
  /** Secondary/supporting text on light backgrounds */
  bodyGrayDark: "#475569",
  header: "#F2F6FB",
} as const;

export const THEME = {
  primary: DAMTECH_THEME.accentBlue,
  primaryHover: "#1D4ED8",
  accent: DAMTECH_THEME.accentBlue,
  accentLight: DAMTECH_THEME.accentBlueLight,
  navy: DAMTECH_THEME.navyDark,
  navyMid: DAMTECH_THEME.navyMid,
  headerBg: DAMTECH_THEME.header,
} as const;

/** Typography tokens — keep in sync with :root in app/globals.css. */
export const DAMTECH_FONTS = {
  main: 'Inter, "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  weightBody: 400,
  weightNav: 500,
  weightKicker: 600,
  weightHero: 700,
  letterSpacingHero: "-0.02em",
  lineHeightHero: 1.15,
  lineHeightBody: 1.6,
} as const;
