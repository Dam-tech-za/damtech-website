/**
 * Reservoir bill of quantities (BOQ) for the admin tool.
 *
 * Pure functions only, so they run under the node test runner. The design
 * itself (wall gauges, bolt lines, truss members) comes from the DamTech
 * calculator through the `reservoir_designs` table; this module turns one
 * design into order lines: sheets with cut lengths, bolts, liner, and for a
 * roof the raw stock to buy (6 m lengths of angle, round bar and flat bar).
 */

export type BoqSettings = {
  parameter_version: string;
  generated_on: string;
  ring_height_m: number;
  roof_sheet_cover_m: number;
  roof_waste: number;
  roof_pitch_deg: number;
  roof_screws_m2: number;
  row_bolt_pitch_m: number;
  row_seam_bolt_rows: number;
  liner_overhang_m: number;
  liner_waste: number;
  top_ring_from_dia_m: number;
  stock_bar_m: number;
  diameters_m: number[];
  rings: number[];
  standard_sizes: Record<string, [number, number]>;
  wall_sheet: string;
  seam_bolt: string;
  roof_bolt: string;
  roof_sheet: string;
  edge_mm: number;
  loads: { uplift_kpa: string; imposed_kpa: string };
};

export type WallRing = {
  ring: number;
  gauge: string;
  t_mm: number;
  plies: number;
  bolt_lines: number;
  bolts_per_line: number;
  sheets: number;
  end_lap_m: number;
  cut_length_m: number;
  sheet_m: number;
  util: number;
};

export type WallDesign = {
  rings: WallRing[];
  sheets_per_ring: number;
  wind_rings: number;
  wind_ring_m: number;
  seam_bolts: number;
  pattern: string;
  max_util: number;
};

export type TrussPanel = { web: string; len_mm: number; force_kn: number; dir: string };

export type TrussDetail = {
  y_m: number;
  span_m: number;
  top_chord_m: number;
  nodes_m: number[];
  depths_mm: number[];
  ribs: string[];
  panels: TrussPanel[];
};

export type RoofDesign = {
  trusses: number;
  truss_spacing_m: number;
  depth_centre_mm: number;
  depth_rim_mm: number;
  rim_drop_mm: number;
  slope_deg: number;
  top_chord: string;
  bottom_chord: string;
  tie_section: string;
  tie_lines_m: number[];
  bottom_brace_spacing_m: number;
  bottom_tie_m: number;
  bolts_rim: number;
  bolts_tie: number;
  end_plates: number;
  rim_angle_m: number;
  steel_kg: string;
  defl_actual_mm: number;
  defl_limit_mm: number;
  max_util: number;
  sheet_label: string;
  truss_detail: TrussDetail[];
  web_m: Record<string, number>;
  top_chord_m: number;
  bottom_chord_m: number;
  panel_m: number;
  uplift_kpa: string;
  imposed_kpa: string;
};

export type BoqSelection = {
  diameterM: number;
  rings: number;
  roof: boolean;
  linerGsm: 550 | 800;
};

export type BoqSection = "Wall" | "Liner" | "Roof sheeting" | "Roof steel (raw stock)";

export type BoqLine = {
  section: BoqSection;
  item: string;
  spec: string;
  unit: string;
  qty: number;
  /** Cut or stock length of one piece in metres, where it applies. */
  lengthEachM?: number;
  /** Total metres, where it applies. */
  totalM?: number;
  note?: string;
};

export type CutPiece = { lengthM: number; count: number; use: string };

export type StockLine = {
  section: string;
  bars: number;
  barM: number;
  neededM: number;
  pieces: CutPiece[];
};

export type RoofSheetCut = { lengthM: number; count: number };

export type ReservoirBoq = {
  heightM: number;
  capacityKl: number;
  circumferenceM: number;
  lines: BoqLine[];
  stock: StockLine[];
  roofSheetCuts: RoofSheetCut[];
  /** Diameter the wall and roof design was taken at (next 0.5 m up for odd sizes). */
  designDiameterM: number;
};

const roundUp = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;
const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

/** The 0.5 m design size at or above the diameter asked for. */
export function designDiameter(diameterM: number): number {
  return roundUp(diameterM, 0.5);
}

