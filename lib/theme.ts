/**
 * Damtech design tokens — keep in sync with :root in app/globals.css.
 * Use CSS variables in components; import these only for non-CSS contexts (email, OG, etc.).
 */
export const DAMTECH_THEME = {
  /** Hero / primary dark background */
  navyDark: "#031926",
  /** Secondary button background & secondary dark surfaces */
  navyMid: "#031A2E",
  /** Primary buttons and active nav links */
  accentBlue: "#026BC6",
  /** Secondary button border/arrow, phone number links, and icon badges */
  accentBlueLight: "#2B9FF3",
  /** Hero kicker/eyebrow text and heading accent */
  heroHeading: "#2FA3F9",
  /** Hero image gradient overlay color */
  heroGradient: "#0F283D",
  /** Secondary/supporting text on dark backgrounds */
  bodyGray: "#CBD5E1",
  /** Secondary/supporting text on light backgrounds */
  bodyGrayDark: "#475569",
  header: "#F2F6FB",
} as const;

export const THEME = {
  primary: DAMTECH_THEME.accentBlue,
  primaryHover: "#025AA8",
  accent: DAMTECH_THEME.accentBlue,
  accentLight: DAMTECH_THEME.accentBlueLight,
  heroHeading: DAMTECH_THEME.heroHeading,
  heroGradient: DAMTECH_THEME.heroGradient,
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
