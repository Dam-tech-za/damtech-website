import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
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
      <AdminPageHeader
        title="Labour Pricing"
        description="Manage labour rates, productivity and installation costing."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing hub" }}
      />

      {canManage ? (
        <AdminPanel title="Add labour item">
          <form action={upsertLabourAction} className="admin-form-grid">
            <AdminInput name="item_code" placeholder="Code *" required />
            <AdminInput name="category" placeholder="Category *" required />
            <AdminInput name="name" placeholder="Name *" required />
            <AdminInput name="unit" defaultValue="hour" />
            {canSeeCost ? (
              <AdminInput name="hourly_cost" placeholder="Hourly cost" />
            ) : null}
            <AdminInput
              name="productivity_rate"
              placeholder="Productivity rate"
            />
            <AdminInput
              name="productivity_unit"
              placeholder="Productivity unit (e.g. m2/hour)"
            />
            <AdminButton type="submit" variant="primary">
              Save labour item
            </AdminButton>
          </form>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Labour library">
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
      </AdminPanel>
    </div>
  );
}
