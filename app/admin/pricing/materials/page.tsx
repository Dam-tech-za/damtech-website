import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatZar } from "@/lib/estimating/money";
import { archiveMaterialAction, upsertMaterialAction } from "../actions";

const MATERIAL_CATEGORIES = [
  "HDPE geomembrane",
  "PVC liner",
  "Dortom liner",
  "Geotextile",
  "Welding consumables",
  "Anchor trench",
  "Pipework",
  "Fittings",
  "Corrugated steel reservoir components",
  "Bitumen waterproofing",
  "Fasteners",
  "Sealants",
  "Transport packaging",
  "Miscellaneous",
];

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; active?: string }>;
};

export default async function AdminMaterialsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const { q, category, active } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("material_items")
    .select("*")
    .order("category")
    .order("name")
    .limit(200);
  if (q?.trim()) query = query.or(`name.ilike.%${q.trim()}%,item_code.ilike.%${q.trim()}%`);
  if (category) query = query.eq("category", category);
  if (active === "0") query = query.eq("is_active", false);
  else if (active !== "all") query = query.eq("is_active", true);

  const { data, error } = await query;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Material Pricing"
        description="Manage material costs, selling prices and supplier-linked pricing."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing hub" }}
        primaryAction={
          canManage ? { href: "#add-material", label: "Add Material" } : undefined
        }
      />

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Materials library</h2>
        </header>
        <form method="get" className="admin-filters">
          <input name="q" className="form-input" placeholder="Search" defaultValue={q ?? ""} />
          <select name="category" className="form-input" defaultValue={category ?? ""}>
            <option value="">All categories</option>
            {MATERIAL_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="active" className="form-input" defaultValue={active ?? "1"}>
            <option value="1">Active</option>
            <option value="0">Archived</option>
            <option value="all">All</option>
          </select>
          <button className="btn btn--md btn--primary" type="submit">
            Filter
          </button>
        </form>
      </section>

      {canManage ? (
        <section className="admin-panel" id="add-material">
          <header className="admin-panel__header">
            <h2>Add material</h2>
          </header>
          <form action={upsertMaterialAction} className="admin-form-grid">
            <input name="item_code" className="form-input" placeholder="Item code *" required />
            <select name="category" className="form-input" required defaultValue="">
              <option value="" disabled>
                Category *
              </option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input name="name" className="form-input" placeholder="Name *" required />
            <input name="unit" className="form-input" placeholder="Unit" defaultValue="m2" />
            {canSeeCost ? (
              <input name="default_cost" className="form-input" placeholder="Default cost" />
            ) : null}
            <input name="default_sell_price" className="form-input" placeholder="Default sell" />
            <input name="waste_percent" className="form-input" placeholder="Waste %" defaultValue="10" />
            <button type="submit" className="btn btn--md btn--primary">
              Save material
            </button>
          </form>
        </section>
      ) : null}

      <section className="admin-panel">
        {error ? (
          <div className="admin-empty">
            <p>Unable to load materials.</p>
            <p className="admin-empty__hint">{error.message}</p>
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="admin-empty">
            <p>No materials yet.</p>
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
                  {canSeeCost ? <th>Cost</th> : null}
                  <th>Sell</th>
                  <th>Waste %</th>
                  <th>Status</th>
                  {canManage ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.item_code}</td>
                    <td>{item.category}</td>
                    <td>{item.name}</td>
                    <td>{item.unit}</td>
                    {canSeeCost ? <td>{formatZar(Number(item.default_cost))}</td> : null}
                    <td>
                      {item.default_sell_price != null
                        ? formatZar(Number(item.default_sell_price))
                        : "—"}
                    </td>
                    <td>{item.waste_percent}</td>
                    <td>{item.is_active ? "Active" : "Archived"}</td>
                    {canManage && item.is_active ? (
                      <td>
                        <form action={archiveMaterialAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="btn btn--md btn--secondary">
                            Archive
                          </button>
                        </form>
                      </td>
                    ) : canManage ? (
                      <td />
                    ) : null}
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
