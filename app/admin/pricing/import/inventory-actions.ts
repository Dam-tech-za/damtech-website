"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import {
  prepareImportFromCsvText,
  validateUploadMeta,
  type CanonicalHeader,
  type RowValidationResult,
} from "@/lib/pricing/csv/prepare";
import {
  commitInventoryImport,
  type DuplicateMode,
  type ImportMode,
} from "@/lib/pricing/csv/commit";

export type PreviewInventoryImportResult =
  | {
      ok: true;
      headers: string[];
      mapping: Record<string, CanonicalHeader | "">;
      delimiter: string;
      hadBom: boolean;
      fileHash: string;
      rows: RowValidationResult[];
      summary: {
        total: number;
        ready: number;
        warnings: number;
        invalid: number;
        missingPrice: number;
        manual: number;
        duplicates: number;
      };
    }
  | { ok: false; error: string };

export async function previewInventoryImportAction(input: {
  filename: string;
  mimeType?: string;
  csvText: string;
  mapping?: Record<string, CanonicalHeader | "">;
  byteLength?: number;
}): Promise<PreviewInventoryImportResult> {
  await assertAdmin({ permission: "managePricing" });

  const meta = validateUploadMeta({
    filename: input.filename,
    mimeType: input.mimeType,
    byteLength: input.byteLength ?? new TextEncoder().encode(input.csvText).length,
  });
  if (!meta.ok) return { ok: false, error: meta.error };

  const prepared = prepareImportFromCsvText(input.csvText, input.mapping);
  const supabase = await createClient();

  const codes = prepared.rows
    .map((r) => r.data?.item_code)
    .filter((c): c is string => Boolean(c));

  const existingByCode = new Map<string, string>();
  if (codes.length) {
    const { data } = await supabase
      .from("pricing_items")
      .select("id, item_code")
      .in("item_code", codes);
    for (const row of data ?? []) {
      existingByCode.set(String(row.item_code), String(row.id));
    }
  }

  let duplicates = 0;
  const rows = prepared.rows.map((row) => {
    if (!row.data) return row;
    const existingId = existingByCode.get(row.data.item_code) ?? null;
    if (!existingId) return row;
    duplicates += 1;
    return {
      ...row,
      status: "duplicate" as const,
      existingPricingItemId: existingId,
      warnings: [
        ...row.warnings,
        "Item code already exists in catalogue — choose duplicate behaviour",
      ],
    };
  });

  return {
    ok: true,
    headers: prepared.headers,
    mapping: prepared.mapping,
    delimiter: prepared.delimiter,
    hadBom: prepared.hadBom,
    fileHash: prepared.fileHash,
    rows,
    summary: { ...prepared.summary, duplicates },
  };
}

export async function commitInventoryImportAction(input: {
  filename: string;
  csvText: string;
  fileHash: string;
  rows: RowValidationResult[];
  duplicateMode: DuplicateMode;
  importMode: ImportMode;
  makePreferred?: boolean;
}): Promise<
  | {
      ok: true;
      batchId: string;
      successCount: number;
      skippedCount: number;
      failureCount: number;
      warningCount: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
  const admin = await assertAdmin({ permission: "managePricing" });
  if (!canPerform(admin.profile.role, "viewCostPrices") && admin.profile.role === "sales") {
    return { ok: false, error: "Sales users may not import supplier costs." };
  }

  const supabase = await createClient();
  const result = await commitInventoryImport(supabase, {
    filename: input.filename,
    fileHash: input.fileHash,
    csvText: input.csvText,
    rows: input.rows,
    duplicateMode: input.duplicateMode,
    importMode: input.importMode,
    actorUserId: admin.user.id,
    makePreferred: input.makePreferred ?? true,
  });

  if (!result.batchId && result.errors.length) {
    return { ok: false, error: result.errors[0] };
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "pricing_inventory_csv_imported",
    entityType: "pricing_import_batches",
    entityId: result.batchId,
    afterData: {
      filename: input.filename,
      successCount: result.successCount,
      skippedCount: result.skippedCount,
      failureCount: result.failureCount,
    },
  });

  revalidatePath("/admin/pricing/");
  revalidatePath("/admin/pricing/materials/");
  revalidatePath("/admin/pricing/services/");
  revalidatePath("/admin/pricing/labour/");
  revalidatePath("/admin/pricing/travel/");
  revalidatePath("/admin/pricing/import/");
  revalidatePath("/admin/pricing/import/history/");
  revalidatePath("/admin/quotes/");

  return { ok: true, ...result };
}

export async function exportInventoryCsvAction(mode: "full" | "sell"): Promise<
  | { ok: true; filename: string; csv: string }
  | { ok: false; error: string }
