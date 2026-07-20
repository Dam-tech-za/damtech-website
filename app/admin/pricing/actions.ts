"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { searchPricingItems } from "@/lib/pricing/get-pricing-items";
import { syncPricingItemFromMaterial } from "@/lib/pricing/sync";
import {
  reconcileLabourCatalogue,
  syncPricingItemFromLabour,
  type LabourRow,
} from "@/lib/pricing/sync-labour-item";
import { maskPricingItemsForRole } from "@/lib/pricing/security";
import type { PricingItemType } from "@/lib/pricing/types";
import {
  detectMaterialCategoryKind,
  validateMaterialTechnical,
} from "@/lib/pricing/material-schemas";

function escapeLike(term: string) {
  return term.replace(/[%_]/g, "\\$&");
}

function selectMaterialSearchFields() {
  return "id, item_code, category, name, description, unit, default_cost, default_sell_price, waste_percent, is_active, metadata, created_at, updated_at";
}

function selectLabourSearchFields() {
  return "id, item_code, category, name, unit, hourly_cost, unit_cost, productivity_rate, productivity_unit, is_active, notes, created_at, updated_at";
}

export async function searchPricingItemsAction(q: string, itemType?: string) {
  const admin = await assertAdmin({ permission: "manageQuotes" });
  const result = await searchPricingItems({
    q,
    itemType: itemType ? (itemType as PricingItemType) : undefined,
    active: true,
    limit: 40,
    role: admin.profile.role,
  });

  if (!result.ok) {
    const [materials, labour] = await Promise.all([
      searchMaterialItemsAction(q),
      searchLabourItemsAction(q),
    ]);
    const legacyItems = [
      ...(materials.ok ? materials.materials : []),
      ...(labour.ok ? labour.labour : []),
    ].map((row) => legacyRowToPricingItem(row));
    return {
      ok: true as const,
      items: maskPricingItemsForRole(legacyItems, admin.profile.role),
    };
  }

  return {
    ok: true as const,
    items: maskPricingItemsForRole(result.items, admin.profile.role),
  };
}

