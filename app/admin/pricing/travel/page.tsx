import { requireAdmin } from "@/lib/auth/require-admin";
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
    <div className="admin-stack">
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Travel & delivery rates</h2>
        </header>
        <div className="admin-form-grid">
          <form action={updateEstimatingSettingAction} className="admin-inline-form">
            <input type="hidden" name="setting_key" value="travel_rate_per_km" />
            <label>
              Travel R/km
              <input
                name="setting_value"
                className="form-input"
                defaultValue={String(travelRate)}
              />
            </label>
            <button type="submit" className="btn btn--md btn--primary">
              Save travel rate
            </button>
          </form>
          <form action={updateEstimatingSettingAction} className="admin-inline-form">
            <input type="hidden" name="setting_key" value="delivery_rate_per_km" />
            <label>
              Delivery R/km
              <input
                name="setting_value"
                className="form-input"
                defaultValue={String(deliveryRate)}
              />
            </label>
            <button type="submit" className="btn btn--md btn--primary">
              Save delivery rate
            </button>
          </form>
        </div>
        <p className="admin-empty__hint">
          distance_cost = return_km × trips × rate_per_km. Sample 200 km return × 2
          trips = {formatZar(sampleTravel.total)}. Sample delivery 150 km × 1 ={" "}
          {formatZar(sampleDelivery.total)}.
        </p>
      </section>
    </div>
  );
}
