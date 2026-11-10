import type { RoofDesign, TrussDetail } from "@/lib/reservoir-boq/boq";

type Props = { roof: RoofDesign; diameterM: number };

const short = (section: string) => section.replace(/\s+/g, "");

/** Trusses that differ (the roof is symmetric, so T1 = T5, T2 = T4 ...), centre truss first. */
function distinctTrusses(detail: TrussDetail[]) {
  const sorted = detail.map((truss, index) => ({ truss, name: `T${index + 1}` }));
  const groups = new Map<string, { truss: TrussDetail; names: string[] }>();
  for (const { truss, name } of sorted) {
    const key = Math.abs(truss.y_m).toFixed(3);
    const group = groups.get(key);
    if (group) group.names.push(name);
    else groups.set(key, { truss, names: [name] });
  }
  return [...groups.values()].sort((a, b) => Math.abs(a.truss.y_m) - Math.abs(b.truss.y_m));
}

function PlanView({ roof, diameterM }: Props) {
  const size = 260;
  const pad = 26;
  const radius = diameterM / 2;
  const scale = (size - 2 * pad) / diameterM;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg viewBox={`0 0 ${size + 70} ${size}`} className="rboq-sketch__plan" role="img" aria-label="Roof plan: trusses and tie lines">
      <circle cx={cx} cy={cy} r={radius * scale} className="rboq-svg-rim" />
      {roof.tie_lines_m.map((x) => {
        const half = Math.sqrt(Math.max(radius * radius - x * x, 0)) * scale;
        return <line key={`tie-${x}`} x1={cx + x * scale} y1={cy - half} x2={cx + x * scale} y2={cy + half} className="rboq-svg-tie" />;
      })}
      {roof.truss_detail.map((truss, index) => {
        const half = (truss.span_m / 2) * scale;
        const y = cy + truss.y_m * scale;
        return (
          <g key={`truss-${index}`}>
            <line x1={cx - half} y1={y} x2={cx + half} y2={y} className="rboq-svg-truss" />
            <text x={cx + radius * scale + 8} y={y + 4} className="rboq-svg-label">
              T{index + 1} {truss.y_m >= 0 ? "+" : ""}
              {truss.y_m.toFixed(2)} m
            </text>
          </g>
        );
      })}
      <text x={cx} y={14} textAnchor="middle" className="rboq-svg-caption">
        Plan: {roof.trusses} truss{roof.trusses === 1 ? "" : "es"} (solid), tie lines (dashed)
      </text>
    </svg>
  );
}

function Elevation({ truss, names, roof }: { truss: TrussDetail; names: string[]; roof: RoofDesign }) {
  const width = 640;
  const padX = 34;
  const top = 30;
  const drawH = 92;
  const rho = truss.span_m / 2;
  const sx = (width - 2 * padX) / truss.span_m;
  const maxDepth = Math.max(...roof.truss_detail.map((t) => t.depths_mm[0]));
  const sy = drawH / maxDepth; // depth is drawn to its own scale so the members stay readable
  const baseY = top + drawH;
  const X = (x: number) => width / 2 + x * sx;
  const Y = (depthMm: number) => baseY - depthMm * sy;
  const nodes = truss.nodes_m;
  const depths = truss.depths_mm;
  const last = nodes.length - 1;
  const sides = [1, -1];
  const centre = depths[0];
  const diagonals = truss.panels.filter((p) => p.web !== "solid");
  const counts = new Map<string, number>();
  for (const p of diagonals) counts.set(short(p.web), (counts.get(short(p.web)) ?? 0) + 2);
  const ribCounts = new Map<string, number>();
  truss.ribs.forEach((r, i) => ribCounts.set(short(r), (ribCounts.get(short(r)) ?? 0) + (i === 0 ? 1 : 2)));
  const list = (m: Map<string, number>) => [...m.entries()].map(([k, v]) => `${v} x ${k}`).join(", ");

  return (
    <svg viewBox={`0 0 ${width} ${baseY + 44}`} className="rboq-sketch__elevation" role="img" aria-label={`Truss ${names.join(", ")} elevation`}>
      <text x={padX} y={16} className="rboq-svg-caption">
        {names.join(" and ")} ({names.length} off): span {truss.span_m.toFixed(3)} m, {centre} mm deep at the centre, {depths[last]} mm at the rim
      </text>
      {roof.rim_drop_mm > 0 ? (
        <g>
          <line x1={padX - 20} y1={Y(roof.rim_drop_mm)} x2={width - padX + 20} y2={Y(roof.rim_drop_mm)} className="rboq-svg-wall" />
          <text x={padX - 20} y={Y(roof.rim_drop_mm) - 4} className="rboq-svg-label">
            wall
          </text>
        </g>
      ) : null}
      {/* bottom chord */}
      <line x1={X(-rho)} y1={baseY} x2={X(rho)} y2={baseY} className="rboq-svg-chord" />
      {/* top chord */}
      <polyline points={`${X(-rho)},${Y(depths[last])} ${X(0)},${Y(centre)} ${X(rho)},${Y(depths[last])}`} className="rboq-svg-chord" />
      {sides.map((side) => (
        <g key={side}>
          {nodes.map((x, i) =>
            side === -1 && i === 0 ? null : (
              <line key={`rib-${i}`} x1={X(side * x)} y1={baseY} x2={X(side * x)} y2={Y(depths[i])} className="rboq-svg-web" />
            ),
          )}
          {truss.panels.map((panel, j) => {
            const xa = side * nodes[j];
            const xb = side * nodes[j + 1];
            if (panel.web === "solid") {
              return (
                <polygon
                  key={`end-${j}`}
                  points={`${X(xa)},${baseY} ${X(xa)},${Y(depths[j])} ${X(xb)},${Y(depths[j + 1])} ${X(xb)},${baseY}`}
                  className="rboq-svg-plate"
                />
              );
            }
            const toCentre = panel.dir === "down to centre";
            return toCentre ? (
              <line key={`dg-${j}`} x1={X(xb)} y1={Y(depths[j + 1])} x2={X(xa)} y2={baseY} className="rboq-svg-web" />
            ) : (
              <line key={`dg-${j}`} x1={X(xa)} y1={Y(depths[j])} x2={X(xb)} y2={baseY} className="rboq-svg-web" />
            );
          })}
        </g>
      ))}
      {/* tie positions on the bottom chord */}
      {roof.tie_lines_m
        .filter((x) => Math.abs(x) < rho - 0.05)
        .map((x) => (
          <circle key={`tie-${x}`} cx={X(x)} cy={baseY} r={2.6} className="rboq-svg-tie-dot" />
        ))}
      <text x={padX} y={baseY + 16} className="rboq-svg-label">
        Top chord 2 x {(truss.top_chord_m / 2).toFixed(3)} m {short(roof.top_chord)} · bottom chord {truss.span_m.toFixed(3)} m {short(roof.bottom_chord)}
      </text>
      <text x={padX} y={baseY + 30} className="rboq-svg-label">
        Ribs: {list(ribCounts)} · diagonals: {list(counts) || "none"} · solid 4 mm plate over the last panel at each end · dots = tie lines · dashed = top of the wall
      </text>
    </svg>
  );
}

