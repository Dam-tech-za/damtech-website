import { buildReservoirBoq, designDiameter, isStandardSize, sheetDrillPatterns, type BoqLine, type BoqSection, type BoqSelection, type BoqSettings, type RoofDesign, type WallDesign } from "@/lib/reservoir-boq/boq";
import { AdminInfoBanner, AdminPanel } from "@/components/admin/ui";
import { TrussSketch } from "@/components/admin/operations/reservoir-boq/TrussSketch";
import { InfoHover } from "@/components/admin/operations/reservoir-boq/InfoHover";
import { SheetDrillSketch } from "@/components/admin/operations/reservoir-boq/SheetDrillSketch";

type Props = {
  settings: BoqSettings;
  wall: WallDesign;
  roof: RoofDesign | null;
  selection: BoqSelection;
  reference: string;
};

const SECTIONS: BoqSection[] = ["Wall", "Liner", "Roof sheeting", "Roof steel (raw stock)"];

/** 1 078 and 88.3: a space for thousands and a point for decimals, the same on screen and in the PDF. */
const group = (text: string) => text.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const qty = (line: BoqLine) => {
  const [whole, decimals] = (["m", "m2", "kg"].includes(line.unit) ? line.qty.toFixed(1) : String(line.qty)).split(".");
  return decimals ? `${group(whole)}.${decimals}` : group(whole);
};