> {
  const admin = await assertAdmin({ permission: "viewPricing" });
  const canCosts = canPerform(admin.profile.role, "viewCostPrices");
  if (mode === "full" && !canCosts) {
    return { ok: false, error: "Cost export requires owner, admin or estimator." };
  }

  const supabase = await createClient();
  const selectColumns =
    mode === "full"
      ? "item_code, item_type, category, name, quote_description, purchase_unit, quote_unit, conversion_factor, default_cost, default_sell_price, pricing_method, tax_category, waste_percent, overlap_percent, is_active, price_valid_to"
      : "item_code, name, quote_description, quote_unit, default_sell_price, tax_category, price_valid_to, is_active";
  const { data, error } = await supabase
    .from("pricing_items")
    .select(selectColumns as "*")
    .eq("is_active", true)
    .order("item_code")
    .limit(5000);

  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  const escape = (v: unknown) => {
    const text = v == null ? "" : String(v);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const bom = "\uFEFF";
  if (mode === "full") {
    const header =
      "item_code,item_type,category,product_name,quote_description,purchase_unit,quote_unit,conversion_factor,default_cost_ex_vat_zar,recommended_sell_ex_vat_zar,pricing_method,tax_category,waste_percent,overlap_percent,is_active,price_valid_to";
    const lines = rows.map((r) =>
      [
        r.item_code,
        r.item_type,
        r.category,
        r.name,
        r.quote_description,
        r.purchase_unit,
        r.quote_unit,
        r.conversion_factor,
        r.default_cost,
        r.default_sell_price,
        r.pricing_method,
        r.tax_category,
        r.waste_percent,
        r.overlap_percent,
        r.is_active,
        r.price_valid_to,
      ]
        .map(escape)
        .join(","),
    );
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "pricing_inventory_csv_exported",
      entityType: "pricing_items",
      afterData: { mode, rows: lines.length },
    });
    return {
      ok: true,
      filename: "damtech-inventory-full.csv",
      csv: bom + [header, ...lines].join("\n"),
    };
  }

  const header =
    "item_code,product_name,quote_description,quote_unit,recommended_sell_ex_vat_zar,tax_category,price_valid_to,is_active";
  const lines = rows.map((r) =>
    [
      r.item_code,
      r.name,
      r.quote_description,
      r.quote_unit,
      r.default_sell_price,
      r.tax_category,
      r.price_valid_to,
      r.is_active,
    ]
      .map(escape)
      .join(","),
  );
  return {
    ok: true,
    filename: "damtech-inventory-sell-prices.csv",
    csv: bom + [header, ...lines].join("\n"),
  };
}

export async function rollbackImportBatchAction(batchId: string): Promise<
  { ok: true; deactivated: number } | { ok: false; error: string }
> {
  const admin = await assertAdmin({ permission: "managePricing" });
  if (admin.profile.role !== "owner" && admin.profile.role !== "admin") {
    return { ok: false, error: "Only owner or admin may roll back imports." };
  }

  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("pricing_import_batches")
    .select("id, rollback_status, status")
    .eq("id", batchId)
    .maybeSingle();

  if (!batch) return { ok: false, error: "Import batch not found." };
  if (batch.rollback_status === "completed") {
    return { ok: false, error: "Batch already rolled back." };
  }

  const { data: rows } = await supabase
    .from("pricing_import_rows")
    .select("id, pricing_item_id, status")
    .eq("batch_id", batchId)
    .eq("status", "imported");

  const pricingIds = (rows ?? [])
    .map((r) => r.pricing_item_id)
    .filter((id): id is string => Boolean(id));

  if (pricingIds.length) {
    const { data: used } = await supabase
      .from("quote_line_items")
      .select("id, quotes!inner(status)")
      .in("source_pricing_item_id", pricingIds)
      .in("quotes.status", ["sent", "approved", "viewed", "accepted"]);

    if ((used ?? []).length > 0) {
      await supabase
        .from("pricing_import_batches")
        .update({ rollback_status: "blocked" })
        .eq("id", batchId);
      return {
        ok: false,
        error: "Rollback blocked: imported items are used on sent/accepted quotes.",
      };
    }

    await supabase
      .from("pricing_items")
      .update({ is_active: false })
      .in("id", pricingIds);
  }

  await supabase
    .from("pricing_import_rows")
    .update({ status: "rolled_back" })
    .eq("batch_id", batchId)
    .eq("status", "imported");

  await supabase
    .from("pricing_import_batches")
    .update({ rollback_status: "completed", status: "rolled_back" })
    .eq("id", batchId);

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "pricing_import_rolled_back",
    entityType: "pricing_import_batches",
    entityId: batchId,
    afterData: { deactivated: pricingIds.length },
  });

  revalidatePath("/admin/pricing/");
  revalidatePath("/admin/pricing/import/history/");
  return { ok: true, deactivated: pricingIds.length };
}
