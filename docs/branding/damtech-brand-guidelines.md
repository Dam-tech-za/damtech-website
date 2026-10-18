# Damtech brand guidelines — "Waterline" (October 2026)

Implemented in `app/brand.css` (tokens + homepage/header/footer components) and `app/brand-pages.css` (inner-page templates). Both are unlayered and load after `globals.css`, so they override the legacy `@layer components` rules. New work should use the `dt-*` classes and tokens below rather than adding to `globals.css`.

## Character
Infrastructure contractor, not SaaS. Big real site photographs, heavy expanded type, flat colour blocks with hard edges, thin rules instead of boxed cards. Confident, calm, technical. Swell Roofing is the quality benchmark for scale and contrast; nothing is copied from it (no fonts, copy, layout code or imagery).

## Colour
| Token | Hex | Use |
|---|---|---|
| `--dt-ink` | `#07131D` | Primary text, dark bands (process, footer), primary buttons on light |
| `--dt-ink-2` | `#0E2231` | Secondary dark panels (warranty panel) |
| `--dt-blue` | `#0B5FD9` | Brand blue: eyebrows, links, residential hero block, services index band |
| `--dt-blue-deep` | `#0848A8` | Blue hover |
| `--dt-cyan` | `#3FD0D4` | Water accent: primary CTA on dark/photo, rules, stroked numerals. **Text on cyan is always ink.** |
| `--dt-cream` | `#F5F0E7` | Warm light surface: header, proof/projects/CTA sections, page heroes |
| `--dt-paper` | `#FBF9F4` | Quiet alternate surface |
| `--dt-stone` | `#55606A` | Secondary text on light (≈5.3:1 on cream) |
| `--dt-charcoal` | `#1F262D` | Body copy |
| `--dt-line` / `--dt-line-dark` | 14% ink / 16% white | Hairline rules |

Rules: white text only on ink, blue or a scrimmed photo. Cyan never carries white text. Don't stack two blue sections in a row; alternate cream / white / ink / blue. Legacy tokens (`--primary`, `--color-navy-dark`, …) are re-pointed to this palette so old templates inherit it.

## Type
- **Display:** Archivo (Google Fonts, SIL OFL), variable weight + width (`wdth` 62–125) via `next/font` (`--font-archivo`). Headlines 800 weight at `wdth` 108–112; wordmarks 900 at `wdth` 125, uppercase.
- **Body/UI:** Inter (SIL OFL), unchanged from the previous site.
- Scale tokens: `--dt-size-hero` (to 6.4rem), `-xl` (4.6rem), `-lg` (3.3rem), `-md` (2.35rem), `-sm` (1.5rem). Line-height ≈1 for display, 1.6–1.75 for copy.
- Eyebrows: 0.75rem, 700, 0.16em tracking, uppercase, preceded by a 1.75rem rule.

## Components (reuse these)
- `dt-btn` + `--cyan | --blue | --ink | --ghost | --outline`, `--lg`. 4px radius, 2px border, slight lift on hover.
- `dt-arrow-link` — text link with cyan underline rule and moving arrow.
- `dt-display` + size modifier; `dt-eyebrow` (+ `--cyan`, `--light`); `dt-lede`; `dt-split-header` (headline left, lede right).
- Page hero: `<Hero>` with `image` (photo variant), or `tone="cream" | "blue" | "ink"`, optional `aside`. Residential pages use blue + `ResidentialEnquiryCard`.
- Lists over cards: numbered proof rows, typographic link index, FAQ rows with round +/– buttons, editorial prose rows (heading left / copy right at ≥1024px).
- Photo tiles (`dt-tile`), editorial project grid (`dt-project`, lead tile spans 2×2), dark numbered process band (`dt-process`, stroked cyan numerals).

## Photography framing
Full-bleed where the photo is strong (≥1600 px wide); always with a bottom/left ink scrim so white type passes contrast. Frame with `object-position` only — never crop or edit the source file. No stand-in photos where Damtech has none (residential): use a colour block instead.

## Motion
Short entrance rise on hero elements, slow scale-settle on the hero photo, hover lifts, arrow nudges, tile image zoom. All disabled under `prefers-reduced-motion`. No scroll-jacking, parallax, autoplay video or text hidden until scroll.
