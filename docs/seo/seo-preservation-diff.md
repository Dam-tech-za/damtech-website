# SEO preservation diff

## Method
`scripts/seo-snapshot.mjs` loads every URL in `/sitemap.xml` in Chromium (waits for network idle) at 1366 px and 390 px and records: HTTP status, `<title>`, meta description, canonical, robots, OG title/description, H1–H6 wording and order inside `<main>`, paragraph-level text blocks, visible text at each width, internal links, and raw JSON-LD.

- **Baseline:** production build of `main` @ 8d1acc8 (exported, built and served locally on port 3101) → `docs/seo/snapshots/baseline.json`.
- **After:** production build of `claude/project-thread-mfiulx` → `docs/seo/snapshots/after.json`.
- **Diff:** `node scripts/seo-snapshot.mjs --diff baseline.json after.json report.md` → `docs/seo/snapshots/diff-latest.md`.

Re-run after any template change:
```
npm run build && npx next start -p 3100
node scripts/seo-snapshot.mjs http://127.0.0.1:3100 docs/seo/snapshots/after.json
node scripts/seo-snapshot.mjs --diff docs/seo/snapshots/baseline.json docs/seo/snapshots/after.json docs/seo/snapshots/diff-latest.md
```

## Result (latest run, commit 8aef4d2)
75 routes compared. **No changes** to status codes, titles, descriptions, canonicals, robots, OG text, heading wording/order, JSON-LD or internal-link destinations on any route. No content paragraph removed on desktop or mobile.

Two findings, both accepted:
| Route | Change | Reason |
|---|---|---|
| `/` | Hero trust strip no longer renders the duplicate mobile-only chip labels ("Quality linings", "Leak prevention", "Expert install", "Long-term durability") | The same four items still render their full title + detail ("Quality Materials — HDPE & PVC Linings", …) on all widths; the chips were a mobile duplicate. |
| `/contact/` | Form hint "Provide at least one of email or phone so we can respond." removed | Owner request (18 Oct 2026): email and province are now compulsory on every RFQ form, so the hint no longer applies. |

Additions (not regressions): a decorative `DAMTECH` footer wordmark (aria-hidden; the hero wordmark was removed at the owner's request), a footer CTA line, "Roofs / Walls / Foundations" tile type (aria-hidden), the residential enquiry card (areas served, call/WhatsApp/quote), a "Damtech guide" eyebrow on blog articles.

## Note on the first run
The first diff (domcontentloaded) falsely reported FAQ/related-services headings as "added" on ~20 pages: those sections are client-loaded and had not hydrated in time on the slower baseline. The snapshot now waits for network idle and both sides were re-captured, which removed every such false positive.
