import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import {
  AdminButton,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { formatZar } from "@/lib/estimating/money";
import { synchroniseLabourCatalogueAction, upsertLabourAction } from "../actions";
import { LabourSyncButton } from "@/components/admin/pricing/LabourSyncButton";
import {
  upsertCrewAction,
  upsertCrewMemberAction,
} from "./crew-actions";

export default async function AdminLabourPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const canSync =
    admin.profile.role === "owner" || admin.profile.role === "admin";
  const supabase = await createClient();

  const labourSelect = canSeeCost
    ? "id, item_code, category, name, unit, hourly_cost, unit_cost, daily_cost, sell_rate, burden_percent, overtime_multiplier, productivity_rate, productivity_unit, notes, is_active, pricing_item_id"
    : "id, item_code, category, name, unit, sell_rate, productivity_rate, productivity_unit, notes, is_active, pricing_item_id";

  const [{ data: labourData, error }, crewsRes, membersRes] = await Promise.all([
    canSeeCost
      ? supabase.from("labour_items").select(labourSelect as "*").eq("is_active", true).order("category").order("name")
      : supabase.rpc("get_labour_roles_sell"),
    supabase.from("labour_crews").select("*").eq("is_active", true).order("name"),
    canSeeCost
      ? supabase
          .from("labour_crew_members")
          .select("id, crew_id, labour_item_id, quantity, labour_items(name, hourly_cost, burden_percent)")
      : Promise.resolve({ data: [], error: null }),
  ]);

  let data = (labourData ?? null) as Array<Record<string, unknown>> | null;
  let loadError = error?.message;
  if (!canSeeCost && error) {
    const fallback = await supabase
      .from("labour_items")
      .select(labourSelect as "*")
      .eq("is_active", true)
      .order("category")
      .order("name");
    if (!fallback.error) {
      data = (fallback.data ?? []) as unknown as Array<Record<string, unknown>>;
      loadError = undefined;
    } else {
      loadError = fallback.error.message;
    }
  } else if (labourData) {
    data = labourData as unknown as Array<Record<string, unknown>>;
  }

  const crews = crewsRes.error ? [] : crewsRes.data;
  const members = membersRes.error ? [] : membersRes.data;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Labour & Crews"
        description="Roles, burdened rates, productivity and crew templates for installation costing."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
        primaryActionNode={
          canSync ? <LabourSyncButton action={synchroniseLabourCatalogueAction} /> : undefined
        }
      />

      <AdminPanel title="Summary">
        <dl className="admin-dl admin-metric-strip--inline">
          <div>
            <dt>Active roles</dt>
            <dd>{(data ?? []).length}</dd>
          </div>
          <div>
            <dt>Crew templates</dt>
            <dd>{(crews ?? []).length}</dd>
          </div>
          <div>
            <dt>Linked to catalogue</dt>
            <dd>{(data ?? []).filter((row) => row.pricing_item_id).length}</dd>
          </div>
        </dl>
      </AdminPanel>

      {canManage ? (
        <AdminPanel title="Add labour role">
          <form action={upsertLabourAction} className="admin-form-grid">
            <AdminInput name="item_code" placeholder="Code *" required />
            <AdminInput name="category" placeholder="Category *" required />
            <AdminInput name="name" placeholder="Role name *" required />
            <AdminInput name="unit" defaultValue="hour" />
            {canSeeCost ? (
              <>
                <AdminInput name="hourly_cost" placeholder="Hourly cost" />
                <AdminInput name="burden_percent" placeholder="Burden %" defaultValue="0" />
                <AdminInput name="daily_cost" placeholder="Daily cost" />
                <AdminInput name="sell_rate" placeholder="Sell rate" />
              </>
            ) : null}
            <AdminInput name="productivity_rate" placeholder="Productivity rate" />
            <AdminInput name="productivity_unit" placeholder="e.g. m²/hour" />
            <AdminButton type="submit" variant="primary">
              Save labour role
            </AdminButton>
          </form>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Labour roles">
        {loadError ? (
          <AdminEmptyState title="Unable to load labour items." description={loadError} />
        ) : (data ?? []).length === 0 ? (
          <AdminEmptyState title="No labour roles yet." />
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
                  {canSeeCost ? <th>Burden %</th> : null}
                  <th>Productivity</th>
                  <th>Catalogue</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((item) => (
                  <tr key={String(item.id)}>
                    <td>{String(item.item_code ?? "")}</td>
                    <td>{String(item.category ?? "")}</td>
                    <td>{String(item.name ?? "")}</td>
                    <td>{String(item.unit ?? "")}</td>
                    {canSeeCost ? (
                      <td>
                        {item.hourly_cost != null
                          ? formatZar(Number(item.hourly_cost))
                          : "—"}
                      </td>
                    ) : null}
                    {canSeeCost ? <td>{Number(item.burden_percent ?? 0)}</td> : null}
                    <td>
                      {item.productivity_rate != null ? String(item.productivity_rate) : "—"}
                      {item.productivity_unit ? ` ${String(item.productivity_unit)}` : ""}
                    </td>
                    <td>{item.pricing_item_id ? "Linked" : "Pending sync"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="Crew templates">
        {(crews ?? []).length === 0 ? (
          <AdminEmptyState
            title="No crew templates yet."
            description="Create crews such as HDPE Installation Crew with role quantities and productivity."
            compact
          />
        ) : (
          <ul className="admin-list">
            {(crews ?? []).map((crew) => {
              const crewMembers = (members ?? []).filter((m) => m.crew_id === crew.id);
              return (
                <li key={crew.id}>
                  <strong>{crew.name}</strong> ({crew.code})
                  {crew.productivity_rate
                    ? ` · ${crew.productivity_rate} ${crew.productivity_unit ?? ""}`
                    : ""}
                  <ul>
                    {crewMembers.map((member) => {
                      const labour = member.labour_items as
                        | { name?: string; hourly_cost?: number | null }
                        | null
                        | Array<{ name?: string }>;
                      const name = Array.isArray(labour)
                        ? labour[0]?.name
                        : labour?.name;
                      return (
                        <li key={member.id}>
                          {member.quantity} × {name ?? member.labour_item_id}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        {canManage ? (
          <div className="admin-stack" style={{ marginTop: "1rem" }}>
            <form action={upsertCrewAction} className="admin-form-grid">
              <AdminInput name="code" placeholder="Crew code *" required />
              <AdminInput name="name" placeholder="Crew name *" required />
              <AdminInput name="productivity_rate" placeholder="Productivity rate" />
              <AdminInput name="productivity_unit" placeholder="m²/hour" />
              <AdminInput name="minimum_hours" placeholder="Minimum hours" />
              <AdminButton type="submit" variant="primary">
                Save crew
              </AdminButton>
            </form>
            {(crews ?? []).length > 0 && (data ?? []).length > 0 ? (
              <form action={upsertCrewMemberAction} className="admin-form-grid">
                <select name="crew_id" className="admin-input" required defaultValue="">
                  <option value="" disabled>
                    Select crew
                  </option>
                  {(crews ?? []).map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.name}
                    </option>
                  ))}
                </select>
                <select name="labour_item_id" className="admin-input" required defaultValue="">
                  <option value="" disabled>
                    Select role
                  </option>
                  {(data ?? []).map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {String(item.name ?? "")}
                    </option>
                  ))}
                </select>
                <AdminInput name="quantity" type="number" step="0.5" defaultValue="1" />
                <AdminButton type="submit" variant="secondary">
                  Add crew member
                </AdminButton>
              </form>
            ) : null}
          </div>
        ) : null}
      </AdminPanel>
    </div>
  );
}
