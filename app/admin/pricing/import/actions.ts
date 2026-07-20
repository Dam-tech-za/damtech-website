"use server";

import { assertAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncPricingItemFromMaterial } from "@/lib/pricing/sync";
import { syncPricingItemFromLabour, type LabourRow } from "@/lib/pricing/sync-labour-item";

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

export async function previewCsvImportAction(dataType: string, csvText: string) {
  await assertAdmin({ permission: "managePricing" });
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { ok: false as const, error: "CSV must include a header and at least one data row." };
  }
  const header = rows[0].map((h) => h.toLowerCase());
  const errors: string[] = [];
  const required =
    dataType === "materials"
      ? ["item_code", "category", "name", "quote_unit"]
      : dataType === "labour"
        ? ["item_code", "category", "name", "unit"]
        : dataType === "supplier_prices"
          ? ["material_item_code", "supplier_name", "unit_cost"]
          : ["vehicle_code", "vehicle_name", "sell_rate_per_km"];

  for (const col of required) {
    if (!header.includes(col)) errors.push(`Missing required column: ${col}`);
  }

  rows.slice(1).forEach((row, index) => {
    if (row.length < required.length) {
      errors.push(`Row ${index + 2}: insufficient columns`);
    }
    const codeIdx = header.indexOf(required[0]);
    if (codeIdx >= 0 && !row[codeIdx]) {
      errors.push(`Row ${index + 2}: ${required[0]} is required`);
    }
  });

  return {
    ok: true as const,
    preview: {
      rows: rows.length - 1,
      errors,
      sample: rows.slice(1, 6).map((row) => row.join(" · ")),
    },
  };
}

