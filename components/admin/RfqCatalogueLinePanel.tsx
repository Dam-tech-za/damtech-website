import { AdminPanel } from "@/components/admin/ui";
import { formatZarInclVat } from "@/lib/catalogue";

export type RfqCatalogueLineRow = {
  id: string;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price_incl_vat_zar: number | string;
  line_total_incl_vat_zar: number | string;
  vat_included: boolean | null;
  transport_excluded: boolean | null;
  installation_excluded: boolean | null;
};

function money(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function RfqCatalogueLinePanel({
  lines,
}: {
  lines: RfqCatalogueLineRow[];
}) {
  if (!lines.length) return null;

  return (
    <AdminPanel
      title="Catalogue invoice request"
      description="SKU, name and VAT-inclusive prices are derived from the Damtech product catalogue. Transport and installation remain excluded until quoted."
    >
      <div className="admin-table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit incl. VAT</th>
              <th>Line total incl. VAT</th>
              <th>Exclusions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>{line.sku}</td>
                <td>{line.product_name}</td>
                <td>{line.quantity}</td>
                <td>{formatZarInclVat(money(line.unit_price_incl_vat_zar))}</td>
                <td>{formatZarInclVat(money(line.line_total_incl_vat_zar))}</td>
                <td>
                  {[
                    line.transport_excluded !== false ? "Transport excluded" : null,
                    line.installation_excluded !== false
                      ? "Installation excluded"
                      : null,
                    line.vat_included !== false ? "VAT included" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}
