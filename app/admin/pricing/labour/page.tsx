import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatZar } from "@/lib/estimating/money";
import { upsertLabourAction } from "../actions";

export default async function AdminLabourPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labour_items")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");

  return (
    <div className="admin-stack--page">
      <header className="admin-page-header">
        <div className="admin-page-header__copy">
          <h1 className="admin-page-header__title">Labour Pricing</h1>
          <p className="admin-page-header__description">
            Manage labour rates, productivity and installation costing.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Link href="/admin/pricing/" className="btn btn--md btn--secondary">Pricing hub</Link>
        </div>
      </header>

      {canManage ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h2>Add labour item</h2>
          </header>
          <form action={upsertLabourAction} className="admin-form-grid">
            <input name="item_code" className="form-input" placeholder="Code *" required />
            <input name="category" className="form-input" placeholder="Category *" required />
            <input name="name" className="form-input" placeholder="Name *" required />
            <input name="unit" className="form-input" defaultValue="hour" />
            {canSeeCost ? (
              <input name="hourly_cost" className="form-input" placeholder="Hourly cost" />
            ) : null}
            <input
              name="productivity_rate"
              className="form-input"
              placeholder="Productivity rate"
            />
            <input
              name="productivity_unit"
              className="form-input"
              placeholder="Productivity unit (e.g. m2/hour)"
            />
            <button type="submit" className="btn btn--md btn--primary">
              Save labour item
            </button>
          </form>
        </section>
      ) : null}

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Labour library</h2>
        </header>
        {error ? (
          <div className="admin-empty">
            <p>Unable to load labour items.</p>
            <p className="admin-empty__hint">{error.message}</p>
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="admin-empty">
            <p>No labour items yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Name</th>
                  <th>Unit</th>
                  {canSeeCost ? <th>Hourly</th> : null}
                  <th>Productivity</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.item_code}</td>
                    <td>{item.category}</td>
                    <td>{item.name}</td>
                    <td>{item.unit}</td>
                    {canSeeCost ? (
                      <td>
                        {item.hourly_cost != null
                          ? formatZar(Number(item.hourly_cost))
                          : "—"}
                      </td>
                    ) : null}
                    <td>
                      {item.productivity_rate ?? "—"}
                      {item.productivity_unit ? ` ${item.productivity_unit}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