/** Line sketch of the roof: plan of the trusses and ties, then one elevation per different truss, then the rib table. */
export function TrussSketch({ roof, diameterM }: Props) {
  const groups = distinctTrusses(roof.truss_detail);
  return (
    <div className="rboq-sketch">
      <div className="rboq-sketch__top">
        <PlanView roof={roof} diameterM={diameterM} />
        <dl className="rboq-sketch__facts">
          <div>
            <dt>Trusses</dt>
            <dd>
              {roof.trusses} at {roof.truss_spacing_m.toFixed(2)} m centres, rim to rim
            </dd>
          </div>
          <div>
            <dt>Depth</dt>
            <dd>
              {roof.depth_centre_mm} mm at the centre of the middle truss, {roof.depth_rim_mm} mm at every truss end
              {roof.rim_drop_mm > 0 ? ` (${roof.depth_rim_mm - roof.rim_drop_mm} mm above the wall top, ${roof.rim_drop_mm} mm inside the tank)` : ""}
            </dd>
          </div>
          <div>
            <dt>Roof slope</dt>
            <dd>{roof.slope_deg.toFixed(1)} degrees, falling from the centre to the rim all round</dd>
          </div>
          <div>
            <dt>Chords</dt>
            <dd>
              Top {roof.top_chord}, bottom {roof.bottom_chord}; rim angle {roof.top_chord}, rolled
            </dd>
          </div>
          <div>
            <dt>Ties</dt>
            <dd>
              {roof.tie_lines_m.length
                ? `${roof.tie_section} across the bottom chords every ${roof.bottom_brace_spacing_m.toFixed(1)} m, bolted to the rim angle`
                : "None needed"}
            </dd>
          </div>
          <div>
            <dt>Design loads</dt>
            <dd>
              {roof.imposed_kpa} kPa imposed, {roof.uplift_kpa} kPa net uplift; highest member utilisation {roof.max_util.toFixed(2)}; deflection{" "}
              {roof.defl_actual_mm.toFixed(1)} mm (limit {roof.defl_limit_mm.toFixed(0)} mm)
            </dd>
          </div>
        </dl>
      </div>
      {groups.map((group) => (
        <Elevation key={group.names.join("-")} truss={group.truss} names={group.names} roof={roof} />
      ))}
      <p className="rboq-sketch__note">
        Elevations are not to scale: the depth is drawn larger than the span so the members can be seen. Ribs stand every {Math.round(roof.panel_m * 1000)} mm from the centre.
        Diagonals are drawn the way they run, so gravity puts them in tension.
      </p>
      <table className="admin-table rboq-table rboq-table--trusses">
        <thead>
          <tr>
            <th>Truss</th>
            <th>From centre</th>
            <th>Span (bottom chord)</th>
            <th>Top chord</th>
            <th>Rib heights, centre to rim (mm)</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.names.join("-")}>
              <td>{group.names.join(", ")}</td>
              <td>{Math.abs(group.truss.y_m).toFixed(2)} m</td>
              <td>{group.truss.span_m.toFixed(3)} m</td>
              <td>2 x {(group.truss.top_chord_m / 2).toFixed(3)} m</td>
              <td>{group.truss.depths_mm.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