export async function commitCsvImportAction(dataType: string, csvText: string) {
  const admin = await assertAdmin({ permission: "managePricing" });
  const preview = await previewCsvImportAction(dataType, csvText);
  if (!preview.ok) return preview;
  if (preview.preview.errors.length) {
    return { ok: false as const, error: "Resolve validation errors before import." };
  }

  const supabase = await createClient();
  const rows = parseCsv(csvText);
  const header = rows[0].map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  let imported = 0;

  try {
    if (dataType === "materials") {
      for (const row of rows.slice(1)) {
        const payload = {
          item_code: row[idx("item_code")]?.toUpperCase() ?? "",
          category: row[idx("category")] ?? "",
          name: row[idx("name")] ?? "",
          unit: row[idx("quote_unit")] ?? "m²",
          default_cost: Number(row[idx("cost")] ?? 0) || 0,
          default_sell_price: row[idx("sell_price")]
            ? Number(row[idx("sell_price")])
            : null,
          waste_percent: Number(row[idx("waste_percent")] ?? 0) || 0,
          is_active: true,
          metadata: {
            purchase_unit: row[idx("purchase_unit")] ?? null,
            overlap_percent: Number(row[idx("overlap_percent")] ?? 0) || 0,
            conversion_factor: Number(row[idx("conversion_factor")] ?? 1) || 1,
          },
        };
        const { data, error } = await supabase
          .from("material_items")
          .upsert(payload, { onConflict: "item_code" })
          .select("*")
          .single();
        if (error || !data) throw new Error(error?.message ?? "Material import failed");
        await syncPricingItemFromMaterial(supabase, data);
        imported += 1;
      }
    } else if (dataType === "labour") {
      for (const row of rows.slice(1)) {
        const payload = {
          item_code: row[idx("item_code")]?.toUpperCase() ?? "",
          category: row[idx("category")] ?? "",
          name: row[idx("name")] ?? "",
          unit: row[idx("unit")] ?? "hour",
          hourly_cost: row[idx("hourly_cost")] ? Number(row[idx("hourly_cost")]) : null,
          productivity_rate: row[idx("productivity_rate")]
            ? Number(row[idx("productivity_rate")])
            : null,
          productivity_unit: row[idx("productivity_unit")] || null,
          is_active: true,
        };
        const { data, error } = await supabase
          .from("labour_items")
          .upsert(payload, { onConflict: "item_code" })
          .select("*")
          .single();
        if (error || !data) throw new Error(error?.message ?? "Labour import failed");
        await syncPricingItemFromLabour(supabase, data as LabourRow);
        imported += 1;
      }
    } else {
      return {
        ok: false as const,
        error: "This data type import is scaffolded — use materials or labour for now.",
      };
    }

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "pricing_csv_imported",
      entityType: "pricing_items",
      afterData: { dataType, imported },
    });
    revalidatePath("/admin/pricing/");
    return { ok: true as const, imported };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Import failed.",
    };
  }
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Export catalogue CSV. Cost columns included only for authorised roles. */
export async function exportPricingCsvAction(dataType: string): Promise<{
  ok: true;
  filename: string;
  csv: string;
} | { ok: false; error: string }> {
  const admin = await assertAdmin({ permission: "viewPricing" });
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");
  const supabase = await createClient();

  if (dataType === "materials") {
    const columns = canExportCosts
      ? "item_code, category, name, unit, default_cost, default_sell_price, waste_percent, is_active"
      : "item_code, category, name, unit, default_sell_price, is_active";
    const { data, error } = await supabase
      .from("material_items")
      .select(columns as "*")
      .eq("is_active", true)
      .order("item_code");
    if (error) return { ok: false, error: error.message };
    const header = canExportCosts
      ? "item_code,category,name,quote_unit,cost,sell_price,waste_percent,is_active"
      : "item_code,category,name,quote_unit,sell_price,is_active";
    const lines = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => {
      const cells = canExportCosts
        ? [
            row.item_code,
            row.category,
            row.name,
            row.unit,
            row.default_cost,
            row.default_sell_price,
            row.waste_percent,
            row.is_active,
          ]
        : [row.item_code, row.category, row.name, row.unit, row.default_sell_price, row.is_active];
      return cells.map((c) => csvEscape(c as string | number | null)).join(",");
    });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "pricing_csv_exported",
      entityType: "material_items",
      afterData: { dataType, rows: lines.length, includeCosts: canExportCosts },
    });
    return {
      ok: true,
      filename: canExportCosts ? "materials-with-costs.csv" : "materials-sell-prices.csv",
      csv: [header, ...lines].join("\n"),
    };
  }

  if (dataType === "labour") {
    if (!canExportCosts) {
      const { data, error } = await supabase.rpc("get_labour_roles_sell");
      if (error) {
        const fallback = await supabase
          .from("labour_items")
          .select("item_code, category, name, unit, sell_rate, is_active")
          .eq("is_active", true);
        if (fallback.error) return { ok: false, error: fallback.error.message };
        const header = "item_code,category,name,unit,sell_rate,is_active";
        const lines = (fallback.data ?? []).map((row) =>
          [row.item_code, row.category, row.name, row.unit, row.sell_rate, row.is_active]
            .map((c) => csvEscape(c as string | number | null))
            .join(","),
        );
        return { ok: true, filename: "labour-sell-rates.csv", csv: [header, ...lines].join("\n") };
      }
      const header = "item_code,category,name,unit,sell_rate,is_active";
      const lines = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
        [row.item_code, row.category, row.name, row.unit, row.sell_rate, row.is_active]
          .map((c) => csvEscape(c as string | number | null))
          .join(","),
      );
      return { ok: true, filename: "labour-sell-rates.csv", csv: [header, ...lines].join("\n") };
    }

    const { data, error } = await supabase
      .from("labour_items")
      .select(
        "item_code, category, name, unit, hourly_cost, daily_cost, sell_rate, burden_percent, productivity_rate, productivity_unit, is_active",
      )
      .eq("is_active", true)
      .order("item_code");
    if (error) return { ok: false, error: error.message };
    const header =
      "item_code,category,name,unit,hourly_cost,daily_cost,sell_rate,burden_percent,productivity_rate,productivity_unit,is_active";
    const lines = (data ?? []).map((row) =>
      [
        row.item_code,
        row.category,
        row.name,
        row.unit,
        row.hourly_cost,
        row.daily_cost,
        row.sell_rate,
        row.burden_percent,
        row.productivity_rate,
        row.productivity_unit,
        row.is_active,
      ]
        .map((c) => csvEscape(c as string | number | null))
        .join(","),
    );
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "pricing_csv_exported",
      entityType: "labour_items",
      afterData: { dataType, rows: lines.length, includeCosts: true },
    });
    return { ok: true, filename: "labour-with-costs.csv", csv: [header, ...lines].join("\n") };
  }

  return { ok: false, error: "Unsupported export type." };
}
