import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatZar } from "@/lib/estimating/money";
import { upsertSupplierAction, upsertSupplierPriceAction } from "../actions";

export default async function AdminSuppliersPricingPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const supabase = await createClient();

  const [{ data: suppliers }, { data: materials }, { data: prices }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("is_active", true).order("name"),
    supabase
      .from("material_items")
      .select("id, item_code, name")
      .eq("is_active", true)
      .order("item_code"),
    canSeeCost
      ? supabase
          .from("supplier_prices")
          .select(
            "id, unit_cost, price_valid_to, is_preferred, lead_time_days, supplier_id, material_item_id, suppliers(name), material_items(item_code, name)",
          )
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Suppliers"
        description="Manage supplier contacts, pricing and lead times."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing hub" }}
        primaryAction={
          canManage ? { href: "#add-supplier", label: "Add Supplier" } : undefined
        }
      />

      <div className="admin-stack">
      {canManage ? (
        <>
          <section className="admin-panel" id="add-supplier">
            <header className="admin-panel__header">
              <h2>Add supplier</h2>
            </header>
            <form action={upsertSupplierAction} className="admin-form-grid">
              <input name="name" className="form-input" placeholder="Supplier name *" required />
              <input name="contact_name" className="form-input" placeholder="Contact" />
              <input name="email" className="form-input" placeholder="Email" />
              <input name="phone" className="form-input" placeholder="Phone" />
              <input name="lead_time_days" className="form-input" placeholder="Lead time days" />
              <button type="submit" className="btn btn--md btn--primary">
                Save supplier
              </button>
            </form>
          </section>

          {canSeeCost ? (
            <section className="admin-panel">
              <header className="admin-panel__header">
                <h2>Add supplier price</h2>
              </header>
              <form action={upsertSupplierPriceAction} className="admin-form-grid">
                <select name="supplier_id" className="form-input" required defaultValue="">
                  <option value="" disabled>
                    Supplier *
                  </option>
                  {(suppliers ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <select name="material_item_id" className="form-input" required defaultValue="">
                  <option value="" disabled>
                    Material *
                  </option>
                  {(materials ?? []).map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.item_code} — {material.name}
                    </option>
                  ))}
                </select>
                <input name="unit_cost" className="form-input" placeholder="Unit cost *" required />
                <input name="price_valid_from" type="date" className="form-input" />
                <input name="price_valid_to" type="date" className="form-input" />
                <input name="lead_time_days" className="form-input" placeholder="Lead time days" />
                <label className="admin-checkbox">
                  <input type="checkbox" name="is_preferred" value="1" /> Preferred
                </label>
                <button type="submit" className="btn btn--md btn--primary">
                  Save price
                </button>
              </form>
            </section>
          ) : null}
        </>
      ) : null}

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Suppliers</h2>
        </header>
        {(suppliers ?? []).length === 0 ? (
          <div className="admin-empty">
            <p>No suppliers yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Lead time</th>
                </tr>
              </thead>
              <tbody>
                {(suppliers ?? []).map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.contact_name ?? "—"}</td>
                    <td>{supplier.email ?? "—"}</td>
                    <td>{supplier.phone ?? "—"}</td>
                    <td>{supplier.lead_time_days ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canSeeCost ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Recent supplier prices</h2>
            <p className="admin-empty__hint">
              Estimators should compare lowest valid, preferred and most recent
              prices — cheapest is not auto-selected.
            </p>
          </header>
          {(prices ?? []).length === 0 ? (
            <div className="admin-empty">
              <p>No supplier prices yet.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Material</th>
                    <th>Unit cost</th>
                    <th>Valid to</th>
                    <th>Lead time</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {(prices ?? []).map((price) => {
                    const expired =
                      price.price_valid_to && String(price.price_valid_to) < today;
                    const supplierName =
                      (price.suppliers as { name?: string } | null)?.name ?? "—";
                    const material = price.material_items as {
                      item_code?: string;
                      name?: string;
                    } | null;
                    return (
                      <tr key={price.id}>
                        <td>{supplierName}</td>
                        <td>
                          {material?.item_code} {material?.name}
                        </td>
                        <td>{formatZar(Number(price.unit_cost))}</td>
                        <td>
                          {price.price_valid_to ?? "—"}
                          {expired ? (
                            <span className="admin-status admin-status--spam"> expired</span>
                          ) : null}
                        </td>
                        <td>{price.lead_time_days ?? "—"}</td>
                        <td>{price.is_preferred ? "Preferred" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="admin-panel">
          <div className="admin-empty">
            <p>Supplier cost prices are hidden for your role.</p>
            <p className="admin-empty__hint">
              Sales can use approved sell prices; cost visibility is restricted to
              owner/admin/estimator.
            </p>
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
