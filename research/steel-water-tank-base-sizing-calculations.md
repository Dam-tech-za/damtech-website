# Base Sizing for Lined Corrugated Steel Water Tanks: Calculation Report

**Calculation report (draft for engineering review)** · Prepared 12 November 2026 · Damtech

> **Scope.** This report sizes the three base types from [steel-water-tank-foundations-sand-pad-ring-beam-slab.md](steel-water-tank-foundations-sand-pad-ring-beam-slab.md) for every tank size on the steel tank page: 25 tanks from 3 m to 17 m diameter and 1.55 m to 3.05 m high. The three bases are a compacted sand or crusher-dust pad, a concrete ring beam with compacted fill, and a reinforced concrete slab. It covers loads, bearing, settlement, ring beam hoop force and reinforcement, slab bending over a soft spot, empty-tank wind stability and drainage. Every number comes from the companion workbook [steel-water-tank-base-sizing-calculations.xlsx](steel-water-tank-base-sizing-calculations.xlsx). It holds live formulas, so changing an input recalculates every tank. **This is indicative sizing on assumed soil, not a foundation design.** Inputs marked as assumptions must be confirmed. Any site with problem ground needs a geotechnical investigation and a design by a competent engineer.

---

## Contents

1. [Results in one page](#1-results-in-one-page)
2. [Design basis and assumptions](#2-design-basis-and-assumptions)
3. [Loads](#3-loads)
4. [Sand or crusher-dust pad](#4-sand-or-crusher-dust-pad)
5. [Concrete ring beam](#5-concrete-ring-beam)
6. [Reinforced concrete slab](#6-reinforced-concrete-slab)
7. [Settlement and soil sensitivity](#7-settlement-and-soil-sensitivity)
8. [Wind on an empty tank](#8-wind-on-an-empty-tank)
9. [Drainage](#9-drainage)
10. [Worked example: 10 m × 2.3 m tank](#10-worked-example-10-m--23-m-tank)
11. [Recommended sizes by tank](#11-recommended-sizes-by-tank)
12. [Limitations and what must be confirmed](#12-limitations-and-what-must-be-confirmed)
13. [Workbook guide](#13-workbook-guide)
14. [References](#14-references)

---

## 1. Results in one page

**Water governs everything, and its pressure depends only on depth.** A full tank puts 15.2, 22.6 or 29.9 kPa on its floor, for 1.55 m, 2.3 m and 3.05 m of water. That is the same for a 3 m tank and a 17 m tank. The steel wall and roof add only 0.6 to 3.0 kN per metre of perimeter. On a 0.3 m wide strip at the wall, that is 9% to 64% of the water load on the same strip. So the base is sized for water. The wall seat matters for level and durability, not for strength.

**Bearing is not the problem on firm ground.** The highest ground pressure under any base is about 39 kPa, under the fill of a 3.05 m tank on a ring beam. That uses at most 39% of an assumed 100 kPa allowable bearing pressure. Bearing only becomes critical on soft clay or loose silty sand below about 40 kPa allowable. On that ground the answer is soil replacement or an engineered raft, not a bigger pad.

**Settlement is small on firm ground and large on soft ground.** With an assumed ground modulus of 20 MPa, centre settlement is 2 to 19 mm, and the floor dishes 1 to 7 mm more at the centre than at the wall. At 5 MPa (soft clay, loose silty sand) the same tanks settle 8 to 76 mm and dish 3 to 28 mm. A 1 in 120 crown on the pad (13 to 71 mm rise at the centre) still exceeds the dish in every case, so the floor stays drained towards the wall.

**One ring beam size covers the whole range: 300 mm wide × 500 mm deep with 4 Y12 hoop bars.** The hoop tension from the fill inside the ring is 5 to 40 kN. Even the crack-control demand (309 mm² on the 14 m × 3.05 m tank) is below the 0.25% minimum steel (375 mm²), so the minimum steel governs every tank. The ring carries 0.85 to 1.21 times the pressure under the fill next to it. That means the ring and the floor settle nearly together, which is the aim of a ringwall.

**One slab size covers the whole range: 150 mm thick, 30 MPa, Y10 at 300 mm both ways at the bottom, with a 300 × 450 mm thickened edge.** Minimum steel governs again. That slab can bridge a local soft spot or washout of 1.2 to 1.6 m. It is not a dolomite design, because SANS 1936 designs consider loss of support over much larger spans.

**Every roofed tank needs holding down when empty.** With the assumed 36 m/s wind, roof suction on an empty roofed tank exceeds the tank's own weight by 9 to 346 kN (factored). Indicative anchors are 7 to 36 per tank at 1.5 m spacing, carrying 2 to 10 kN each. Water in a liner tank presses on the liner, not the steel, so it does not reliably hold the shell down. Unroofed tanks also slide in that wind when empty. This is the most important finding for site practice, and the one most sensitive to the assumed roof coefficient.

**Recommended base on firm ground**

| Tank | Base | Key sizes |
|---|---|---|
| Up to 5 m wide, 1.55 m or 2.3 m high | Sand or crusher-dust pad, confined edge | 150 mm at the edge, crowned 1:120, 575 mm overhang, geotextile, 400 mm stone band |
| 6 m wide and up, and all 3.05 m high tanks | Concrete ring beam with compacted fill | 300 × 500 mm, 4 Y12 hoop, R8 or Y8 links (detailing), 150 mm above ground, compacted fill inside |
| Any size on dolomite, swelling clay, fill, or where leaks must be seen | Reinforced slab or engineered raft | 150 mm, Y10 @ 300 each way, 300 × 450 mm edge, as a starting point only |
| Any roofed tank (all bases) | Hold-down anchors | Into the ring beam or slab; ground anchors for a pad. About 1.5 m spacing |

## 2. Design basis and assumptions

All inputs are on the **Inputs** sheet with their source. Key ones:

| Item | Value | Basis |
|---|---|---|
| Water unit weight γw | 9.81 kN/m³ | Physical constant |
| Compacted fill γs, φ | 18 kN/m³, 30° | Typical compacted sand or crusher dust (conservative φ) |
| Active pressure Ka | 0.333 | Rankine, (1 − sin φ)/(1 + sin φ). Padros (2018) shows active, not at-rest, pressure applies to ringwalls |
| Concrete γc, fcu | 24 kN/m³, 30 MPa | 30 MPa / 19 mm foundations (SA project specification practice) |
| Reinforcement fy | 450 MPa, γm = 1.15 | High-yield Y-bars |
| Steel stress for crack control | 130 MPa | Conservative water-retaining practice. **To verify** against SANS 10100-3 |
| Minimum hoop steel | 0.25% of ring section | API 650 B.4.2.3 as quoted. **To verify** |
| Minimum slab steel | 0.13% each way | BS 8110 / SANS 10100-1 style minimum. **To verify** |
| Wall sheet thickness | 1.0 mm average | **Assumption**, Damtech to confirm. Results are insensitive to it |
| Roof dead / imposed load | 0.15 / 0.5 kPa | **Assumption** / SANS 10160-2 inaccessible roof as commonly quoted |
| Allowable bearing qa | 100 kPa | **Assumption**. BS 8004 gives 100–300 kPa for medium dense sand and 75–150 kPa for firm clay |
| Ground modulus E, ν | 20 MPa, 0.3 | **Assumption**. Published ranges: 10–50 MPa uniform sand, 8–30 MPa stiff clay, 0.5–5 MPa soft clay |
| Basic wind speed | 36 m/s | SANS 10160-3:2019 uses 32, 36, 40 or 44 m/s by municipality. **Check the site** |
| Exposure factor, force coefficient, roof suction | 1.7, 0.6, 0.8 | **Assumptions** from EN 1991-1-4 practice for a 2–5 m cylinder in open terrain |
| Load factors | 1.5 water (ULS), 1.6 wind, 0.9 stabilising dead load | Padros example; SANS 10160-3:2019 wind factor 1.6 (Bakker et al. 2022). **To verify** water factor against SANS 10160-1 |

**Design philosophy.** The design follows three rules:
- Size each base for the full tank at its rim height. This is conservative, because the overflow sits below the rim.
- Keep the ground pressure under the wall close to the pressure under the floor, so the two settle together.
- Treat the liner as unable to take steps or point loads. Every base therefore ends in a smooth, compacted, free-draining bed.

## 3. Loads

**Equations** (per tank):

- Floor area A = πD²/4; perimeter P = πD
- Water pressure on the floor: p = γw × H
- Water load: Ww = p × A
- Wall weight: Wwall = πDH × t × kc × γsteel × (1 + kf), where kc = 1.10 is the corrugation factor and kf = 0.20 the fittings allowance
- Roof loads: Gr = gr × A (dead) and Qr = qr × A (imposed)
- Wall line load on the seat: w = (Wwall + Gr + Qr)/P
- Empty weight: W = Wwall + Gr

| Tank | D × H (m) | Water (t) | Floor pressure (kPa) | Empty weight W (kN) | Wall line load w (kN/m) |
|---|---|---|---|---|---|
| T01 | 3 × 1.55 | 11 | 15.2 | 2.6 | 0.65 |
| T02 | 4 × 1.55 | 19 | 15.2 | 3.9 | 0.81 |
| T03 | 5 × 1.55 | 30 | 15.2 | 5.5 | 0.97 |
| T04 | 6 × 1.55 | 44 | 15.2 | 7.3 | 1.14 |
| T05 | 7 × 1.55 | 60 | 15.2 | 9.3 | 1.30 |
| T06 | 8 × 1.55 | 78 | 15.2 | 11.6 | 1.46 |
| T07 | 9 × 1.55 | 99 | 15.2 | 14.1 | 1.62 |
| T08 | 10 × 1.55 | 122 | 15.2 | 16.8 | 1.79 |
| T09 | 11 × 1.55 | 147 | 15.2 | 19.8 | 1.95 |
| T10 | 12 × 1.55 | 175 | 15.2 | 23.0 | 2.11 |
| T11 | 13 × 1.55 | 206 | 15.2 | 26.5 | 2.27 |
| T12 | 14 × 1.55 | 239 | 15.2 | 30.2 | 2.44 |
| T13 | 15 × 1.55 | 274 | 15.2 | 34.1 | 2.60 |
| T14 | 16 × 1.55 | 312 | 15.2 | 38.2 | 2.76 |
| T15 | 17 × 1.55 | 352 | 15.2 | 42.6 | 2.92 |
| T16 | 3 × 2.3 | 16 | 22.6 | 3.3 | 0.73 |
| T17 | 5 × 2.3 | 45 | 22.6 | 6.7 | 1.05 |
| T18 | 7 × 2.3 | 89 | 22.6 | 11.0 | 1.38 |
| T19 | 10 × 2.3 | 181 | 22.6 | 19.3 | 1.86 |
| T20 | 13 × 2.3 | 305 | 22.6 | 29.6 | 2.35 |
| T21 | 17 × 2.3 | 522 | 22.6 | 46.8 | 3.00 |
| T22 | 3 × 3.05 | 22 | 29.9 | 4.0 | 0.80 |
| T23 | 6 × 3.05 | 86 | 29.9 | 10.2 | 1.29 |
| T24 | 9 × 3.05 | 194 | 29.9 | 18.5 | 1.78 |
| T25 | 14 × 3.05 | 470 | 29.9 | 37.0 | 2.59 |

**Reading the table.** The 17 m × 2.3 m tank holds over 500 t of water but weighs about 50 kN empty. Water is roughly 100 times the steel. Floor pressure depends only on height.

## 4. Sand or crusher-dust pad

**Method**

- **Edge thickness:** t = max(150 mm minimum, topsoil removed). The minimum is one compacted layer, which matches the Bushman and Pioneer guidance.
- **Crown:** the pad rises (D/2)/120 towards the centre so the floor drains to the wall. This follows the AWWA D100 slope of at least 1 in 120 up to the centre, as quoted by ACI.
- **Overhang beyond the wall:** a = t/2 (load spread at 2 vertical : 1 horizontal) + 0.40 m stone erosion band + 0.10 m tolerance.
- **Ground pressure at the centre:** q = p + γs × t_centre ≤ qa.
- **Elastic settlement** of a uniformly loaded flexible circle of radius a = D/2 on a deep elastic layer:
  - centre: s_c = 2pa(1 − ν²)/E
  - edge: s_e = 4pa(1 − ν²)/(πE)
  - dish: s_c − s_e = (2 − 4/π) pa(1 − ν²)/E ≈ 0.727 pa(1 − ν²)/E

  This is the standard elasticity solution (Timoshenko and Goodier, and foundation engineering texts). It covers immediate settlement only. Consolidation of clay adds to it.

| Tank | D × H (m) | Pad edge / centre (m) | Overhang (m) | Ground pressure (kPa) | Utilisation | Settlement centre / wall (mm) | Dish (mm) | Fill (m³) |
|---|---|---|---|---|---|---|---|---|
| T01 | 3 × 1.55 | 0.15 / 0.16 | 0.57 | 18.1 | 18% | 2.1 / 1.3 | 0.8 | 2.1 |
| T02 | 4 × 1.55 | 0.15 / 0.17 | 0.57 | 18.2 | 18% | 2.8 / 1.8 | 1.0 | 3.2 |
| T03 | 5 × 1.55 | 0.15 / 0.17 | 0.57 | 18.3 | 18% | 3.5 / 2.2 | 1.3 | 4.6 |
| T04 | 6 × 1.55 | 0.15 / 0.17 | 0.57 | 18.4 | 18% | 4.2 / 2.6 | 1.5 | 6.3 |
| T05 | 7 × 1.55 | 0.15 / 0.18 | 0.57 | 18.4 | 18% | 4.8 / 3.1 | 1.8 | 8.2 |
| T06 | 8 × 1.55 | 0.15 / 0.18 | 0.57 | 18.5 | 19% | 5.5 / 3.5 | 2.0 | 10.4 |
| T07 | 9 × 1.55 | 0.15 / 0.19 | 0.57 | 18.6 | 19% | 6.2 / 4.0 | 2.3 | 12.9 |
| T08 | 10 × 1.55 | 0.15 / 0.19 | 0.57 | 18.7 | 19% | 6.9 / 4.4 | 2.5 | 15.7 |
| T09 | 11 × 1.55 | 0.15 / 0.20 | 0.57 | 18.7 | 19% | 7.6 / 4.8 | 2.8 | 18.8 |
| T10 | 12 × 1.55 | 0.15 / 0.20 | 0.57 | 18.8 | 19% | 8.3 / 5.3 | 3.0 | 22.3 |
| T11 | 13 × 1.55 | 0.15 / 0.20 | 0.57 | 18.9 | 19% | 9.0 / 5.7 | 3.3 | 26.0 |
| T12 | 14 × 1.55 | 0.15 / 0.21 | 0.57 | 19.0 | 19% | 9.7 / 6.2 | 3.5 | 30.0 |
| T13 | 15 × 1.55 | 0.15 / 0.21 | 0.57 | 19.0 | 19% | 10.4 / 6.6 | 3.8 | 34.4 |
| T14 | 16 × 1.55 | 0.15 / 0.22 | 0.57 | 19.1 | 19% | 11.1 / 7.0 | 4.0 | 39.1 |
| T15 | 17 × 1.55 | 0.15 / 0.22 | 0.57 | 19.2 | 19% | 11.8 / 7.5 | 4.3 | 44.2 |
| T16 | 3 × 2.3 | 0.15 / 0.16 | 0.57 | 25.5 | 25% | 3.1 / 2.0 | 1.1 | 2.1 |
| T17 | 5 × 2.3 | 0.15 / 0.17 | 0.57 | 25.6 | 26% | 5.1 / 3.3 | 1.9 | 4.6 |
| T18 | 7 × 2.3 | 0.15 / 0.18 | 0.57 | 25.8 | 26% | 7.2 / 4.6 | 2.6 | 8.2 |
| T19 | 10 × 2.3 | 0.15 / 0.19 | 0.57 | 26.0 | 26% | 10.3 / 6.5 | 3.7 | 15.7 |
| T20 | 13 × 2.3 | 0.15 / 0.20 | 0.57 | 26.2 | 26% | 13.3 / 8.5 | 4.8 | 26.0 |
| T21 | 17 × 2.3 | 0.15 / 0.22 | 0.57 | 26.5 | 27% | 17.5 / 11.1 | 6.3 | 44.2 |
| T22 | 3 × 3.05 | 0.15 / 0.16 | 0.57 | 32.8 | 33% | 4.1 / 2.6 | 1.5 | 2.1 |
| T23 | 6 × 3.05 | 0.15 / 0.17 | 0.57 | 33.1 | 33% | 8.2 / 5.2 | 3.0 | 6.3 |
| T24 | 9 × 3.05 | 0.15 / 0.19 | 0.57 | 33.3 | 33% | 12.3 / 7.8 | 4.5 | 12.9 |
| T25 | 14 × 3.05 | 0.15 / 0.21 | 0.57 | 33.7 | 34% | 19.1 / 12.1 | 6.9 | 30.0 |

**Findings**

- The pad never approaches its bearing limit on firm ground (18–34% used).
- **Pad thickness does not reduce the pressure on the ground under a uniformly loaded floor.** The water load is spread over the whole footprint whatever the thickness. The pad's real jobs are to replace topsoil, give a level and smooth bed, drain, and carry the edge. So thickness is set by the topsoil depth and the compaction layer, not by load. Where topsoil or soft material is deeper than 150 mm, the pad gets thicker by that amount.
- **The edge is the weak point.** A 575 mm overhang keeps the spread load inside the compacted pad, with room for the erosion band. The overhang does not grow with diameter, but erosion from roof run-off does (section 9).
- **The pad becomes the wrong answer for larger and taller tanks** because of the edge, not bearing:
  - Roof run-off grows with D².
  - A larger footprint is more likely to cross soft spots.
  - A 3.05 m tank is slender and needs anchoring.
  - A crowned pad gives no fixing for anchors.

  This is why the ring beam starts at 6 m and at 3.05 m height.

## 5. Concrete ring beam

**Method**

- **Bearing under the ring:** q_ring = (w + p × b/2 + γc × b × h)/b. The inner half of the ring lies under water, because the liner turns up the inside of the wall.
- **Bearing under the fill:** q_fill = p + γs × h. For near-uniform settlement the ratio q_ring / q_fill should be close to 1. API 650 states this aim for ringwalls: "a nearly uniform load under the tank" (as quoted by Padros 2018).
- **Lateral force on the ring** from active pressure of the fill inside, with the water as surcharge: F = Ka × p × h + ½ × Ka × γs × h² per metre of ring. Passive resistance outside is ignored, which is conservative.
- **Hoop tension:** T = F × D/2. This is the thin-ring relation used in ringwall design (Padros 2018, eq. 1).
- **Hoop steel:** As = max of three values:
  - strength: 1.5T/(fy/1.15)
  - crack control: T/130 MPa
  - minimum: 0.25% × b × h

| Tank | D × H (m) | Bearing ring / fill (kPa) | Ratio | Hoop tension T (kN) | As ULS / crack / min (mm²) | Bars | Concrete (m³) |
|---|---|---|---|---|---|---|---|
| T01 | 3 × 1.55 | 21.8 / 24.2 | 0.90 | 4.9 | 19 / 38 / 375 | 4 × Y12 | 1.41 |
| T02 | 4 × 1.55 | 22.3 / 24.2 | 0.92 | 6.6 | 25 / 51 / 375 | 4 × Y12 | 1.88 |
| T03 | 5 × 1.55 | 22.8 / 24.2 | 0.94 | 8.2 | 31 / 63 / 375 | 4 × Y12 | 2.36 |
| T04 | 6 × 1.55 | 23.4 / 24.2 | 0.97 | 9.9 | 38 / 76 / 375 | 4 × Y12 | 2.83 |
| T05 | 7 × 1.55 | 23.9 / 24.2 | 0.99 | 11.5 | 44 / 88 / 375 | 4 × Y12 | 3.30 |
| T06 | 8 × 1.55 | 24.5 / 24.2 | 1.01 | 13.1 | 50 / 101 / 375 | 4 × Y12 | 3.77 |
| T07 | 9 × 1.55 | 25.0 / 24.2 | 1.03 | 14.8 | 57 / 114 / 375 | 4 × Y12 | 4.24 |
| T08 | 10 × 1.55 | 25.6 / 24.2 | 1.06 | 16.4 | 63 / 126 / 375 | 4 × Y12 | 4.71 |
| T09 | 11 × 1.55 | 26.1 / 24.2 | 1.08 | 18.1 | 69 / 139 / 375 | 4 × Y12 | 5.18 |
| T10 | 12 × 1.55 | 26.6 / 24.2 | 1.10 | 19.7 | 76 / 152 / 375 | 4 × Y12 | 5.65 |
| T11 | 13 × 1.55 | 27.2 / 24.2 | 1.12 | 21.3 | 82 / 164 / 375 | 4 × Y12 | 6.13 |
| T12 | 14 × 1.55 | 27.7 / 24.2 | 1.15 | 23.0 | 88 / 177 / 375 | 4 × Y12 | 6.60 |
| T13 | 15 × 1.55 | 28.3 / 24.2 | 1.17 | 24.6 | 94 / 189 / 375 | 4 × Y12 | 7.07 |
| T14 | 16 × 1.55 | 28.8 / 24.2 | 1.19 | 26.3 | 101 / 202 / 375 | 4 × Y12 | 7.54 |
| T15 | 17 × 1.55 | 29.3 / 24.2 | 1.21 | 27.9 | 107 / 215 / 375 | 4 × Y12 | 8.01 |
| T16 | 3 × 2.3 | 25.7 / 31.6 | 0.81 | 6.8 | 26 / 52 / 375 | 4 × Y12 | 1.41 |
| T17 | 5 × 2.3 | 26.8 / 31.6 | 0.85 | 11.3 | 43 / 87 / 375 | 4 × Y12 | 2.36 |
| T18 | 7 × 2.3 | 27.9 / 31.6 | 0.88 | 15.8 | 61 / 121 / 375 | 4 × Y12 | 3.30 |
| T19 | 10 × 2.3 | 29.5 / 31.6 | 0.93 | 22.6 | 86 / 173 / 375 | 4 × Y12 | 4.71 |
| T20 | 13 × 2.3 | 31.1 / 31.6 | 0.99 | 29.3 | 112 / 226 / 375 | 4 × Y12 | 6.13 |
| T21 | 17 × 2.3 | 33.3 / 31.6 | 1.05 | 38.3 | 147 / 295 / 375 | 4 × Y12 | 8.01 |
| T22 | 3 × 3.05 | 29.6 / 38.9 | 0.76 | 8.6 | 33 / 66 / 375 | 4 × Y12 | 1.41 |
| T23 | 6 × 3.05 | 31.3 / 38.9 | 0.80 | 17.2 | 66 / 132 / 375 | 4 × Y12 | 2.83 |
| T24 | 9 × 3.05 | 32.9 / 38.9 | 0.85 | 25.8 | 99 / 199 / 375 | 4 × Y12 | 4.24 |
| T25 | 14 × 3.05 | 35.6 / 38.9 | 0.91 | 40.2 | 154 / 309 / 375 | 4 × Y12 | 6.60 |

**Findings**

- **Minimum steel governs every tank.** The largest hoop demand is 309 mm², for crack control on the 14 m × 3.05 m tank, and that is still below the 375 mm² minimum. Four Y12 bars (452 mm²) give one bar per corner and cover every listed tank. Links (R8 or Y8 at about 300 mm) hold the cage; they are a detailing choice, not a calculated one.
- **The ring and fill pressures match within −15% to +21%.** On tall tanks (3.05 m) the ring is slightly lighter than the fill, so the floor settles a few millimetres more than the wall, and the crown absorbs it. On wide, low tanks (16–17 m × 1.55 m) the ring is slightly heavier. Both are within the range that keeps the wall level.
- **Why 300 × 500 mm?** 300 mm is the API 650 minimum ringwall width as quoted. It also gives room for the wall seat, a bitumen separator strip and 50 mm cover. The depth is 150 mm above ground plus 350 mm below, which gets the ring through topsoil onto firm ground and keeps the wall base dry. On poor ground, deepen the ring rather than widen it.
- **Hold-down bolts** for wind (section 8) cast into the ring are the second reason to choose it.

## 6. Reinforced concrete slab

**Method.** A slab on uniformly supporting ground under a uniform water load has almost no bending. It only bends where support is lost: a soft spot, a washout, or on dolomite a cavity. The design case is therefore a one-way strip spanning a local loss of support of length L, taken as 1.0 m:

- M = 1.5 × (p + γc × t) × L²/8 per metre width
- d = t − cover − bar/2
- K = M/(fcu b d²) ≤ 0.156
- z = d[0.5 + √(0.25 − K/0.9)] ≤ 0.95d
- As = M/(0.87 fy z), not less than 0.13% bh

The last column of the table inverts the calculation: the largest soft spot the provided steel can bridge.

| Tank | D × H (m) | Ground pressure (kPa) | M over 1 m void (kNm/m) | As bend / min (mm²/m) | Steel | Bridges soft spot up to (m) | Concrete (m³) |
|---|---|---|---|---|---|---|---|
| T01 | 3 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 2.4 |
| T02 | 4 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 3.6 |
| T03 | 5 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 5.1 |
| T04 | 6 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 6.8 |
| T05 | 7 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 8.8 |
| T06 | 8 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 11.0 |
| T07 | 9 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 13.4 |
| T08 | 10 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 16.1 |
| T09 | 11 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 19.0 |
| T10 | 12 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 22.1 |
| T11 | 13 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 25.5 |
| T12 | 14 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 29.1 |
| T13 | 15 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 32.9 |
| T14 | 16 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 37.0 |
| T15 | 17 × 1.55 | 18.8 | 3.53 | 100 / 195 | Y10 @ 300 | 1.62 | 41.3 |
| T16 | 3 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 2.4 |
| T17 | 5 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 5.1 |
| T18 | 7 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 8.8 |
| T19 | 10 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 16.1 |
| T20 | 13 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 25.5 |
| T21 | 17 × 2.3 | 26.2 | 4.91 | 139 / 195 | Y10 @ 300 | 1.37 | 41.3 |
| T22 | 3 × 3.05 | 33.5 | 6.29 | 178 / 195 | Y10 @ 300 | 1.21 | 2.4 |
| T23 | 6 × 3.05 | 33.5 | 6.29 | 178 / 195 | Y10 @ 300 | 1.21 | 6.8 |
| T24 | 9 × 3.05 | 33.5 | 6.29 | 178 / 195 | Y10 @ 300 | 1.21 | 13.4 |
| T25 | 14 × 3.05 | 33.5 | 6.29 | 178 / 195 | Y10 @ 300 | 1.21 | 29.1 |

**Findings**

- A 150 mm slab is far from its section limit (K ≤ 0.023 against 0.156), and minimum steel governs.
- Y10 at 300 mm (262 mm²/m) bridges a 1.2 to 1.6 m loss of support. That is enough for washouts and local soft pockets on ordinary ground.
- **It is not a dolomite design.** On dolomite land, SANS 1936 designs consider much larger sinkhole spans (Merafong's low-risk zones require foundations to span at least 5 m of lost support). Spanning 5 m would need a deep, heavily reinforced raft. On dolomite, the slab's main job is to stop concentrated water ingress, through leak containment and drainage, and the structural case must be designed for the site.
- Thin slabs (75–100 mm with mesh) from poly-tank guides do not meet the 0.13% minimum steel in a useful form, have too little cover for 50 mm exposure detailing, and should not be used under these tanks.

## 7. Settlement and soil sensitivity

Settlement is linear in 1/E, so the **Soil sensitivity** sheet repeats the elastic calculation for E = 5, 10, 20, 40 and 80 MPa.

| Tank | D × H (m) | Dish at E = 5 / 10 / 20 / 40 / 80 MPa (mm) | Centre settlement at E = 5 / 20 / 80 MPa (mm) |
|---|---|---|---|
| T01 | 3 × 1.55 | 3.0 / 1.5 / 0.8 / 0.4 / 0.2 | 8.3 / 2.1 / 0.5 |
| T02 | 4 × 1.55 | 4.0 / 2.0 / 1.0 / 0.5 / 0.3 | 11.1 / 2.8 / 0.7 |
| T03 | 5 × 1.55 | 5.0 / 2.5 / 1.3 / 0.6 / 0.3 | 13.8 / 3.5 / 0.9 |
| T04 | 6 × 1.55 | 6.0 / 3.0 / 1.5 / 0.8 / 0.4 | 16.6 / 4.2 / 1.0 |
| T05 | 7 × 1.55 | 7.0 / 3.5 / 1.8 / 0.9 / 0.4 | 19.4 / 4.8 / 1.2 |
| T06 | 8 × 1.55 | 8.0 / 4.0 / 2.0 / 1.0 / 0.5 | 22.1 / 5.5 / 1.4 |
| T07 | 9 × 1.55 | 9.1 / 4.5 / 2.3 / 1.1 / 0.6 | 24.9 / 6.2 / 1.6 |
| T08 | 10 × 1.55 | 10.1 / 5.0 / 2.5 / 1.3 / 0.6 | 27.7 / 6.9 / 1.7 |
| T09 | 11 × 1.55 | 11.1 / 5.5 / 2.8 / 1.4 / 0.7 | 30.4 / 7.6 / 1.9 |
| T10 | 12 × 1.55 | 12.1 / 6.0 / 3.0 / 1.5 / 0.8 | 33.2 / 8.3 / 2.1 |
| T11 | 13 × 1.55 | 13.1 / 6.5 / 3.3 / 1.6 / 0.8 | 36.0 / 9.0 / 2.2 |
| T12 | 14 × 1.55 | 14.1 / 7.0 / 3.5 / 1.8 / 0.9 | 38.7 / 9.7 / 2.4 |
| T13 | 15 × 1.55 | 15.1 / 7.5 / 3.8 / 1.9 / 0.9 | 41.5 / 10.4 / 2.6 |
| T14 | 16 × 1.55 | 16.1 / 8.0 / 4.0 / 2.0 / 1.0 | 44.3 / 11.1 / 2.8 |
| T15 | 17 × 1.55 | 17.1 / 8.5 / 4.3 / 2.1 / 1.1 | 47.0 / 11.8 / 2.9 |
| T16 | 3 × 2.3 | 4.5 / 2.2 / 1.1 / 0.6 / 0.3 | 12.3 / 3.1 / 0.8 |
| T17 | 5 × 2.3 | 7.5 / 3.7 / 1.9 / 0.9 / 0.5 | 20.5 / 5.1 / 1.3 |
| T18 | 7 × 2.3 | 10.4 / 5.2 / 2.6 / 1.3 / 0.7 | 28.7 / 7.2 / 1.8 |
| T19 | 10 × 2.3 | 14.9 / 7.5 / 3.7 / 1.9 / 0.9 | 41.1 / 10.3 / 2.6 |
| T20 | 13 × 2.3 | 19.4 / 9.7 / 4.8 / 2.4 / 1.2 | 53.4 / 13.3 / 3.3 |
| T21 | 17 × 2.3 | 25.4 / 12.7 / 6.3 / 3.2 / 1.6 | 69.8 / 17.5 / 4.4 |
| T22 | 3 × 3.05 | 5.9 / 3.0 / 1.5 / 0.7 / 0.4 | 16.3 / 4.1 / 1.0 |
| T23 | 6 × 3.05 | 11.9 / 5.9 / 3.0 / 1.5 / 0.7 | 32.7 / 8.2 / 2.0 |
| T24 | 9 × 3.05 | 17.8 / 8.9 / 4.5 / 2.2 / 1.1 | 49.0 / 12.3 / 3.1 |
| T25 | 14 × 3.05 | 27.7 / 13.9 / 6.9 / 3.5 / 1.7 | 76.2 / 19.1 / 4.8 |

**Findings**

- **On firm and dense ground (E ≥ 20 MPa)** all tanks settle less than 20 mm and dish less than 7 mm. The liner barely notices this. A 7 mm dish over an 8.5 m radius stretches the floor by a negligible amount, about (8/3)δ²/D.
- **On soft ground (E = 5 MPa)** settlement reaches 76 mm at the centre and the dish reaches 28 mm. That is still within the 1:120 crown, but the uniform-soil assumption is unlikely to hold on such ground. Real soft ground varies, so differential settlement around the wall becomes the risk. API 653 limits planar tilt to about 1:120 and out-of-plane settlement to a shell-dependent value (secondary sources). A corrugated liner tank is more tolerant than a welded steel floor, but the wall must stay round for the roof and liner to fit.
- **Clay consolidation is not included.** On clay, long-term settlement can be several times the immediate value. That needs a consolidation test, which is another reason problem ground needs investigation.

## 8. Wind on an empty tank

**Method**

- Peak velocity pressure: qp = ce × ½ρvb² = 1.7 × 0.5 × 1.2 × 36² = 1.32 kPa
- Horizontal force on the cylinder: F = cf × qp × D × H, with cf = 0.6
- Roof uplift: U = cpe × qp × A, with cpe = 0.8 (roofed tanks)
- Stability, with destabilising loads × 1.6 and the stabilising empty weight × 0.9:
  - overturning about the leeward edge: 1.6(F·H/2 + U·D/2) ≤ 0.9W·D/2
  - net uplift: 1.6U − 0.9W ≤ 0
  - sliding: 1.6F ≤ μ(0.9W − 1.6U), with μ = 0.4
- Anchor tension with n anchors: T = 4 × 1.6(F·H/2)/(nD) + (1.6U − 0.9W)/n

| Tank | D × H (m) | F (kN) | Roof uplift U (kN) | W (kN) | Net factored uplift (kN) | Anchors | Tension / anchor (kN) | Roof run-off (L/s) |
|---|---|---|---|---|---|---|---|---|
| T01 | 3 × 1.55 | 3.7 | 7.5 | 2.6 | 9.6 | 7 | 2.2 | 0.19 |
| T02 | 4 × 1.55 | 4.9 | 13.3 | 3.9 | 17.8 | 9 | 2.6 | 0.33 |
| T03 | 5 × 1.55 | 6.1 | 20.8 | 5.5 | 28.3 | 11 | 3.1 | 0.52 |
| T04 | 6 × 1.55 | 7.4 | 29.9 | 7.3 | 41.3 | 13 | 3.6 | 0.75 |
| T05 | 7 × 1.55 | 8.6 | 40.7 | 9.3 | 56.7 | 15 | 4.2 | 1.02 |
| T06 | 8 × 1.55 | 9.8 | 53.2 | 11.6 | 74.6 | 17 | 4.7 | 1.33 |
| T07 | 9 × 1.55 | 11.1 | 67.3 | 14.1 | 95.0 | 19 | 5.3 | 1.68 |
| T08 | 10 × 1.55 | 12.3 | 83.1 | 16.8 | 117.7 | 21 | 5.9 | 2.07 |
| T09 | 11 × 1.55 | 13.5 | 100.5 | 19.8 | 143.0 | 24 | 6.2 | 2.51 |
| T10 | 12 × 1.55 | 14.8 | 119.6 | 23.0 | 170.6 | 26 | 6.8 | 2.98 |
| T11 | 13 × 1.55 | 16.0 | 140.4 | 26.5 | 200.8 | 28 | 7.4 | 3.50 |
| T12 | 14 × 1.55 | 17.2 | 162.8 | 30.2 | 233.3 | 30 | 8.0 | 4.06 |
| T13 | 15 × 1.55 | 18.4 | 186.9 | 34.1 | 268.3 | 32 | 8.6 | 4.66 |
| T14 | 16 × 1.55 | 19.7 | 212.6 | 38.2 | 305.8 | 34 | 9.2 | 5.31 |
| T15 | 17 × 1.55 | 20.9 | 240.0 | 42.6 | 345.7 | 36 | 9.8 | 5.99 |
| T16 | 3 × 2.3 | 5.5 | 7.5 | 3.3 | 9.0 | 7 | 3.2 | 0.19 |
| T17 | 5 × 2.3 | 9.1 | 20.8 | 6.7 | 27.2 | 11 | 3.7 | 0.52 |
| T18 | 7 × 2.3 | 12.8 | 40.7 | 11.0 | 55.2 | 15 | 4.6 | 1.02 |
| T19 | 10 × 2.3 | 18.2 | 83.1 | 19.3 | 115.6 | 21 | 6.1 | 2.07 |
| T20 | 13 × 2.3 | 23.7 | 140.4 | 29.6 | 197.9 | 28 | 7.5 | 3.50 |
| T21 | 17 × 2.3 | 31.0 | 240.0 | 46.8 | 342.0 | 36 | 9.9 | 5.99 |
| T22 | 3 × 3.05 | 7.3 | 7.5 | 4.0 | 8.3 | 7 | 4.6 | 0.19 |
| T23 | 6 × 3.05 | 14.5 | 29.9 | 10.2 | 38.7 | 13 | 4.8 | 0.75 |
| T24 | 9 × 3.05 | 21.8 | 67.3 | 18.5 | 91.0 | 19 | 6.0 | 1.68 |
| T25 | 14 × 3.05 | 33.9 | 162.8 | 37.0 | 227.2 | 30 | 8.4 | 4.06 |

**Findings**

- **All roofed tanks fail the overturning, uplift and sliding checks when empty**, by a wide margin. Factored roof suction is 3 to 10 times the factored empty weight. Light steel tanks are large and light, and this matches suppliers' insistence on anchoring in high-wind regions (Bushman requires a ring beam in cyclonic areas).
- **Unroofed tanks slide too.** For example, a 10 m × 2.3 m unroofed shell weighs about 7.5 kN. Its factored wind force is 29 kN against about 2.7 kN of friction. The shell is restrained in practice only by the liner and anything bolted to the base, which is why empty tanks deform or move in storms.
- **Water does not count.** In a liner tank the water sits on the liner, and the liner is only clipped over the rim. Some friction between a water-loaded liner and the wall exists, but it cannot be relied on and is not included.
- **Indicative hold-down.** 7 to 36 anchors at 1.5 m spacing, at 2 to 10 kN each. M12 to M16 cast-in or chemical anchors into a ring beam or slab are in that range, but the anchor, the bracket and the wall connection must be designed together. On a sand pad, ground anchors or a buried deadman ring would be needed. That is one more reason the ring beam is preferred for roofed tanks.
- **Sensitivity.** The result scales with vb². At 32 m/s, qp falls by 21%, and at 40 m/s it rises by 23%. The conclusion (anchors needed) holds across all four SANS speed zones. The roof coefficient is the least certain input. It should be confirmed against SANS 10160-3 for the actual roof shape.

## 9. Drainage

- **Under the floor:** the pad and ring-beam fill are free-draining crusher dust or sand on geotextile. The 1:120 crown sends any condensation or leakage to the wall line, where it can be seen. For a slab, the same fall should be formed in the slab top or the underlay.
- **Around the base:** finished ground should fall away from the tank. A fall of at least 1:50 over the first 1.5 m is used here as a practical assumption. No water may stand against the wall base or the ring beam.
- **Roof run-off:** Q = C × i × A/3600, giving 0.2 L/s (3 m) to 6 L/s (17 m) in a 100 mm/h storm without gutters. Spread round the perimeter, that is roughly 0.02 to 0.1 L/s per metre falling on the base edge, which scours an unprotected sand shoulder. Hence the 400 mm stone band on pads, and gutters with a piped outfall on larger roofed tanks.
- **Overflow and scour outlets** must discharge at least a few metres clear of the base onto a protected surface, never onto the pad shoulder.
- **Dolomite land:** all of the above, plus no soakaways, with stormwater led to a formal outlet (SANS 1936 precautionary measures).

## 10. Worked example: 10 m × 2.3 m tank

This is tank T19 (about 181 kL), checked by hand against the workbook.

**Loads**

- A = π × 10²/4 = 78.54 m². P = 31.42 m.
- p = 9.81 × 2.3 = 22.56 kPa. Water load = 22.56 × 78.54 = 1 772 kN, or 181 t.
- Wall = π × 10 × 2.3 × 0.001 × 1.10 × 78.5 × 1.20 = 7.49 kN. Roof dead load = 0.15 × 78.54 = 11.78 kN. Roof imposed load = 0.5 × 78.54 = 39.27 kN.
- w = (7.49 + 11.78 + 39.27)/31.42 = 1.86 kN/m. W = 19.27 kN.

**Sand pad** (for comparison; a ring beam is recommended at this size)

- t = 0.15 m. Crown = 5/120 = 0.042 m. Centre thickness = 0.192 m.
- q = 22.56 + 18 × 0.192 = 26.0 kPa, which is 26% of 100 kPa.
- s_c = 2 × 22.56 × 5 × 0.91/20 000 = 10.3 mm. s_e = 6.5 mm. Dish = 3.7 mm, which is less than the 42 mm crown.

**Ring beam** (b = 0.30 m, h = 0.50 m)

- q_ring = (1.86 + 22.56 × 0.15 + 24 × 0.30 × 0.50)/0.30 = 29.5 kPa.
- q_fill = 22.56 + 18 × 0.50 = 31.6 kPa. Ratio = 0.93.
- F = 0.333 × 22.56 × 0.50 + 0.5 × 0.333 × 18 × 0.50² = 3.76 + 0.75 = 4.51 kN/m.
- T = 4.51 × 10/2 = 22.6 kN.
- As:
  - strength: 1.5 × 22 600/391 = 86 mm²
  - crack control: 22 600/130 = 173 mm²
  - minimum: 0.0025 × 300 × 500 = 375 mm², which governs
- Provide 4 Y12 (452 mm²). Concrete volume = π × 10 × 0.30 × 0.50 = 4.7 m³.

**Slab** (t = 0.15 m)

- q = 22.56 + 3.6 = 26.2 kPa.
- M over a 1 m void = 1.5 × 26.2 × 1²/8 = 4.91 kNm/m.
- d = 150 − 50 − 5 = 95 mm. K = 4.91 × 10⁶/(30 × 1000 × 95²) = 0.018.
- z = 0.95d = 90 mm. As = 4.91 × 10⁶/(391 × 90) = 139 mm²/m, so the minimum of 195 mm²/m governs.
- Provide Y10 @ 300 (262 mm²/m). This bridges a span of up to about 1.37 m.

**Wind** (roofed, empty)

- qp = 1.32 kPa. F = 0.6 × 1.32 × 10 × 2.3 = 18.2 kN. U = 0.8 × 1.32 × 78.54 = 83.1 kN.
- Overturning moment: 1.6 × (18.2 × 1.15 + 83.1 × 5) = 698 kNm. Restoring moment: 0.9 × 19.3 × 5 = 87 kNm. **The tank must be anchored.**
- With 21 anchors at 1.5 m spacing: T = 4 × 1.6 × 18.2 × 1.15/(21 × 10) + (1.6 × 83.1 − 0.9 × 19.3)/21 = 0.64 + 5.50 = **6.1 kN per anchor**.

The hand results match the workbook (T19 rows) to the rounding shown.

## 11. Recommended sizes by tank

| Tanks | Recommended base on firm ground | Pad (if used) | Ring beam | Slab (problem ground starting point) | Wind |
|---|---|---|---|---|---|
| 3–5 m × 1.55 m and 3–5 m × 2.3 m (10–50 kL class) | Confined sand or crusher-dust pad | 150 mm edge, crown 1:120, 575 mm overhang, geotextile, stone band | Optional upgrade: 300 × 500, 4 Y12 | 150 mm, Y10 @ 300 b.w., 300 × 450 edge | Roofed: anchor (ground anchors on a pad, or choose the ring beam) |
| 6–17 m × 1.55 m and 7–17 m × 2.3 m | Ring beam with compacted fill | Not recommended | 300 × 500, 4 Y12, links @ 300, 150 mm above ground | As above, engineered on problem ground | Roofed: 1.5 m-spaced anchors into the ring |
| All × 3.05 m (3, 6, 9, 14 m) | Ring beam with compacted fill | Not recommended | 300 × 500, 4 Y12 | As above | Anchor; tall and slender |
| Dolomite, swelling clay, fill, potable or fire duty | Slab or raft, designed for the site | Not suitable | Limited | Designed by an engineer (SANS 1936 on dolomite) | Anchor |

Volumes for estimating (fill, geotextile, stone, concrete) are listed per tank in the workbook.

## 12. Limitations and what must be confirmed

1. **Soil values are assumed.** qa = 100 kPa and E = 20 MPa represent firm ground. Every recommendation assumes firm, uniform ground below the topsoil. A DCP test or test pit on each site would confirm it cheaply.
2. **Tank inputs to confirm:** wall sheet thickness per ring, roof construction and weight, the bottom-angle seat width, and whether and how the wall can be anchored.
3. **Code values to verify** against current editions:
   - SANS 10160-1 (load factors on water)
   - SANS 10160-2 (roof imposed load)
   - SANS 10160-3 (exposure factor, force and roof coefficients, the site's basic wind speed)
   - SANS 10100-1 and -3 (minimum steel, crack-control stress, cover for coastal exposure)
   - API 650 Annex B (minimum ringwall dimensions and steel)

   These were taken from secondary sources.
4. **Settlement is immediate and elastic only.** Consolidation, collapse on wetting and heave are excluded. They need site investigation.
5. **Dolomite land is excluded** from the slab sizing. It needs a SANS 1936 assessment and a site-specific design.
6. **The wind check is for an empty tank** with a light roof. It is deliberately conservative, and it is the least certain part of this report.
7. **Not for construction.** Drawings need a competent engineer's design and signature for the specific site and tank.

## 13. Workbook guide

[steel-water-tank-base-sizing-calculations.xlsx](steel-water-tank-base-sizing-calculations.xlsx):

| Sheet | Contents |
|---|---|
| Read me | Purpose, colour legend, limits |
| Summary | One row per tank: recommended base and key sizes |
| Inputs | Every assumption with its unit and source. Blue values are editable; yellow are key assumptions to confirm |
| Tank sizes | The 25 published tank sizes. Add a tank in any blank blue row (to row 40) |
| Loads | Areas, water pressure and weight, wall and roof loads, line load |
| Sand pad | Thickness, crown, overhang, bearing, settlement, quantities |
| Ring beam | Bearing balance, hoop tension, steel, bar count, quantities |
| Slab | Bearing, bending over a void, steel, span it can bridge, quantities |
| Wind | Empty-tank overturning, uplift, sliding, anchors, roof run-off |
| Soil sensitivity | Dish and centre settlement for E = 5 to 80 MPa (editable) |

All results are formulas. The workbook was recalculated with zero formula errors (4 254 formulas), and the worked example in section 10 was checked by hand.

## 14. References

Evidence labels follow the base-options report: [Sec] secondary source read; [Prod] supplier document; [Std-nr] standard named but not read; [Der] derived here.

- Padros, *Soil-structure interaction of reinforced concrete ringwalls in granular fill*, GeoEdmonton 2018, [paper 393](https://members.cgs.ca/conferences/GeoEdmonton/papers/geo2018Paper393.pdf). Hoop stress, active vs at-rest pressure, and API 650 ringwall minimums as quoted [Sec].
- eng-tips, [ringwall reinforcement thread 460819](https://www.eng-tips.com/viewthread.cfm?qid=460819) and [thread 507441](https://eng-tips.com/viewthread.cfm?qid=507441). API 650 B.4.2.3 minimum steel as quoted by posters [Sec, unverified].
- Open Exam Prep, [API 653 settlement evaluation](https://open-exam-prep.com/study-guides/api-653/relief-devices-settlement-nameplate-records/settlement-evaluation-cosine-curve), and Inspenet, [API 653 Annex B in API 650 tanks](https://inspenet.com/en/?p=248409). Tilt and out-of-plane limits [Sec].
- Kouretzis, *Fundamentals of Foundation Engineering*, [section 4.5](https://oercollective.caul.edu.au/fundamentals-of-foundation-engineering/?p=934). Settlement of flexible and rigid footings [Sec]. The flexible-circle centre and edge formulas are the standard elasticity solution (Timoshenko and Goodier; Poulos and Davis) [Std-nr].
- geotechdata.info, [soil Young's modulus](https://www.geotechdata.info/parameter/soil-young-s-modulus) (Obrzud and Truty 2012) and [bearing capacity](https://www.geotechdata.info/parameter/bearing-capacity) (BS 8004 presumed values) [Sec].
- Bakker, De Koker and Viljoen, *Development of an updated fundamental basic wind speed map for SANS 10160-3*, [JSAICE 64(1), 2022](https://scielo.org.za/pdf/jsaice/v64n1/03.pdf). Basic wind speeds of 32–44 m/s and the wind partial factor of 1.6 [Sec].
- Structville, [wind load analysis of tank farms and cylindrical structures](https://structville.com/wind-load-analysis-of-tank-farms-and-cylindrical-structures), and Dlubal, [wind on cylinders](https://www.dlubal.com/en/support-and-learning/support/knowledge-base/001451). EN 1991-1-4 cylinder force coefficients of about 0.5 [Sec].
- Johannesburg Development Agency, [project specification and general notes, 2023](https://www.jda.org.za/wp-content/uploads/2024/04/JDA-WATT-PEU-STG004-003S-Rev-0-signed.pdf). 30 MPa foundations, 50 mm cover, 450 MPa Y-bars, 95% Mod AASHTO under foundations [Sec, project document].
- American Concrete Institute, [FAQ 902](https://www.concrete.org/tools/frequentlyaskedquestions.aspx?faqid=902). AWWA D100 floor slope and cushion, as quoted [Sec].
- Bushman Tanks, [Aqualine installation](https://www.bushmantanks.com.au/information/aqualine-steel-tank-installation-and-delivery/). Pad depth, compaction, the stone band, and ring beams in cyclonic areas [Prod].
- Merafong City, [MSDF 2019 Annexure D: Dolomite](https://merafong.gov.za/wp-content/uploads/2024/04/MSDF-2019-Annexure-D-Dolomite.pdf). 5 m loss-of-support design in low-risk dolomite zones [Sec].
- Named only, not read [Std-nr]: API 650 Annex B, API 653 Annex B, PIP STE03020, AWWA D100/D103, SANS 10160-1/-2/-3, SANS 10100-1/-3, SANS 1936, SANS 10400-H, BS 8004, EN 1991-1-4.
