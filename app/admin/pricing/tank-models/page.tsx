import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { canPerform } from "@/lib/auth/permissions";

export default async function AdminTankModelsPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const supabase = await createClient();
  const canManage = canPerform(admin.profile.role, "managePricing");

  const { data: models } = await supabase
    .from("tank_models")
    .select("*")
    .order("nominal_capacity_kl");

  return (
    <div className="admin-panel">
      <header className="admin-panel__header admin-panel__header--row">
        <div>
          <h2>Tank models</h2>
          <p className="admin-empty__hint">
            Do not invent Damtech tank sizes. Load real supplier catalogue data
            before matching RFQs.
          </p>
        </div>
        <Link className="btn btn--md btn--secondary" href="/admin/pricing/">
          Pricing hub
        </Link>
      </header>

      {(models ?? []).length === 0 ? (
        <div className="admin-empty">
          <p>No tank models loaded.</p>
          <p className="admin-empty__hint">
            Public RFQs will calculate theoretical capacity and mark catalogue
            match as unavailable until rows exist in <code>tank_models</code>.
            {canManage
              ? " Insert manufacturer models via Supabase when supplier data is available."
              : ""}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Nominal kL</th>
                <th>Usable kL</th>
                <th>Ø m</th>
                <th>Height m</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {(models ?? []).map((model) => (
                <tr key={model.id}>
                  <td>{model.model_code}</td>
                  <td>{model.model_name ?? "—"}</td>
                  <td>{model.nominal_capacity_kl}</td>
                  <td>{model.usable_capacity_kl ?? "—"}</td>
                  <td>{model.internal_diameter_m}</td>
                  <td>{model.shell_height_m}</td>
                  <td>{model.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
