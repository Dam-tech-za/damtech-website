import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { calculateDeliveryCost, calculateTravelCost } from "@/lib/estimating/travel";
import { formatZar } from "@/lib/estimating/money";
import { updateEstimatingSettingAction } from "../actions";

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
  await requireAdmin({ permission: "manageEstimatingSettings" });
  const supabase = await createClient();
  const { data: settings } = await supabase.from("estimating_settings").select("*");

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
        description="Manage vehicle, distance and delivery costing assumptions."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing hub" }}
      />

      <div className="admin-stack">
      <AdminPanel title="Travel & delivery rates">
        <div className="admin-form-grid">
          <form action={updateEstimatingSettingAction} className="admin-inline-form">
            <input type="hidden" name="setting_key" value="travel_rate_per_km" />
            <label>
              Travel R/km
              <AdminInput
                name="setting_value"
                defaultValue={String(travelRate)}
              />
            </label>
            <AdminButton type="submit" variant="primary">
              Save travel rate
            </AdminButton>
          </form>
          <form action={updateEstimatingSettingAction} className="admin-inline-form">
            <input type="hidden" name="setting_key" value="delivery_rate_per_km" />
            <label>
              Delivery R/km
              <AdminInput
                name="setting_value"
                defaultValue={String(deliveryRate)}
              />
            </label>
            <AdminButton type="submit" variant="primary">
              Save delivery rate
            </AdminButton>
          </form>
        </div>
        <p className="admin-empty__hint">
          distance_cost = return_km × trips × rate_per_km. Sample 200 km return × 2
          trips = {formatZar(sampleTravel.total)}. Sample delivery 150 km × 1 ={" "}
          {formatZar(sampleDelivery.total)}.
        </p>
      </AdminPanel>
      </div>
    </div>
  );
}