/** The printable design: heading, BOQ table, and with a roof the cutting list and truss sketch. */
export function ReservoirBoqResult({ settings, wall, roof, selection, reference }: Props) {
  const diameterM = selection.diameterM;
  const rings = selection.rings;
  const boq = buildReservoirBoq(settings, wall, roof, selection);
  const standard = isStandardSize(settings, diameterM, rings);
  const title = `${diameterM.toFixed(1)} m x ${boq.heightM.toFixed(3)} m reservoir, ${selection.roof ? "with roof" : "no roof"}`;
  const lineNo = new Map(boq.lines.map((line, index) => [line, index + 1]));

  return (
    <div className="rboq-print">
      <header className="rboq-doc-head">
        <div>
          <p className="rboq-doc-head__kicker">DamTech Structural Solutions · Reservoir bill of quantities</p>
          <h2 className="rboq-doc-head__title">{title}</h2>
          {reference ? <p className="rboq-doc-head__ref">Reference: {reference}</p> : null}
        </div>
        <dl className="rboq-doc-head__facts">
          <div>
            <dt>Capacity</dt>
            <dd>{boq.capacityKl.toFixed(1)} kL</dd>
          </div>
          <div>
            <dt>Rings</dt>
            <dd>
              {rings} x {Math.round(settings.ring_height_m * 1000)} mm
            </dd>
          </div>
          <div>
            <dt>Circumference</dt>
            <dd>{boq.circumferenceM.toFixed(2)} m</dd>
          </div>
          <div>
            <dt>Wall, bottom ring to top</dt>
            <dd>{wall.pattern}</dd>
          </div>
        </dl>
      </header>

      {!standard ? (
        <AdminInfoBanner tone="warning">
          This is not a standard size. {boq.designDiameterM !== diameterM ? `The wall gauges, bolt lines and roof steel are those of the ${boq.designDiameterM} m design; sheet cut lengths use ${diameterM} m. ` : ""}
          Check with André before ordering.
        </AdminInfoBanner>
      ) : null}

      <AdminPanel title="Bill of quantities" description="Net quantities to buy. Liner and roof sheet include their waste allowance; bolts include 2% spare.">
        <div className="admin-table-shell">
          <table className="admin-table rboq-table">
            <thead>
              <tr>
                <th className="rboq-num">No</th>
                <th>Item</th>
                <th>Specification</th>
                <th>Unit</th>
                <th className="rboq-num">Qty</th>
                <th className="rboq-num">Length each (m)</th>
                <th className="rboq-num">Total (m)</th>
                <th>Notes</th>
              </tr>
            </thead>
            {SECTIONS.map((section) => {
              const rows = boq.lines.filter((line) => line.section === section);
              if (!rows.length) return null;
              return (
                <tbody key={section}>
                  <tr className="rboq-table__section">
                    <th colSpan={8} scope="rowgroup">
                      {section}
                    </th>
                  </tr>
                  {rows.map((line) => {
                    return (
                      <tr key={`${section}-${line.item}`}>
                        <td className="rboq-num">{lineNo.get(line)}</td>
                        <td className="rboq-table__item">{line.item}</td>
                        <td>{line.spec}</td>
                        <td>{line.unit}</td>
                        <td className="rboq-num rboq-table__qty">{qty(line)}</td>
                        <td className="rboq-num">{line.lengthEachM !== undefined ? line.lengthEachM.toFixed(3) : ""}</td>
                        <td className="rboq-num">{line.totalM !== undefined ? line.totalM.toFixed(1) : ""}</td>
                        <td className="rboq-table__note">{line.note ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Wall sheet drilling"
        description="Holes for the vertical seams, at both ends of every wall sheet. One sketch per ring layout; the length is not to scale, the dimensions are in mm."
      >
        <SheetDrillSketch patterns={sheetDrillPatterns(settings, wall, diameterM)} />
      </AdminPanel>

      {selection.roof && roof ? (
        <>
          <AdminPanel title="Roof steel cutting list" description={`Pieces to cut from the ${settings.stock_bar_m} m lengths above. A piece longer than one length is spliced.`}>
            <div className="admin-table-shell">
              <table className="admin-table rboq-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th className="rboq-num">Lengths to buy</th>
                    <th className="rboq-num">Needed (m)</th>
                    <th>Pieces (number x length in m)</th>
                  </tr>
                </thead>
                <tbody>
                  {boq.stock.map((line) => {
                    const uses = [...new Set(line.pieces.map((p) => p.use))];
                    return (
                      <tr key={line.section}>
                        <td className="rboq-table__item">
                          {line.section}
                          {line.alternative ? <span className="rboq-table__alt"> ({line.alternative} where it is not available)</span> : null}
                        </td>
                        <td className="rboq-num">
                          {line.bars} x {line.barM} m
                        </td>
                        <td className="rboq-num">{line.neededM.toFixed(1)}</td>
                        <td className="rboq-table__note">
                          <span className="rboq-pieces__uses">{uses.join(", ")}</span>
                          <InfoHover label={`Pieces to cut from ${line.section}`}>
                            {uses.map((use) => (
                              <span key={use} className="rboq-pieces">
                                <strong>{use}:</strong>{" "}
                                {line.pieces
                                  .filter((p) => p.use === use)
                                  .map((p) => `${p.count} x ${p.lengthM.toFixed(3)}`)
                                  .join(", ")}
                              </span>
                            ))}
                          </InfoHover>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="rboq-table__item">{settings.roof_sheet}</td>
                    <td className="rboq-num">{boq.roofSheetCuts.reduce((sum, c) => sum + c.count, 0)} sheets</td>
                    <td className="rboq-num">{boq.roofSheetCuts.reduce((sum, c) => sum + c.count * c.lengthM, 0).toFixed(1)}</td>
                    <td className="rboq-table__note">
                      <span className="rboq-pieces__uses">cutting guide</span>
                      <InfoHover label="Roof sheet cutting guide">
                        <span className="rboq-pieces">
                          <strong>cutting guide, ridge to rim on both sides:</strong> {boq.roofSheetCuts.map((c) => `${c.count} x ${c.lengthM.toFixed(2)}`).join(", ")}
                        </span>
                      </InfoHover>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AdminPanel>

          <AdminPanel title="Truss design" description="Line sketch of the roof trusses for the workshop.">
            <TrussSketch roof={roof} diameterM={designDiameter(diameterM)} />
          </AdminPanel>
        </>
      ) : null}

      <p className="rboq-foot">
        Design: DamTech calculator, parameter file {settings.parameter_version} (data generated {settings.generated_on}). Bolt holes {settings.edge_mm} mm and 65 mm from the sheet end;
        three bolt lines need a 150 mm end lap. Quantities are for ordering and do not replace the engineer&apos;s sign-off.
      </p>
    </div>
  );
}
