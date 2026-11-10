import Link from "next/link";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  getPvcLinerBySku,
  PVC_LINER_GSM_OPTIONS,
  PVC_LINER_ROWS_OPTIONS,
  pvcLinerDiametersForRows,
  pvcLinerProductPath,
  pvcLinerSku,
} from "@/lib/shop/pvc-liners";

/** Every liner with its price, linking to its own product page. */
export function PvcLinerSizeTable() {
  return (
    <div className="pvc-size-tables">
      {PVC_LINER_ROWS_OPTIONS.map((rows) => {
        const first = getPvcLinerBySku(pvcLinerSku(550, pvcLinerDiametersForRows(rows)[0], rows));
        return (
          <div key={rows} className="site-data-table">
            <h3 className="site-data-table__title">
              {rows}-row tanks ({first?.heightM.toFixed(2)} m high)
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Tank diameter</th>
                  <th>Volume</th>
                  {PVC_LINER_GSM_OPTIONS.map((gsm) => (
                    <th key={gsm}>{gsm} gsm incl. VAT</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pvcLinerDiametersForRows(rows).map((diameter) => {
                  const liners = PVC_LINER_GSM_OPTIONS.map((gsm) => getPvcLinerBySku(pvcLinerSku(gsm, diameter, rows)));
                  return (
                    <tr key={diameter}>
                      <td>{diameter} m</td>
                      <td>{liners[0] ? `${Math.round(liners[0].volumeKl)} kL` : ""}</td>
                      {liners.map((liner, index) => (
                        <td key={PVC_LINER_GSM_OPTIONS[index]}>
                          {liner ? (
                            <Link
                              href={pvcLinerProductPath(liner)}
                              className="text-water hover:underline"
                              aria-label={`${liner.name}, ${formatZarExactAmount(liner.priceInclVatZar)}`}
                            >
                              {formatZarExactAmount(liner.priceInclVatZar)}
                            </Link>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
