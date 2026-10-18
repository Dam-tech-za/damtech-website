# 03 — Calculator reference cases

All public calculators live in `lib/calculators-logic.ts` (UI: `components/calculators/CalculatorHub.tsx`, `/calculators/#<id>`). Each case below was worked by hand, then locked in `lib/calculators-reference.test.ts` (22 tests, part of `npm test`). Browser check of the UI: `tests/e2e/public-journeys.spec.ts` › calculator hub. The quote-preparation asset calculations (`lib/rfq/calculations/*`) were already covered by `calculations.test.ts` and pass.

Display format is en-ZA: space thousands separator, comma decimal (e.g. `1 431,8 m²`). Correct for South Africa; note that RFQ emails format catalogue prices with a decimal point (`toFixed(2)`), a cosmetic inconsistency only.

No formula, wastage factor, price or VAT assumption was changed.

| # | Calculator | Inputs | Hand calculation | Expected | Result |
|---|---|---|---|---|---|
| 1 | Dam lining area | top 42×32, bottom 30×20, depth 3, slope 2:1, freeboard/overlap/anchor/wastage 0 | slope length √(3²+6²)=√45=6.7082; base 30×20=600; sides 2·(42+30)/2·6.7082 + 2·(32+20)/2·6.7082 = 483.0+348.8 | base 600 · sides 831,8 · total 1 431,8 m² | PASS |
| 2 | Dam lining area + allowances | #1 + overlap 0.5, anchor 1, wastage 10 % | perimeter 2·(42+32)=148; (1 431,82 + 148·0.5 + 148·1)·1.10 | 1 819,2 m² | PASS |
| 3 | Dam lining area (UI, fixed allowances) | #1 in browser; overlap 0.3, anchor 1, wastage 10 % fixed by Damtech | (1 431,82 + 148·1.3)·1.10 | 1 431,8 / 1 786,6 m² | PASS (browser) |
| 4 | Dam lining, vertical walls | 10×10 top = bottom, depth 2, slope 0 | 100 + 4·10·2 | 180 m² | PASS |
| 5 | HDPE material | top 50×40, depth 4, anchor 0.5, overlap 0, HDPE | (50+8+1)·(40+8+1)=59·49; rolls ⌈49/7⌉ | 2 891 m², 7 roll widths of 7 m | PASS |
| 6 | PVC material | #5 with PVC | ⌈49/4⌉ | 13 roll widths of 4 m | PASS |
| 7 | Steel tank size | 5 000 L/day × 14 days × 1.2 | 84 000 L; next band ≥ 84 000 | 84 000 L, 84 m³, "at least 100 kL" | PASS |
| 8 | Steel tank > 1 ML | 50 000 × 30 × 1.0 | 1 500 000 L | high-volume guidance | PASS |
| 9 | Annual requirement | 2 000 L/day × 365 | 730 000 L | 730 000 L / 730 m³ | PASS |
| 10 | Water by land size | 2 ha irrigation (6 500 m³/ha/yr default), factor 1 | 13 000; /12; /365 | 13 000 / 1 083,3 / 35,6 m³ | PASS |
| 11 | Irrigation | 10 ha, ETc 650 mm, rain 150 mm, 80 %, 180 d | net 500 mm × 10 ha × 10 = 50 000 m³; gross ÷0.8 | 50 000 / 62 500 m³; 6 250 m³/ha | PASS |
| 12 | Irrigation, rain ≥ ETc | 1 ha, rain 900 mm | max(650−900, 0) | 0 m³ (never negative) | PASS |
| 13 | Rainwater harvesting | 200 m², 600 mm, C 0.85, 30 days | 200·600·0.85 = 102 000 L; ÷365·30 | 102 000 L; 8 384 L | PASS |
| 14 | Waterproofing area | 10×8, 1 layer, upstand 0.3, overlap 10 %, wastage 5 % | 80 + 36·0.3 = 90.8; ×1.1×1.05 | 90,8 / 104,9 m² | PASS |
| 15 | Leaking dam (high) | loss high + wet patches | override rule | High | PASS |
| 16 | Leaking dam (low) | low loss, no damage/wet, HDPE, can empty, good access | score 1+0+0+1+0+0=2 ≤ 5 | Low | PASS |
| 17 | Quote readiness | location, size, dam-lining, liner no, good access, photos | 2+2+2+1+2+2+1+1 = 13 ≥ 10 | Ready to request a quote | PASS |
| 18 | Quote readiness (thin) | dam-lining, difficult access only | 0+0+2+0+1+0+1+1 = 5 < 6 | More information needed | PASS |

## Validation and edge cases (PASS)
Negative overlap, zero depth, wastage 41 %, bottom wider than top, non-numeric length, thickness > 3 mm, unknown material, 0 backup days, safety factor 0.9, runoff coefficient 1.2, 0 layers, upstand 4 m, unknown calculator id — all return field errors (no crash, no result). In the browser, an invalid value shows the summary "Please check the highlighted fields…" plus the field message, and the results card stays empty. Reset clears inputs.

## Observations for the owner (not changed)
1. **Freeboard may be double-counted in the dam-lining area tool.** The depth help text says "floor up to the planned freeboard line", and freeboard (default 0.5 m) is then added to that depth. If customers follow the help text, side-slope area is over-estimated (about +16 % on the reference basin). The result is conservative (more liner, never less), so it is not a safety issue, but either the depth help text should say "to normal water level" or the default freeboard should be 0. Needs the owner's estimating preference.
2. The HDPE/PVC estimator uses a flat-sheet envelope (top + 2 × depth). For any slope gentler than vertical this is an upper bound — conservative by design, consistent with its "planning layout" wording.
3. The 4-second minimum fill time (anti-bot) also applies to the quote wizard; fast humans with autofill could see "Please take a moment to review your details." It is a soft message and retrying works.
