import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import {
  AdminButton,
  AdminEmptyState,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { calculateDeliveryCost, calculateTravelCost } from "@/lib/estimating/travel";
import { formatZar } from "@/lib/estimating/money";
import { updateEstimatingSettingAction } from "../actions";
import {
  upsertDeliveryRuleAction,
  upsertTravelOriginAction,
  upsertTravelVehicleAction,
} from "./travel-actions";

function settingNumber(
  rows: Array<{ setting_key: string; setting_value: unknown }> | null,
  key: string,
  fallback: number,
): number {
  const row = rows?.find((item) => item.setting_key === key);
  if (!row) return fallback;
  const value = row.setting_value;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value) || fallback;
  return fallback;
}

export default async function AdminTravelPricingPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const supabase = await createClient();

  const vehicleCostSelect =
    "id, vehicle_code, vehicle_name, vehicle_type, internal_cost_per_km, sell_rate_per_km, base_call_out, minimum_charge, trailer_surcharge, is_active";
  const vehicleSellSelect =
    "id, vehicle_code, vehicle_name, vehicle_type, sell_rate_per_km, base_call_out, minimum_charge, trailer_surcharge, is_active";

  const [{ data: settings }, vehiclesRes, originsRes, deliveryRes] =
    await Promise.all([
      supabase.from("estimating_settings").select("*"),
      canSeeCost
        ? supabase
            .from("travel_vehicles")
            .select(vehicleCostSelect)
            .eq("is_active", true)
            .order("vehicle_name")
        : supabase.rpc("get_travel_vehicles_sell"),
      supabase.from("travel_origins").select("*").eq("is_active", true).order("name"),
      supabase.from("delivery_rules").select("*").eq("is_active", true).order("name"),
    ]);

  type VehicleRow = {
    id: string;
    vehicle_code: string;
    vehicle_name: string;
    vehicle_type: string;
    internal_cost_per_km?: number | null;
    sell_rate_per_km: number;
    base_call_out: number;
    minimum_charge: number;
  };

  let vehicles = ((vehiclesRes.error ? [] : vehiclesRes.data) ?? []) as VehicleRow[];
  if (!canSeeCost && vehiclesRes.error) {
    const fallback = await supabase
      .from("travel_vehicles")
      .select(vehicleSellSelect as "*")
      .eq("is_active", true)
      .order("vehicle_name");
    vehicles = fallback.error
      ? []
      : ((fallback.data ?? []) as unknown as VehicleRow[]);
  }

  const origins = originsRes.error ? [] : originsRes.data;
  const deliveryRules = deliveryRes.error ? [] : deliveryRes.data;

  const travelRate = settingNumber(settings, "travel_rate_per_km", 8.5);
  const deliveryRate = settingNumber(settings, "delivery_rate_per_km", 12);
  const sampleTravel = calculateTravelCost({
    returnKm: 200,
    trips: 2,
    ratePerKm: travelRate,
  });
  const sampleDelivery = calculateDeliveryCost({
    supplierToSiteKm: 150,
    deliveries: 1,
    ratePerKm: deliveryRate,
  });

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Travel & Delivery"
        description="Vehicle rates, saved origins, delivery rules and travel assumptions used in quotations."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
      />

      <AdminPanel title="Default kilometre rates">
        <div className="admin-form-grid">
          {canManage ? (
            <>
              <form action={updateEstimatingSettingAction} className="admin-inline-form">
                <input type="hidden" name="setting_key" value="travel_rate_per_km" />
                <label>
                  Travel R/km
                  <AdminInput name="setting_value" defaultValue={String(travelRate)} />
                </label>
                <AdminButton type="submit" variant="primary">
                  Save
                </AdminButton>
              </form>
              <form action={updateEstimatingSettingAction} className="admin-inline-form">
                <input type="hidden" name="setting_key" value="delivery_rate_per_km" />
                <label>
                  Delivery R/km
                  <AdminInput name="setting_value" defaultValue={String(deliveryRate)} />
                </label>
                <AdminButton type="submit" variant="primary">
                  Save
                </AdminButton>
              </form>
            </>
          ) : (
            <p className="admin-help-text">
              Travel {formatZar(travelRate)}/km · Delivery {formatZar(deliveryRate)}/km
            </p>
          )}
        </div>
        <p className="admin-help-text">
          Sample: 200 km return × 2 trips = {formatZar(sampleTravel.total)}. Delivery 150 km × 1 ={" "}
          {formatZar(sampleDelivery.total)}. Return distance is never doubled again.
        </p>
      </AdminPanel>

      <AdminPanel title="Vehicle rates">
        {(vehicles ?? []).length === 0 ? (
          <AdminEmptyState
            title="No vehicle rates yet."
            description="Add bakkies, trucks and trailer configurations with sell rates per kilometre."
            compact
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  {canSeeCost ? <th>Internal R/km</th> : null}
                  <th>Sell R/km</th>
                  <th>Call-out</th>
                  <th>Minimum</th>
                </tr>
              </thead>
              <tbody>
                {(vehicles ?? []).map((v) => (
                  <tr key={v.id}>
                    <td>{v.vehicle_code}</td>
                    <td>{v.vehicle_name}</td>
                    <td>{v.vehicle_type}</td>
                    {canSeeCost ? (
                      <td>
                        {v.internal_cost_per_km != null
                          ? formatZar(Number(v.internal_cost_per_km))
                          : "—"}
                      </td>
                    ) : null}
                    <td>{formatZar(Number(v.sell_rate_per_km))}</td>
                    <td>{formatZar(Number(v.base_call_out))}</td>
                    <td>{formatZar(Number(v.minimum_charge))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canManage ? (
          <form action={upsertTravelVehicleAction} className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <AdminInput name="vehicle_code" placeholder="Code *" required />
            <AdminInput name="vehicle_name" placeholder="Name *" required />
            <AdminSelect name="vehicle_type" defaultValue="Bakkie">
              <option>Light vehicle</option>
              <option>Bakkie</option>
              <option>Bakkie with trailer</option>
              <option>Delivery truck</option>
              <option>Heavy truck</option>
              <option>Other</option>
            </AdminSelect>
            {canSeeCost ? (
              <AdminInput name="internal_cost_per_km" placeholder="Internal R/km" />
            ) : null}
            <AdminInput name="sell_rate_per_km" placeholder="Sell R/km *" required />
            <AdminInput name="base_call_out" placeholder="Call-out" />
            <AdminInput name="minimum_charge" placeholder="Minimum" />
            <AdminButton type="submit" variant="primary">
              Add vehicle
            </AdminButton>
          </form>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Saved origins">
        {(origins ?? []).length === 0 ? (
          <AdminEmptyState title="No origins saved." compact />
        ) : (
          <ul className="admin-list">
            {(origins ?? []).map((o) => (
              <li key={o.id}>
                <strong>{o.name}</strong>
                {o.province ? ` · ${o.province}` : ""}
                {o.default_for_region ? ` · default for ${o.default_for_region}` : ""}
              </li>
            ))}
          </ul>
        )}
        {canManage ? (
          <form action={upsertTravelOriginAction} className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <AdminInput name="name" placeholder="Origin name *" required />
            <AdminInput name="province" placeholder="Province" />
            <AdminInput name="address" placeholder="Address" />
            <AdminInput name="default_for_region" placeholder="Default for region" />
            <AdminButton type="submit" variant="primary">
              Add origin
            </AdminButton>
          </form>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Delivery methods">
        {(deliveryRules ?? []).length === 0 ? (
          <AdminEmptyState title="No delivery rules yet." compact />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Method</th>
                  <th>Rate</th>
                  <th>Minimum</th>
                </tr>
              </thead>
              <tbody>
                {(deliveryRules ?? []).map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.code}</td>
                    <td>{rule.name}</td>
                    <td>{rule.calculation_method}</td>
                    <td>
                      {rule.calculation_method === "fixed"
                        ? formatZar(Number(rule.fixed_amount ?? 0))
                        : rule.calculation_method === "per_load"
                          ? formatZar(Number(rule.rate_per_load ?? 0))
                          : formatZar(Number(rule.rate_per_km ?? 0))}
                    </td>
                    <td>{formatZar(Number(rule.minimum_charge))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canManage ? (
          <form action={upsertDeliveryRuleAction} className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <AdminInput name="code" placeholder="Code *" required />
            <AdminInput name="name" placeholder="Name *" required />
            <AdminSelect name="calculation_method" defaultValue="per_km">
              <option value="fixed">Fixed</option>
              <option value="per_km">Per km</option>
              <option value="per_load">Per load</option>
              <option value="supplier_direct">Supplier direct</option>
              <option value="manual">Manual</option>
            </AdminSelect>
            <AdminInput name="rate_per_km" placeholder="R/km" />
            <AdminInput name="fixed_amount" placeholder="Fixed amount" />
            <AdminInput name="minimum_charge" placeholder="Minimum" />
            <AdminButton type="submit" variant="primary">
              Add delivery rule
            </AdminButton>
          </form>
        ) : null}
      </AdminPanel>
    </div>
  );
}