export function designKeys(selection: BoqSelection): { wall: string; roof: string | null } {
  const d = designDiameter(selection.diameterM);
  return {
    wall: `wall:${d}:${selection.rings}:${selection.roof ? 1 : 0}`,
    roof: selection.roof ? `roof:${d}` : null,
  };
}

/** True when the size is on the standard list (whole metres within the range for that number of rings). */
export function isStandardSize(settings: BoqSettings, diameterM: number, rings: number): boolean {
  const range = settings.standard_sizes[String(rings)];
  return Boolean(range) && Number.isInteger(diameterM) && diameterM >= range[0] && diameterM <= range[1];
}

/**
 * Pieces cut from stock bars: first-fit decreasing. A piece longer than a bar
 * is bought as full bars plus a remainder (spliced on site).
 */
export function packBars(lengthsM: number[], barM: number): number {
  const pieces: number[] = [];
  for (const length of lengthsM) {
    let rest = length;
    while (rest > barM + 1e-9) {
      pieces.push(barM);
      rest -= barM;
    }
    if (rest > 1e-9) pieces.push(rest);
  }
  pieces.sort((a, b) => b - a);
  const bars: number[] = [];
  for (const piece of pieces) {
    const index = bars.findIndex((free) => free + 1e-9 >= piece);
    if (index === -1) bars.push(barM - piece);
    else bars[index] -= piece;
  }
  return bars.length;
}

