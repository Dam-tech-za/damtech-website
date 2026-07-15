import { ASSET_MEASUREMENT_STATUSES } from "@/lib/rfq/statuses";
import {
  confirmRfqAssetAction,
  overrideRfqAssetAction,
} from "@/app/admin/rfqs/actions";

type Asset = {
  id: string;
  rfq_id: string;
  asset_sequence: number;
  asset_name: string;
  asset_type: string;
  quantity: number;
  measurement_method: string;
  material_preference: string | null;
  measurement_status: string;
  raw_inputs: Record<string, unknown> | null;
  calculated_outputs: Record<string, unknown> | null;
  calculation_warnings: unknown;
  site_conditions: Record<string, unknown> | null;
  estimator_confirmed: boolean;
  estimator_notes: string | null;
  estimator_override_reason: string | null;
  confirmed_installation_area_m2: number | null;
  confirmed_material_area_m2: number | null;
  confirmed_geotextile_area_m2: number | null;
  confirmed_surface_prep_area_m2: number | null;
  confirmed_anchor_area_m2: number | null;
  confirmed_volume_m3: number | null;
  confirmed_capacity_kl: number | null;
  confirmed_overlap_percent: number | null;
  confirmed_waste_percent: number | null;
  confirmed_roll_qty: number | null;
  calculation_version: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  mime_type: string | null;
  category: string | null;
  created_at: string;
  rfq_asset_id: string | null;
  signedUrl?: string | null;
};

type Props = {
  assets: Asset[];
  attachments: Attachment[];
  canManage: boolean;
};

