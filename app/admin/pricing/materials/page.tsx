import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminButton,
  AdminFilterToolbar,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
} from "@/components/admin/ui";
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

      <AdminPanel title="Materials library">
        <AdminFilterToolbar>
          <form method="get" className="admin-filter-toolbar__form">
            <AdminSearchField
              name="q"
              placeholder="Search"
              defaultValue={q ?? ""}
              label="Search materials"
            />
            <AdminSelect name="category" defaultValue={category ?? ""} aria-label="Category">
              <option value="">All categories</option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="active" defaultValue={active ?? "1"} aria-label="Status">
              <option value="1">Active</option>
              <option value="0">Archived</option>
              <option value="all">All</option>
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Filter
            </AdminButton>
          </form>
        </AdminFilterToolbar>
      </AdminPanel>

      {canManage ? (
        <AdminPanel id="add-material" title="Add material">
          <form action={upsertMaterialAction} className="admin-form-grid">
            <AdminInput name="item_code" placeholder="Item code *" required />
            <AdminSelect name="category" required defaultValue="">
              <option value="" disabled>
                Category *
              </option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AdminSelect>
            <AdminInput name="name" placeholder="Name *" required />
            <AdminInput name="unit" placeholder="Unit" defaultValue="m2" />
            {canSeeCost ? (
              <AdminInput name="default_cost" placeholder="Default cost" />
            ) : null}
            <AdminInput name="default_sell_price" placeholder="Default sell" />
            <AdminInput name="waste_percent" placeholder="Waste %" defaultValue="10" />
            <AdminButton type="submit" variant="primary">
              Save material
            </AdminButton>
          </form>
        </AdminPanel>
      ) : null}

      <AdminPanel>
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
                          <AdminButton type="submit" variant="secondary" size="sm">
                            Archive
                          </AdminButton>
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
      </AdminPanel>
    </div>
  );
}
