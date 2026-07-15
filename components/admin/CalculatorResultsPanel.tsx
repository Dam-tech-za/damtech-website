import { HDPE_DISCLAIMER } from "@/lib/estimating/hdpe";

type Props = {
  calculatorType: string | null;
  inputs: Record<string, unknown> | null;
  results: Record<string, unknown> | null;
};

export function CalculatorResultsPanel({
  calculatorType,
  inputs,
  results,
}: Props) {
  if (!calculatorType && !inputs && !results) {
    return (
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Calculator results</h2>
        </header>
        <div className="admin-empty">
          <p>No calculator data on this RFQ.</p>
        </div>
      </section>
    );
  }

  const isHdpe =
    Boolean(calculatorType?.includes("dam-lining") || calculatorType?.includes("hdpe"));
  const isWater =
    Boolean(
      calculatorType?.includes("water") ||
        calculatorType?.includes("tank") ||
        calculatorType?.includes("irrigation") ||
        calculatorType?.includes("rainwater"),
    );

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <h2>Calculator results</h2>
        <p className="admin-empty__hint">{calculatorType ?? "Unknown calculator"}</p>
      </header>

      {isHdpe ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {renderRows(inputs, [
                ["topLength", "Top length"],
                ["topWidth", "Top width"],
                ["bottomLength", "Bottom length"],
                ["bottomWidth", "Bottom width"],
                ["depth", "Depth"],
                ["allowancePercent", "Allowance / waste %"],
              ])}
              {renderRows(results, [
                ["floorAreaM2", "Floor area"],
                ["wallAreaM2", "Wall area"],
                ["anchorAllowanceM2", "Anchor trench allowance"],
                ["estimatedLinerAreaM2", "Estimated liner area"],
                ["Estimated material area (incl. overlap & wastage)", "Estimated material area"],
                ["Total area (m²)", "Total area"],
              ])}
            </tbody>
          </table>
        </div>
      ) : null}

      {isWater ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              {renderRows(inputs, [
                ["dailyDemand", "Daily demand"],
                ["storageDays", "Storage days"],
                ["lossFactor", "Loss factor"],
                ["safetyMargin", "Safety margin"],
              ])}
              {renderRows(results, [
                ["requiredVolumeM3", "Required volume"],
                ["storageVolumeM3", "Storage volume"],
                ["suggestedVolumeM3", "Suggested volume"],
                ["Recommended storage volume (litres)", "Recommended storage"],
                ["Suggested tank size band", "Suggested class"],
              ])}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isHdpe && !isWater ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inputs ?? {}).map(([key, value]) => (
                <tr key={`in-${key}`}>
                  <td>Input · {key}</td>
                  <td>{String(value)}</td>
                </tr>
              ))}
              {Object.entries(results ?? {}).map(([key, value]) => (
                <tr key={`out-${key}`}>
                  <td>Result · {key}</td>
                  <td>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="admin-disclaimer">{HDPE_DISCLAIMER}</p>
    </section>
  );
}

function renderRows(
  source: Record<string, unknown> | null,
  keys: Array<[string, string]>,
) {
  if (!source) return null;
  return keys
    .filter(([key]) => source[key] !== undefined && source[key] !== null && source[key] !== "")
    .map(([key, label]) => (
      <tr key={key}>
        <td>{label}</td>
        <td>{String(source[key])}</td>
      </tr>
    ));
}