function legacyRowToPricingItem(row: Record<string, unknown>) {
  const isLabour = row.hourly_cost != null || row.unit_cost != null;
  return {
    id: String(row.id),
    itemCode: String(row.item_code),
    itemType: isLabour ? ("labour" as const) : ("material" as const),
    category: String(row.category),
    name: String(row.name),
    shortDescription: null,
    quoteDescription: String(row.description ?? row.name),
    purchaseUnit: String(row.unit),
    quoteUnit: String(row.unit === "m2" ? "m²" : row.unit),
    conversionFactor: 1,
    defaultCost:
      row.default_cost != null
        ? Number(row.default_cost)
        : row.unit_cost != null
          ? Number(row.unit_cost)
          : row.hourly_cost != null
            ? Number(row.hourly_cost)
            : null,
    defaultSellPrice:
      row.default_sell_price != null ? Number(row.default_sell_price) : null,
    pricingMethod: "unit_rate" as const,
    defaultMarkupPercent: null,
    targetMarginPercent: null,
    minimumSellPrice: null,
    taxCategory: "standard" as const,
    wastePercent: Number(row.waste_percent ?? 0),
    overlapPercent: 0,
    coverageRate: null,
    coverageUnit: null,
    productivityRate:
      row.productivity_rate != null ? Number(row.productivity_rate) : null,
    productivityUnit: (row.productivity_unit as string | null) ?? null,
    priceValidFrom: null,
    priceValidTo: null,
    isActive: Boolean(row.is_active ?? true),
    requiresManualQuantityConfirmation: false,
    metadata: {},
    legacyMaterialItemId: isLabour ? null : String(row.id),
    legacyLabourItemId: isLabour ? String(row.id) : null,
    legacyTankModelId: null,
    supplierName: null,
    priceStatus: "current" as const,
  };
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

  const category = String(formData.get("category") ?? "").trim();
  const technicalRaw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("tech_")) continue;
    const field = key.slice(5);
    const asNumber = Number(value);
    technicalRaw[field] =
      typeof value === "string" && value.trim() !== "" && Number.isFinite(asNumber) && !Number.isNaN(asNumber)
        ? asNumber
        : String(value);
  }

  const kind = detectMaterialCategoryKind(category);
  if (Object.keys(technicalRaw).length) {
    const validated = validateMaterialTechnical(kind, technicalRaw);
    if (!validated.ok) {
      console.error("[pricing] material technical validation failed:", validated.error);
      return;
    }
    Object.assign(technicalRaw, validated.data);
  }

  const rollWidth = Number(technicalRaw.rollWidthM ?? 0);
  const rollLength = Number(technicalRaw.rollLengthM ?? 0);
  if (rollWidth > 0 && rollLength > 0 && technicalRaw.grossRollAreaM2 == null) {
    technicalRaw.grossRollAreaM2 = Math.round(rollWidth * rollLength * 100) / 100;
  }

  const payload = {
    item_code: String(formData.get("item_code") ?? "").trim().toUpperCase(),
    category,
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    unit: String(formData.get("unit") ?? "m²").trim(),
    default_cost: Number(formData.get("default_cost") ?? 0) || 0,
    default_sell_price: formData.get("default_sell_price")
      ? Number(formData.get("default_sell_price"))
      : null,
    waste_percent: Number(formData.get("waste_percent") ?? 0) || 0,
    is_active: String(formData.get("is_active") ?? "1") === "1",
    metadata: {
      purchase_unit: String(formData.get("purchase_unit") ?? "").trim() || null,
      overlap_percent: Number(formData.get("overlap_percent") ?? 0) || 0,
      conversion_factor: Number(formData.get("conversion_factor") ?? 1) || 1,
      technical: technicalRaw,
      categoryKind: kind,
    },
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

  const { data: savedMaterial } = await supabase
    .from("material_items")
    .select("*")
    .eq("id", id!)
    .single();

  if (savedMaterial) {
    await syncPricingItemFromMaterial(supabase, savedMaterial as Parameters<typeof syncPricingItemFromMaterial>[1], {
      purchaseUnit: String(formData.get("purchase_unit") ?? "").trim() || undefined,
      quoteUnit: payload.unit,
      overlapPercent: Number(formData.get("overlap_percent") ?? 0) || 0,
      conversionFactor: Number(formData.get("conversion_factor") ?? 1) || 1,
      actorUserId: admin.user.id,
    });
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
    daily_cost: formData.get("daily_cost") ? Number(formData.get("daily_cost")) : null,
    sell_rate: formData.get("sell_rate") ? Number(formData.get("sell_rate")) : null,
    burden_percent: Number(formData.get("burden_percent") ?? 0) || 0,
    overtime_multiplier: Number(formData.get("overtime_multiplier") ?? 1.5) || 1.5,
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

  const { data: savedLabour } = await supabase
    .from("labour_items")
    .select("*")
    .eq("id", entityId!)
    .single();

  if (savedLabour) {
    await syncPricingItemFromLabour(supabase, savedLabour as LabourRow, {
      actorUserId: admin.user.id,
    });
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
  revalidatePath("/admin/pricing/");
}

export async function synchroniseLabourCatalogueAction(): Promise<{
  ok: boolean;
  result?: Awaited<ReturnType<typeof reconcileLabourCatalogue>>;
  error?: string;
}> {
  try {
    const admin = await assertAdmin({ permission: "managePricing" });
    if (admin.profile.role !== "owner" && admin.profile.role !== "admin") {
      return { ok: false, error: "Only owner or admin may run catalogue synchronisation." };
    }
    const supabase = await createClient();
    const result = await reconcileLabourCatalogue(supabase);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "labour_catalogue_synchronised",
      entityType: "pricing_items",
      afterData: result,
    });
    revalidatePath("/admin/pricing/labour/");
    revalidatePath("/admin/pricing/");
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Synchronisation failed.",
    };
  }
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
