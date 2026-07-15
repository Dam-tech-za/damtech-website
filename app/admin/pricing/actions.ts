"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

function escapeLike(term: string) {
  return term.replace(/[%_]/g, "\\$&");
}

function selectMaterialSearchFields() {
  return "id, item_code, category, name, description, unit, default_cost, default_sell_price, waste_percent, is_active, metadata, created_at, updated_at";
}

function selectLabourSearchFields() {
  return "id, item_code, category, name, unit, hourly_cost, unit_cost, productivity_rate, productivity_unit, is_active, notes, created_at, updated_at";
}

export async function searchMaterialItemsAction(q: string) {
  const admin = await assertAdmin({ permission: "manageQuotes" });
  const supabase = await createClient();
  const term = q.trim();
  let query = supabase
    .from("material_items")
    .select(selectMaterialSearchFields())
    .eq("is_active", true)
    .order("category")
    .order("name")
    .limit(20);

  if (term) {
    query = query.or(
      `name.ilike.%${escapeLike(term)}%,item_code.ilike.%${escapeLike(term)}%,description.ilike.%${escapeLike(term)}%,category.ilike.%${escapeLike(term)}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false as const, error: error.message, materials: [] as Array<Record<string, unknown>> };
  }

  const canSeeCost = admin.profile.role === "owner" || admin.profile.role === "admin" || admin.profile.role === "estimator";
  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
  return {
    ok: true as const,
    materials: rows.map((row) => ({
      ...row,
      default_cost: canSeeCost ? row.default_cost ?? null : null,
    })),
  };
}

export async function searchLabourItemsAction(q: string) {
  const admin = await assertAdmin({ permission: "manageQuotes" });
  const supabase = await createClient();
  const term = q.trim();
  let query = supabase
    .from("labour_items")
    .select(selectLabourSearchFields())
    .eq("is_active", true)
    .order("category")
    .order("name")
    .limit(20);

  if (term) {
    query = query.or(
      `name.ilike.%${escapeLike(term)}%,item_code.ilike.%${escapeLike(term)}%,category.ilike.%${escapeLike(term)}%,notes.ilike.%${escapeLike(term)}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false as const, error: error.message, labour: [] as Array<Record<string, unknown>> };
  }

  const canSeeCost = admin.profile.role === "owner" || admin.profile.role === "admin" || admin.profile.role === "estimator";
  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
  return {
    ok: true as const,
    labour: rows.map((row) => ({
      ...row,
      hourly_cost: canSeeCost ? row.hourly_cost ?? null : null,
      unit_cost: canSeeCost ? row.unit_cost ?? null : null,
    })),
  };
}

export async function getSupplierPricesForMaterialAction(materialItemId: string) {
  await assertAdmin({ permission: "viewCostPrices" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_prices")
    .select(
      "id, supplier_id, material_item_id, supplier_sku, unit_cost, currency, minimum_quantity, price_valid_from, price_valid_to, lead_time_days, is_preferred, quote_reference, notes, suppliers(name)",
    )
    .eq("material_item_id", materialItemId)
    .order("is_preferred", { ascending: false })
    .order("price_valid_to", { ascending: false, nullsFirst: false })
    .order("unit_cost");

  if (error) {
    return { ok: false as const, error: error.message, supplierPrices: [] as Array<Record<string, unknown>> };
  }

  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
  return {
    ok: true as const,
    supplierPrices: rows.map((row) => ({
      ...row,
      supplier_name:
        typeof row.suppliers === "object" && row.suppliers && "name" in row.suppliers
          ? (row.suppliers as { name?: string | null }).name ?? null
          : null,
      expired: row.price_valid_to ? new Date(`${row.price_valid_to}T23:59:59`).getTime() < Date.now() : false,
    })),
  };
}

export async function upsertMaterialAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  let id = String(formData.get("id") ?? "") || null;

  const payload = {
    item_code: String(formData.get("item_code") ?? "").trim().toUpperCase(),
    category: String(formData.get("category") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    unit: String(formData.get("unit") ?? "m2").trim(),
    default_cost: Number(formData.get("default_cost") ?? 0) || 0,
    default_sell_price: formData.get("default_sell_price")
      ? Number(formData.get("default_sell_price"))
      : null,
    waste_percent: Number(formData.get("waste_percent") ?? 0) || 0,
    is_active: String(formData.get("is_active") ?? "1") === "1",
  };

  if (!payload.item_code || !payload.name || !payload.category) return;

  if (id) {
    const { error } = await supabase.from("material_items").update(payload).eq("id", id);
    if (error) {
      console.error("[pricing] material update failed:", error.message);
      return;
    }
  } else {
    const { data, error } = await supabase
      .from("material_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      console.error("[pricing] material create failed:", error?.message);
      return;
    }
    id = data.id;
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "material_upserted",
    entityType: "material_item",
    entityId: id ?? undefined,
    afterData: payload,
  });

  revalidatePath("/admin/pricing/materials/");
}

export async function archiveMaterialAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "archivePricing" });
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("material_items")
    .update({ is_active: false })
    .eq("id", id);
  if (error) {
    console.error("[pricing] material archive failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "material_archived",
    entityType: "material_item",
    entityId: id,
  });
  revalidatePath("/admin/pricing/materials/");
}