function groupPieces(pieces: { lengthM: number; use: string }[]): CutPiece[] {
  const map = new Map<string, CutPiece>();
  for (const piece of pieces) {
    const lengthM = round(piece.lengthM, 3);
    const key = `${piece.use}|${lengthM}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { lengthM, count: 1, use: piece.use });
  }
  return [...map.values()].sort((a, b) => a.use.localeCompare(b.use) || b.lengthM - a.lengthM);
}

/** Every steel piece of the roof, by section, then the stock bars that cover them. */
export function roofStock(roof: RoofDesign, diameterM: number, barM: number): StockLine[] {
  const bySection = new Map<string, { lengthM: number; use: string }[]>();
  const add = (section: string, lengthM: number, use: string) => {
    if (lengthM <= 0) return;
    const list = bySection.get(section) ?? [];
    list.push({ lengthM, use });
    bySection.set(section, list);
  };

  for (const truss of roof.truss_detail) {
    add(roof.top_chord, truss.top_chord_m / 2, "top chord (half truss)");
    add(roof.top_chord, truss.top_chord_m / 2, "top chord (half truss)");
    add(roof.bottom_chord, truss.span_m, "bottom chord");
    truss.ribs.forEach((section, index) => {
      const length = truss.depths_mm[index] / 1000;
      add(section, length, "rib");
      if (index > 0) add(section, length, "rib");
    });
    for (const panel of truss.panels) {
      if (panel.web === "solid") continue;
      add(panel.web, panel.len_mm / 1000, "diagonal");
      add(panel.web, panel.len_mm / 1000, "diagonal");
    }
  }
  add(roof.top_chord, roof.rim_angle_m, "rim angle (rolled)");
  const radius = diameterM / 2;
  for (const x of roof.tie_lines_m) {
    add(roof.tie_section, 2 * Math.sqrt(Math.max(radius * radius - x * x, 0)), "bottom-chord tie");
  }

  return [...bySection.entries()]
    .map(([section, pieces]) => ({
      section,
      bars: packBars(pieces.map((p) => p.lengthM), barM),
      barM,
      neededM: round(pieces.reduce((sum, p) => sum + p.lengthM, 0), 1),
      pieces: groupPieces(pieces),
    }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

/**
 * Cutting guide for the roof sheets: strips one sheet cover wide, running from
 * the ridge (centre truss) down to the rim on both sides.
 */
export function roofSheetCuts(diameterM: number, coverM: number, slopeDeg: number): RoofSheetCut[] {
  const radius = diameterM / 2;
  const strips = Math.ceil(diameterM / coverM - 1e-9);
  const start = -(strips * coverM) / 2;
  const cos = Math.cos((slopeDeg * Math.PI) / 180);
  const counts = new Map<number, number>();
  for (let i = 0; i < strips; i += 1) {
    const left = start + i * coverM;
    const right = left + coverM;
    const nearest = left <= 0 && right >= 0 ? 0 : Math.min(Math.abs(left), Math.abs(right));
    if (nearest >= radius) continue;
    const length = roundUp(Math.sqrt(radius * radius - nearest * nearest) / cos + 0.1, 0.05);
    const key = round(length, 2);
    counts.set(key, (counts.get(key) ?? 0) + 2);
  }
  return [...counts.entries()].map(([lengthM, count]) => ({ lengthM, count })).sort((a, b) => b.lengthM - a.lengthM);
}

const sectionKind = (section: string) =>
  section.startsWith("RB") ? "Round bar" : section.startsWith("FB") ? "Flat bar" : "Angle";

export function buildReservoirBoq(
  settings: BoqSettings,
  wall: WallDesign,
  roof: RoofDesign | null,
  selection: BoqSelection,
): ReservoirBoq {
  const d = selection.diameterM;
  const heightM = round(selection.rings * settings.ring_height_m, 3);
  const circumference = Math.PI * d;
  const area = (Math.PI * d * d) / 4;
  const lines: BoqLine[] = [];

  // ---- wall: one line per ring, bottom first. Sheets per ring come from the design size; the cut length follows the diameter asked for.
  let curvedM = 0;
  for (const ring of wall.rings) {
    const sheetsPerPly = ring.sheets;
    const cut = roundUp(circumference / sheetsPerPly + ring.end_lap_m, 0.001);
    const count = sheetsPerPly * ring.plies;
    curvedM += count * cut;
    lines.push({
      section: "Wall",
      item: `Wall sheet, ring ${ring.ring}${ring.ring === 1 ? " (bottom)" : ""}`,
      spec: `${settings.wall_sheet.replace("Z275,", `Z275, ${ring.plies === 2 ? "2 x " : ""}${ring.t_mm.toFixed(2)} mm,`)}`,
      unit: "sheets",
      qty: count,
      lengthEachM: round(cut, 3),
      totalM: round(count * cut, 1),
      note: `${ring.bolt_lines} bolt lines per seam, ${Math.round(ring.end_lap_m * 1000)} mm end lap (holes at ${ring.bolt_lines === 3 ? "35 / 75 / 115" : "35 / 65"} mm from the sheet end)`,
    });
  }
  lines.push({
    section: "Wall",
    item: "Curving",
    spec: `Supplier curving of all wall sheets to a ${(d / 2).toFixed(2)} m radius`,
    unit: "m",
    qty: round(curvedM, 1),
  });
  const rowBolts = (selection.rings - 1) * settings.row_seam_bolt_rows * Math.ceil(circumference / settings.row_bolt_pitch_m - 1e-9);
  lines.push({
    section: "Wall",
    item: "Seam bolts M10",
    spec: settings.seam_bolt,
    unit: "sets",
    qty: wall.seam_bolts + rowBolts,
    note: `Vertical seams ${wall.seam_bolts} (one bolt in every valley per line); row seams ${rowBolts} (one row at ${Math.round(settings.row_bolt_pitch_m * 1000)} mm)`,
  });
  lines.push({
    section: "Wall",
    item: "50 mm outlet connection",
    spec: "50 mm threaded outlet connection, near the bottom of ring 1 (no valve)",
    unit: "each",
    qty: 1,
    note: "Valve only if the customer ordered one",
  });
  lines.push({
    section: "Wall",
    item: "50 mm overflow",
    spec: selection.roof
      ? "50 mm overflow, 150 mm below the wall top (keeps the water clear of the truss ends)"
      : "50 mm overflow, about 100 mm below the wall top",
    unit: "each",
    qty: 1,
  });
  if (!selection.roof && d >= settings.top_ring_from_dia_m) {
    lines.push({
      section: "Wall",
      item: "Top stiffener ring",
      spec: "Rolled steel top stiffener ring, galvanised",
      unit: "m",
      qty: roundUp(circumference, 0.1),
      note: `Open tanks of ${settings.top_ring_from_dia_m} m and larger`,
    });
  }
  if (wall.wind_rings > 0) {
    lines.push({
      section: "Wall",
      item: "Intermediate wind ring",
      spec: "Rolled steel ring (as the top ring), bolted round the wall at equal heights",
      unit: "m",
      qty: roundUp(wall.wind_rings * circumference, 0.1),
      note: `${wall.wind_rings} ring(s): the empty open tank needs it against wind`,
    });
  }
  lines.push({
    section: "Wall",
    item: "Sealant, liner clips, top trim",
    spec: "Seam sealant, liner clips and top trim",
    unit: "m",
    qty: roundUp(circumference, 0.1),
    note: "Per metre of circumference",
  });

  // ---- liner
  lines.push({
    section: "Liner",
    item: `PVC liner ${selection.linerGsm} gsm`,
    spec: `${selection.linerGsm} gsm PVC, made up for a ${d} m x ${heightM.toFixed(3)} m tank: floor + walls + ${Math.round(settings.liner_overhang_m * 1000)} mm fold-over`,
    unit: "m2",
    qty: round((area + circumference * (heightM + settings.liner_overhang_m)) * (1 + settings.liner_waste), 1),
    note: `Includes ${Math.round(settings.liner_waste * 100)}% waste. Order as one made-up liner`,
  });

  // ---- roof
  let stock: StockLine[] = [];
  let cuts: RoofSheetCut[] = [];
  if (selection.roof && roof) {
    const roofArea = round(area / Math.cos((settings.roof_pitch_deg * Math.PI) / 180), 2);
    cuts = roofSheetCuts(d, settings.roof_sheet_cover_m, roof.slope_deg);
    lines.push({
      section: "Roof sheeting",
      item: "Roof sheet 0.47 mm",
      spec: `${roof.sheet_label}, ${Math.round(settings.roof_sheet_cover_m * 1000)} mm cover, spanning across the trusses`,
      unit: "m",
      qty: roundUp((roofArea / settings.roof_sheet_cover_m) * (1 + settings.roof_waste), 0.1),
      note: `Total metres incl. ${Math.round(settings.roof_waste * 100)}% waste; see the cutting guide. Not for foot traffic`,
    });
    lines.push({
      section: "Roof sheeting",
      item: "Roof screws",
      spec: "Roofing screw with washer",
      unit: "each",
      qty: Math.ceil(roofArea * settings.roof_screws_m2 - 1e-9),
      note: `About ${settings.roof_screws_m2} per m2`,
    });

    stock = roofStock(roof, d, settings.stock_bar_m);
    for (const line of stock) {
      const uses = [...new Set(line.pieces.map((p) => p.use.replace(" (half truss)", "").replace(" (rolled)", "")))].join(", ");
      lines.push({
        section: "Roof steel (raw stock)",
        item: `${sectionKind(line.section)} ${line.section}`,
        spec: `${line.section}, ${line.barM} m lengths`,
        unit: "lengths",
        qty: line.bars,
        lengthEachM: line.barM,
        totalM: round(line.bars * line.barM, 1),
        note: `For: ${uses}. ${line.neededM} m needed`,
      });
    }
    lines.push({
      section: "Roof steel (raw stock)",
      item: "End plates 4 mm",
      spec: `4 mm steel plate, solid welded truss ends, about ${roof.depth_rim_mm} mm deep`,
      unit: "each",
      qty: roof.end_plates,
      note: "Two per truss",
    });
    lines.push({
      section: "Roof steel (raw stock)",
      item: "Roof bolts M12",
      spec: settings.roof_bolt,
      unit: "sets",
      qty: roof.bolts_rim + roof.bolts_tie,
      note: `Truss ends to rim ${roof.bolts_rim}, tie lines ${roof.bolts_tie}`,
    });
    lines.push({
      section: "Roof steel (raw stock)",
      item: "Hot-dip galvanising",
      spec: "Galvanising of the finished trusses, rim angle and ties",
      unit: "kg",
      qty: Number(roof.steel_kg),
      note: "Steel mass from the roof design",
    });
  }

  return {
    heightM,
    capacityKl: round(area * heightM, 1),
    circumferenceM: round(circumference, 2),
    lines,
    stock,
    roofSheetCuts: cuts,
    designDiameterM: designDiameter(d),
  };
}
