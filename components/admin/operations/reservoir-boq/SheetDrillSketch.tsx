import type { SheetDrillPattern } from "@/lib/reservoir-boq/boq";

/**
 * Workshop sketch for drilling the vertical-seam holes in the wall sheets:
 * the sheet with a break in the middle (not to scale), the hole lines at both
 * ends, and the dimensions to set out. Row-seam holes are left off.
 */

const W = 720;
const H = 330;
const SHEET = { x: 70, y: 70, w: 560, h: 200 };
/** Horizontal mm → px at the sheet ends (exaggerated so 30 mm gaps are readable). */
const EX = 1.35;

const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const mm = (n: number) => (Number.isInteger(n) ? group(n) : n.toFixed(1));

function ringsLabel(rings: number[]): string {
  if (rings.length === 1) return `Ring ${rings[0]}${rings[0] === 1 ? " (bottom)" : ""}`;
  const contiguous = rings.every((r, i) => i === 0 || r === rings[i - 1] + 1);
  return contiguous ? `Rings ${rings[0]}–${rings[rings.length - 1]}` : `Rings ${rings.join(", ")}`;
}

/** Horizontal dimension with ticks, text above. */
function HDim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g className="rboq-dim">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** Vertical dimension with ticks, text beside it. */
function VDim({ x, y1, y2, label, side = "left" }: { x: number; y1: number; y2: number; label: string; side?: "left" | "right" }) {
  return (
    <g className="rboq-dim">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <text x={side === "left" ? x - 8 : x + 8} y={(y1 + y2) / 2} dy="0.32em" textAnchor={side === "left" ? "end" : "start"}>
        {label}
      </text>
    </g>
  );
}

function OneSheet({ p }: { p: SheetDrillPattern }) {
  const left = SHEET.x;
  const right = SHEET.x + SHEET.w;
  const top = SHEET.y;
  const bottom = SHEET.y + SHEET.h;
  const yScale = SHEET.h / p.sheetHeightMm;
  // Holes from the bottom edge: half a pitch, then every pitch (the middle of each valley).
  const holeY = Array.from({ length: p.holesPerLine }, (_, i) => bottom - (p.firstHoleMm + i * p.pitchMm) * yScale);
  const leftX = p.lineOffsetsMm.map((o) => left + o * EX);
  const rightX = p.lineOffsetsMm.map((o) => right - o * EX);
  const breakX = SHEET.x + SHEET.w / 2;
  const zig = (x: number) => `M${x - 6},${top - 6} L${x + 6},${top + 30} L${x - 6},${top + 70} L${x + 6},${bottom - 60} L${x - 6},${bottom + 6}`;
  const holesPerSheet = p.holesPerLine * p.lineOffsetsMm.length * 2;
  const outer = p.lineOffsetsMm[p.lineOffsetsMm.length - 1];

  return (
    <figure className="rboq-drill">
      <figcaption className="rboq-drill__head">
        <strong>{ringsLabel(p.rings)}</strong>
        <span>
          {p.sheets} sheets · {mm(p.cutLengthMm)} mm cut length · {p.endLapMm} mm end lap · {holesPerSheet} holes per sheet
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="rboq-drill__svg" role="img" aria-label={`${ringsLabel(p.rings)}: ${p.lineOffsetsMm.length} hole lines at ${p.lineOffsetsMm.join(", ")} mm from each sheet end, ${p.holesPerLine} holes per line at ${mm(p.pitchMm)} mm pitch`}>
        {/* Valleys of the corrugation, where the holes go. */}
        {holeY.map((y) => (
          <line key={`v-${y}`} x1={left} x2={right} y1={y} y2={y} className="rboq-drill__valley" />
        ))}
        {/* Sheet outline, broken in the middle: the length is not to scale. */}
        <path d={`M${breakX - 14},${top} H${left} V${bottom} H${breakX - 14}`} className="rboq-drill__sheet" />
        <path d={`M${breakX + 14},${top} H${right} V${bottom} H${breakX + 14}`} className="rboq-drill__sheet" />
        <rect x={breakX - 13} y={top - 8} width={26} height={SHEET.h + 16} className="rboq-drill__gap" />
        <path d={zig(breakX - 14)} className="rboq-drill__break" />
        <path d={zig(breakX + 14)} className="rboq-drill__break" />

        {/* Holes at both ends. */}
        {[...leftX, ...rightX].map((x) =>
          holeY.map((y) => <circle key={`h-${x}-${y}`} cx={x} cy={y} r={3.6} className="rboq-drill__hole" />),
        )}

        {/* Hole lines from each sheet end (stacked, like the workshop sketch). */}
        {p.lineOffsetsMm.map((o, i) => (
          <g key={`dim-${o}`}>
            <HDim x1={right - o * EX} x2={right} y={top - 14 - i * 18} label={`${o}`} />
            <HDim x1={left} x2={left + o * EX} y={top - 14 - i * 18} label={`${o}`} />
          </g>
        ))}
        {/* Height, pitch and first hole. */}
        <VDim x={left - 22} y1={top} y2={bottom} label={`${mm(p.sheetHeightMm)}`} />
        <VDim x={right + 22} y1={holeY[0]} y2={bottom} label={`${mm(p.firstHoleMm)}`} side="right" />
        {holeY.length > 1 ? (
          <VDim x={right + 22} y1={holeY[holeY.length - 1]} y2={holeY[holeY.length - 2]} label={`${mm(p.pitchMm)} pitch`} side="right" />
        ) : null}
        {/* Overall cut length. */}
        <HDim x1={left} x2={right} y={bottom + 34} label={`${mm(p.cutLengthMm)} mm cut length (not to scale)`} />
      </svg>
      <p className="rboq-drill__note">
        Drill both ends: {p.lineOffsetsMm.length} lines of {p.holesPerLine} holes, one in every valley ({mm(p.pitchMm)} mm pitch, the first {mm(p.firstHoleMm)} mm from the bottom edge), at{" "}
        {p.lineOffsetsMm.join(" / ")} mm from the sheet end, for the M10 seam bolts. The outer line sits {outer} mm in, inside the {p.endLapMm} mm lap.
        Row-seam holes along the top and bottom edges are not shown.
      </p>
    </figure>
  );
}

export function SheetDrillSketch({ patterns }: { patterns: SheetDrillPattern[] }) {
  return (
    <div className="rboq-drills">
      {patterns.map((p) => (
        <OneSheet key={p.rings.join("-")} p={p} />
      ))}
    </div>
  );
}