export async function upsertLabourAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "") || null;
  const payload = {
    item_code: String(formData.get("item_code") ?? "").trim().toUpperCase(),
    category: String(formData.get("category") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    unit: String(formData.get("unit") ?? "hour").trim(),
    hourly_cost: formData.get("hourly_cost")
      ? Number(formData.get("hourly_cost"))
      : null,
    unit_cost: formData.get("unit_cost") ? Number(formData.get("unit_cost")) : null,
    productivity_rate: formData.get("productivity_rate")
      ? Number(formData.get("productivity_rate"))
      : null,
    productivity_unit: String(formData.get("productivity_unit") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    is_active: String(formData.get("is_active") ?? "1") === "1",
  };
  if (!payload.item_code || !payload.name || !payload.category) return;

  let entityId = id;
  if (id) {
    const { error } = await supabase.from("labour_items").update(payload).eq("id", id);
    if (error) {
      console.error("[pricing] labour update failed:", error.message);
      return;
    }
  } else {
    const { data, error } = await supabase
      .from("labour_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      console.error("[pricing] labour create failed:", error?.message);
      return;
    }
    entityId = data.id;
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "labour_upserted",
    entityType: "labour_item",
    entityId: entityId ?? undefined,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/labour/");
}

export async function upsertSupplierAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "") || null;
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    payment_terms: String(formData.get("payment_terms") ?? "").trim() || null,
    lead_time_days: formData.get("lead_time_days")
      ? Number(formData.get("lead_time_days"))
      : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    is_active: String(formData.get("is_active") ?? "1") === "1",
  };
  if (!payload.name) return;

  let entityId = id;
  if (id) {
    const { error } = await supabase.from("suppliers").update(payload).eq("id", id);
    if (error) {
      console.error("[pricing] supplier update failed:", error.message);
      return;
    }
  } else {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      console.error("[pricing] supplier create failed:", error?.message);
      return;
    }
    entityId = data.id;
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "supplier_upserted",
    entityType: "supplier",
    entityId: entityId ?? undefined,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/suppliers/");
}

export async function upsertSupplierPriceAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    supplier_id: String(formData.get("supplier_id") ?? ""),
    material_item_id: String(formData.get("material_item_id") ?? ""),
    supplier_sku: String(formData.get("supplier_sku") ?? "").trim() || null,
    unit_cost: Number(formData.get("unit_cost") ?? 0) || 0,
    currency: "ZAR",
    minimum_quantity: formData.get("minimum_quantity")
      ? Number(formData.get("minimum_quantity"))
      : null,
    price_valid_from: String(formData.get("price_valid_from") ?? "") || null,
    price_valid_to: String(formData.get("price_valid_to") ?? "") || null,
    lead_time_days: formData.get("lead_time_days")
      ? Number(formData.get("lead_time_days"))
      : null,
    is_preferred: String(formData.get("is_preferred") ?? "") === "1",
    quote_reference: String(formData.get("quote_reference") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
  if (!payload.supplier_id || !payload.material_item_id) return;

  const { data, error } = await supabase
    .from("supplier_prices")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    console.error("[pricing] supplier price create failed:", error?.message);
    return;
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "supplier_price_created",
    entityType: "supplier_price",
    entityId: data.id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/suppliers/");
}

export async function updateEstimatingSettingAction(
  formData: FormData,
): Promise<void> {
  const admin = await assertAdmin({ permission: "manageEstimatingSettings" });
  const key = String(formData.get("setting_key") ?? "").trim();
  const valueRaw = String(formData.get("setting_value") ?? "").trim();
  if (!key) return;

  let setting_value: unknown = valueRaw;
  try {
    setting_value = JSON.parse(valueRaw);
  } catch {
    setting_value = valueRaw;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("estimating_settings").upsert(
    {
      setting_key: key,
      setting_value,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "setting_key" },
  );
  if (error) {
    console.error("[pricing] setting update failed:", error.message);
    return;
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "estimating_setting_updated",
    entityType: "estimating_setting",
    afterData: { setting_key: key, setting_value },
  });
  revalidatePath("/admin/settings/estimating/");
  revalidatePath("/admin/pricing/travel/");
}