export function RfqAssetReviewPanels({ assets, attachments, canManage }: Props) {
  if (!assets.length) {
    return (
      <div className="admin-empty">
        <p>No structured assets yet.</p>
        <p className="admin-empty__hint">
          Simple public quotes are valid without assets. Use the enrich actions
          above or the information-request tools when more detail arrives.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-asset-panels">
      {assets.map((asset) => {
        const out = (asset.calculated_outputs ?? {}) as Record<string, unknown>;
        const assetFiles = attachments.filter((f) => f.rfq_asset_id === asset.id);
        return (
          <details key={asset.id} className="admin-asset-card" open={assets.length <= 3}>
            <summary>
              #{asset.asset_sequence} {asset.asset_name} ·{" "}
              {asset.asset_type.replace(/_/g, " ")} · qty {asset.quantity} ·{" "}
              <span className={`admin-status admin-status--${asset.measurement_status}`}>
                {asset.measurement_status}
              </span>
              {asset.estimator_confirmed ? " · confirmed" : ""}
            </summary>

            <div className="admin-asset-card__body">
              <dl className="admin-dl">
                <div>
                  <dt>Measurement method</dt>
                  <dd>{asset.measurement_method.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt>Material preference</dt>
                  <dd>{asset.material_preference ?? "—"}</dd>
                </div>
                <div>
                  <dt>Calculation version</dt>
                  <dd>{asset.calculation_version ?? "—"}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>
                    {asset.estimator_confirmed
                      ? "Estimator confirmed for quote"
                      : asset.measurement_status.replace(/_/g, " ")}
                  </dd>
                </div>
              </dl>

              <h4 className="admin-subheading">Separated quantities</h4>
              <dl className="admin-dl">
                <div>
                  <dt>Confirmed installation area</dt>
                  <dd>{fmt(asset.confirmed_installation_area_m2 ?? out.installationAreaM2)} m²</dd>
                </div>
                <div>
                  <dt>Confirmed material area</dt>
                  <dd>{fmt(asset.confirmed_material_area_m2 ?? out.materialAreaM2)} m²</dd>
                </div>
                <div>
                  <dt>Geotextile</dt>
                  <dd>{fmt(asset.confirmed_geotextile_area_m2)} m²</dd>
                </div>
                <div>
                  <dt>Surface preparation</dt>
                  <dd>{fmt(asset.confirmed_surface_prep_area_m2)} m²</dd>
                </div>
                <div>
                  <dt>Anchor allowance</dt>
                  <dd>{fmt(asset.confirmed_anchor_area_m2)} m²</dd>
                </div>
                <div>
                  <dt>Volume</dt>
                  <dd>{fmt(asset.confirmed_volume_m3 ?? out.grossVolumeM3)} m³</dd>
                </div>
                <div>
                  <dt>Tank capacity</dt>
                  <dd>
                    {fmt(
                      asset.confirmed_capacity_kl ??
                        out.totalGrossCapacityKL ??
                        out.grossCapacityKL,
                    )}{" "}
                    kL
                  </dd>
                </div>
                <div>
                  <dt>Roll / panel qty</dt>
                  <dd>{fmt(asset.confirmed_roll_qty)}</dd>
                </div>
              </dl>

              <h4 className="admin-subheading">Raw public inputs</h4>
              <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(asset.raw_inputs ?? {}, null, 2)}
              </pre>

              <h4 className="admin-subheading">Calculated outputs</h4>
              <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(out, null, 2)}
              </pre>

              <h4 className="admin-subheading">Warnings</h4>
              <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(asset.calculation_warnings ?? [], null, 2)}
              </pre>

              <h4 className="admin-subheading">Site conditions / notes</h4>
              <pre className="admin-prose" style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(asset.site_conditions ?? {}, null, 2)}
              </pre>

              {asset.estimator_override_reason ? (
                <p className="admin-empty__hint">
                  Last override reason: {asset.estimator_override_reason}
                </p>
              ) : null}

              {assetFiles.length ? (
                <>
                  <h4 className="admin-subheading">Asset attachments</h4>
                  <ul className="admin-list">
                    {assetFiles.map((file) => (
                      <li key={file.id}>
                        {file.signedUrl ? (
                          <a href={file.signedUrl} target="_blank" rel="noreferrer">
                            {file.file_name}
                          </a>
                        ) : (
                          file.file_name
                        )}{" "}
                        <span className="admin-muted">
                          ({file.category ?? "file"} ·{" "}
                          {new Date(file.created_at).toLocaleDateString("en-ZA")})
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {canManage ? (
                <div className="admin-asset-actions">
                  <form action={confirmRfqAssetAction} className="admin-stack-form">
                    <input type="hidden" name="assetId" value={asset.id} />
                    <input type="hidden" name="rfqId" value={asset.rfq_id} />
                    <textarea
                      name="notes"
                      className="form-input"
                      rows={2}
                      placeholder="Confirmation notes"
                      defaultValue={asset.estimator_notes ?? ""}
                    />
                    <button type="submit" className="btn btn--md btn--primary">
                      Confirm for quotation
                    </button>
                  </form>

                  <form action={overrideRfqAssetAction} className="admin-stack-form">
                    <input type="hidden" name="assetId" value={asset.id} />
                    <input type="hidden" name="rfqId" value={asset.rfq_id} />
                    <h4 className="admin-subheading">Estimator override</h4>
                    <p className="admin-empty__hint">
                      Original customer submission is never overwritten — a new
                      calculation snapshot is stored.
                    </p>
                    <input
                      name="reason"
                      className="form-input"
                      required
                      placeholder="Override reason (required)"
                    />
                    <select
                      name="measurementStatus"
                      className="form-input"
                      defaultValue={asset.measurement_status}
                    >
                      {ASSET_MEASUREMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="admin-inline-form">
                      <label>
                        Install m²
                        <input
                          name="confirmedInstallationAreaM2"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={
                            asset.confirmed_installation_area_m2 ??
                            String(out.installationAreaM2 ?? "")
                          }
                        />
                      </label>
                      <label>
                        Material m²
                        <input
                          name="confirmedMaterialAreaM2"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={
                            asset.confirmed_material_area_m2 ??
                            String(out.materialAreaM2 ?? "")
                          }
                        />
                      </label>
                      <label>
                        Geotextile m²
                        <input
                          name="confirmedGeotextileAreaM2"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={asset.confirmed_geotextile_area_m2 ?? ""}
                        />
                      </label>
                      <label>
                        Surface prep m²
                        <input
                          name="confirmedSurfacePrepAreaM2"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={asset.confirmed_surface_prep_area_m2 ?? ""}
                        />
                      </label>
                      <label>
                        Capacity kL
                        <input
                          name="confirmedCapacityKl"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={asset.confirmed_capacity_kl ?? ""}
                        />
                      </label>
                      <label>
                        Overlap %
                        <input
                          name="confirmedOverlapPercent"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={asset.confirmed_overlap_percent ?? ""}
                        />
                      </label>
                      <label>
                        Waste %
                        <input
                          name="confirmedWastePercent"
                          className="form-input"
                          type="number"
                          step="any"
                          defaultValue={asset.confirmed_waste_percent ?? ""}
                        />
                      </label>
                    </div>
                    <label className="admin-checkbox">
                      <input type="checkbox" name="recalculate" value="1" />
                      Recalculate from current raw inputs before applying overrides
                    </label>
                    <textarea
                      name="notes"
                      className="form-input"
                      rows={2}
                      placeholder="Estimator notes"
                    />
                    <div className="admin-panel__actions">
                      <button type="submit" className="btn btn--md btn--secondary">
                        Save override
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function fmt(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 2 }).format(n);
}
