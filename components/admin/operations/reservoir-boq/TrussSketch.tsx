import { trussMembers, type RoofDesign, type TrussDetail, type TrussMember } from "@/lib/reservoir-boq/boq";
import { InfoHover } from "@/components/admin/operations/reservoir-boq/InfoHover";

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

/** Ribs and diagonals of one truss as "17 x L25x25x2.5 (L25x25x2 where not available)". */
function memberLists(truss: TrussDetail, roof: RoofDesign) {
  const diagonals = new Map<string, number>();
  for (const p of truss.panels) if (p.web !== "solid") diagonals.set(short(p.web), (diagonals.get(short(p.web)) ?? 0) + 2);
  const ribs = new Map<string, number>();
  truss.ribs.forEach((r, i) => ribs.set(short(r), (ribs.get(short(r)) ?? 0) + (i === 0 ? 1 : 2)));
  const alt = new Map(Object.entries(roof.web_alternative ?? {}).map(([k, v]) => [short(k), short(v)]));
  const list = (m: Map<string, number>) => [...m.entries()].map(([k, v]) => `${v} x ${k}${alt.has(k) ? ` (${alt.get(k)} where not available)` : ""}`).join(", ");
  return { ribs: list(ribs), diagonals: list(diagonals) || "none" };
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

/** Vertical dimension line with end ticks; the label sits to the left or right of it. */
function DimV({ x, y1, y2, label, side }: { x: number; y1: number; y2: number; label: string; side: "left" | "right" }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} className="rboq-svg-dim" />
      <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} className="rboq-svg-dim" />
      <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} className="rboq-svg-dim" />
      <text x={side === "left" ? x - 5 : x + 5} y={(y1 + y2) / 2 + 3} textAnchor={side === "left" ? "end" : "start"} className="rboq-svg-dim-label">
        {label}
      </text>
    </g>
  );
}

function Elevation({ truss, names, roof }: { truss: TrussDetail; names: string[]; roof: RoofDesign }) {
  const width = 760;
  const padX = 100;
  const top = 8;
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
  const members = memberLists(truss, roof);

  const tiesHere = roof.tie_lines_m.filter((x) => Math.abs(x) < rho - 0.05);
  const details: [string, string][] = [
    ["Number off", `${names.length} (${names.join(", ")})`],
    ["Span (bottom chord)", `${truss.span_m.toFixed(3)} m, ${short(roof.bottom_chord)}`],
    ["Top chord", `2 x ${(truss.top_chord_m / 2).toFixed(3)} m, ${short(roof.top_chord)}`],
    ["Depth", `${centre} mm at the centre, ${depths[last]} mm at the rim`],
    ["Ribs", members.ribs],
    ["Diagonals", members.diagonals],
    ["Truss ends", "solid 4 mm plate over the last panel at each end"],
    ["Tie lines", tiesHere.length ? `${tiesHere.length} (dots on the bottom chord)` : "none"],
  ];

  return (
    <figure className="rboq-truss">
      <figcaption className="rboq-truss__title">
        {names.join(" and ")}: span {truss.span_m.toFixed(3)} m
      </figcaption>
      <svg viewBox={`0 0 ${width} ${baseY + 34}`} className="rboq-sketch__elevation" role="img" aria-label={`Truss ${names.join(", ")} elevation`}>
        {roof.rim_drop_mm > 0 ? <line x1={X(-rho) - 18} y1={Y(roof.rim_drop_mm)} x2={X(rho) + 18} y2={Y(roof.rim_drop_mm)} className="rboq-svg-wall" /> : null}
        <DimV x={X(-rho) - 24} y1={baseY} y2={Y(depths[last])} label={`${depths[last]} end`} side="left" />
        {roof.rim_drop_mm > 0 ? <DimV x={X(rho) + 24} y1={baseY} y2={Y(roof.rim_drop_mm)} label={`${roof.rim_drop_mm} in tank`} side="right" /> : null}
        <g>
          <line x1={X(-rho)} y1={baseY + 16} x2={X(rho)} y2={baseY + 16} className="rboq-svg-dim" />
          <line x1={X(-rho)} y1={baseY + 4} x2={X(-rho)} y2={baseY + 20} className="rboq-svg-dim" />
          <line x1={X(rho)} y1={baseY + 4} x2={X(rho)} y2={baseY + 20} className="rboq-svg-dim" />
          <text x={X(0)} y={baseY + 30} textAnchor="middle" className="rboq-svg-dim-label">
            {Math.round(truss.span_m * 1000)} (bottom chord)
          </text>
        </g>
        <line x1={X(-rho)} y1={baseY} x2={X(rho)} y2={baseY} className="rboq-svg-chord" />
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
              return panel.dir === "down to centre" ? (
                <line key={`dg-${j}`} x1={X(xb)} y1={Y(depths[j + 1])} x2={X(xa)} y2={baseY} className="rboq-svg-web" />
              ) : (
                <line key={`dg-${j}`} x1={X(xa)} y1={Y(depths[j])} x2={X(xb)} y2={baseY} className="rboq-svg-web" />
              );
            })}
          </g>
        ))}
        {tiesHere.map((x) => (
          <circle key={`tie-${x}`} cx={X(x)} cy={baseY} r={2.6} className="rboq-svg-tie-dot" />
        ))}
      </svg>
      {/* Print only: the same details as a table beside the truss. */}
      <div className="rboq-truss__print">
        <TrussDetails rows={details} />
      </div>
    </figure>
  );
}

