"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

export async function upsertTravelVehicleAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    vehicle_code: String(formData.get("vehicle_code") ?? "").trim().toUpperCase(),
    vehicle_name: String(formData.get("vehicle_name") ?? "").trim(),
    vehicle_type: String(formData.get("vehicle_type") ?? "Other").trim(),
    internal_cost_per_km: formData.get("internal_cost_per_km")
      ? Number(formData.get("internal_cost_per_km"))
      : null,
    sell_rate_per_km: Number(formData.get("sell_rate_per_km") ?? 0) || 0,
    base_call_out: Number(formData.get("base_call_out") ?? 0) || 0,
    minimum_charge: Number(formData.get("minimum_charge") ?? 0) || 0,
    trailer_surcharge: Number(formData.get("trailer_surcharge") ?? 0) || 0,
    is_active: true,
  };
  if (!payload.vehicle_code || !payload.vehicle_name) return;

  const { data, error } = await supabase
    .from("travel_vehicles")
    .upsert(payload, { onConflict: "vehicle_code" })
    .select("id")
    .single();
  if (error) {
    console.error("[pricing] vehicle upsert failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "travel_vehicle_upserted",
    entityType: "travel_vehicle",
    entityId: data?.id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/travel/");
}

export async function upsertTravelOriginAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
    province: String(formData.get("province") ?? "").trim() || null,
    default_for_region: String(formData.get("default_for_region") ?? "").trim() || null,
    is_active: true,
  };
  if (!payload.name) return;
  const { data, error } = await supabase
    .from("travel_origins")
    .upsert(payload, { onConflict: "name" })
    .select("id")
    .single();
  if (error) {
    console.error("[pricing] origin upsert failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "travel_origin_upserted",
    entityType: "travel_origin",
    entityId: data?.id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/travel/");
}

export async function upsertDeliveryRuleAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    delivery_type: "delivery",
    calculation_method: String(formData.get("calculation_method") ?? "per_km"),
    fixed_amount: formData.get("fixed_amount")
      ? Number(formData.get("fixed_amount"))
      : null,
    rate_per_km: formData.get("rate_per_km")
      ? Number(formData.get("rate_per_km"))
      : null,
    rate_per_load: formData.get("rate_per_load")
      ? Number(formData.get("rate_per_load"))
      : null,
    minimum_charge: Number(formData.get("minimum_charge") ?? 0) || 0,
    is_active: true,
  };
  if (!payload.code || !payload.name) return;
  const { data, error } = await supabase
    .from("delivery_rules")
    .upsert(payload, { onConflict: "code" })
    .select("id")
    .single();
  if (error) {
    console.error("[pricing] delivery rule upsert failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "delivery_rule_upserted",
    entityType: "delivery_rule",
    entityId: data?.id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/travel/");
}