function MemberCuts({ title, members, roof }: { title: string; members: TrussMember[]; roof: RoofDesign }) {
  if (!members.length) return null;
  const sections = [...new Set(members.map((m) => m.section))];
  return (
    <>
      {sections.map((section) => {
        const alt = roof.web_alternative?.[section];
        const list = members.filter((m) => m.section === section);
        return (
          <span key={`${title}-${section}`} className="rboq-pieces">
            <strong>
              {title}, {short(section)}
              {alt ? ` (${short(alt)} where not available)` : ""}, {list.reduce((n, m) => n + m.count, 0)} pieces:
            </strong>{" "}
            {list.map((m) => `${m.count} x ${m.lengthM.toFixed(3)}`).join(", ")}
          </span>
        );
      })}
    </>
  );
}

function TrussDetails({ rows }: { rows: [string, string][] }) {
  return (
    <table className="rboq-truss__details">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
        Not to scale: depth is drawn larger than span. Dimensions in mm. Dashed line = top of the wall. The members of each truss print as a table beside it.
      </p>
      <table className="admin-table rboq-table rboq-table--trusses">
        <thead>
          <tr>
            <th>Truss</th>
            <th>From centre</th>
            <th>Span (bottom chord)</th>
            <th>Top chord</th>
            <th>Rib heights, centre to rim (mm)</th>
            <th>Ribs and diagonals (per truss)</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const { ribs, diagonals } = trussMembers(group.truss);
            const total = (list: TrussMember[]) => list.reduce((n, m) => n + m.count, 0);
            return (
              <tr key={group.names.join("-")}>
                <td>{group.names.join(", ")}</td>
                <td>{Math.abs(group.truss.y_m).toFixed(2)} m</td>
                <td>{group.truss.span_m.toFixed(3)} m</td>
                <td>2 x {(group.truss.top_chord_m / 2).toFixed(3)} m</td>
                <td>{group.truss.depths_mm.join(", ")}</td>
                <td>
                  <span className="rboq-pieces__uses">
                    {total(ribs)} ribs, {total(diagonals)} diagonals
                  </span>
                  <InfoHover label={`Ribs and diagonals of truss ${group.names.join(", ")}`}>
                    <MemberCuts title="Ribs" members={ribs} roof={roof} />
                    <MemberCuts title="Diagonals" members={diagonals} roof={roof} />
                    <span className="rboq-pieces rboq-table__note">
                      Number x cut length in m, for one truss; make {group.names.length} ({group.names.join(", ")}).
                    </span>
                  </InfoHover>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
