import type { SupabaseClient } from "@supabase/supabase-js";
import { recordPriceVersion } from "../record-price-version";
import type { InventoryImportRow, RowValidationResult } from "./validate";

export type DuplicateMode = "skip" | "update_fields" | "add_price" | "reactivate" | "create_new";
export type ImportMode = "valid_rows_only" | "all_or_nothing";

export type CommitImportInput = {
  filename: string;
  fileHash: string;
  csvText: string;
  rows: RowValidationResult[];
  duplicateMode: DuplicateMode;
  importMode: ImportMode;
  actorUserId: string;
  makePreferred: boolean;
  templateType?: string | null;
  mappingSnapshot?: Record<string, string | null> | null;
  validationSummary?: Record<string, unknown> | null;
};

export type CommitImportResult = {
  batchId: string;
  successCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failureCount: number;
  warningCount: number;
  errors: string[];
};

function taxToDb(tax: string): string {
  if (tax === "zero_rated") return "zero";
  if (tax === "no_vat") return "exempt";
  return tax === "exempt" ? "exempt" : "standard";
}

async function findSupplierId(
  supabase: SupabaseClient,
  name: string | null,
): Promise<string | null> {
  if (!name) return null;
  const { data } = await supabase
    .from("suppliers")
    .select("id, name")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertMaterialAndCatalogue(
  supabase: SupabaseClient,
  row: InventoryImportRow,
  opts: {
    duplicateMode: DuplicateMode;
    actorUserId: string;
    makePreferred: boolean;
    existingPricingId?: string | null;
  },
): Promise<{
  pricingItemId: string | null;
  materialId: string | null;
  priceId: string | null;
  skipped: boolean;
}> {
  if (opts.existingPricingId && opts.duplicateMode === "skip") {
    return { pricingItemId: opts.existingPricingId, materialId: null, priceId: null, skipped: true };
  }

  const metadata = {
    purchase_unit: row.purchase_unit,
    conversion_factor: row.conversion_factor,
    overlap_percent: row.overlap_percent,
    technical: {
      rollWidthM: row.roll_width_m,
      rollLengthM: row.roll_length_m,
      packSize: row.pack_size,
      thicknessMm: row.thickness_mm,
      gsm: row.gsm,
      coverageRate: row.coverage_rate,
      coverageUnit: row.coverage_unit,
    },
    source_reference: row.source_reference,
    source_url: row.source_url,
    confidence: row.confidence,
    notes: row.notes,
    import: true,
  };

  const materialPayload = {
    item_code: row.item_code,
    category: row.category,
    name: row.product_name,
    description: row.quote_description,
    unit: row.quote_unit,
    default_cost: row.default_cost_ex_vat_zar ?? 0,
    default_sell_price: row.recommended_sell_ex_vat_zar,
    waste_percent: row.waste_percent,
    is_active: row.is_active,
    metadata,
  };

  let materialId: string | null = null;
  const { data: existingMaterial } = await supabase
    .from("material_items")
    .select("id")
    .eq("item_code", row.item_code)
    .maybeSingle();

  if (existingMaterial?.id) {
    if (opts.duplicateMode === "skip") {
      return {
        pricingItemId: opts.existingPricingId ?? null,
        materialId: existingMaterial.id,
        priceId: null,
        skipped: true,
      };
    }
    if (opts.duplicateMode === "reactivate" || opts.duplicateMode === "update_fields" || opts.duplicateMode === "add_price") {
      await supabase.from("material_items").update(materialPayload).eq("id", existingMaterial.id);
      materialId = existingMaterial.id;
    }
  } else {
    const { data: created, error } = await supabase
      .from("material_items")
      .insert(materialPayload)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Material insert failed");
    materialId = created.id;
  }

  const supplierId = await findSupplierId(supabase, row.supplier_name);

  const pricingPayload = {
    item_code: row.item_code,
    item_type: row.item_type,
    category: row.category,
    name: row.product_name,
    short_description: row.quote_description,
    quote_description: row.quote_description,
    purchase_unit: row.purchase_unit ?? row.quote_unit,
    quote_unit: row.quote_unit,
    conversion_factor: row.conversion_factor,
    default_cost: row.default_cost_ex_vat_zar,
    default_sell_price: row.recommended_sell_ex_vat_zar,
    pricing_method: row.pricing_method,
    default_markup_percent: row.default_markup_percent,
    target_margin_percent: row.target_margin_percent,
    tax_category: taxToDb(row.tax_category),
    waste_percent: row.waste_percent,
    overlap_percent: row.overlap_percent,
    coverage_rate: row.coverage_rate,
    coverage_unit: row.coverage_unit,
    supplier_id: supplierId,
    price_valid_from: row.price_date,
    is_active: row.is_active,
    requires_manual_quantity_confirmation: row.requires_manual_confirmation,
    legacy_material_item_id: materialId,
    metadata,
  };

  let pricingItemId = opts.existingPricingId ?? null;
  if (!pricingItemId) {
    const { data: byCode } = await supabase
      .from("pricing_items")
      .select("id")
      .eq("item_code", row.item_code)
      .maybeSingle();
    pricingItemId = byCode?.id ?? null;
  }

  if (pricingItemId) {
    if (opts.duplicateMode === "skip") {
      return { pricingItemId, materialId, priceId: null, skipped: true };
    }
    await supabase.from("pricing_items").update(pricingPayload).eq("id", pricingItemId);
  } else {
    const { data: created, error } = await supabase
      .from("pricing_items")
      .insert(pricingPayload)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Pricing item insert failed");
    pricingItemId = created.id;
  }

  if (materialId && pricingItemId) {
    await supabase
      .from("material_items")
      .update({ pricing_item_id: pricingItemId })
      .eq("id", materialId);
  }

  const shouldWritePrice =
    opts.duplicateMode === "add_price" ||
    opts.duplicateMode === "update_fields" ||
    opts.duplicateMode === "reactivate" ||
    opts.duplicateMode === "create_new" ||
    !opts.existingPricingId;

  let priceId: string | null = null;
  if (
    shouldWritePrice &&
    pricingItemId &&
    (row.default_cost_ex_vat_zar != null || row.recommended_sell_ex_vat_zar != null)
  ) {
    if (opts.makePreferred || opts.duplicateMode === "add_price" || !opts.existingPricingId) {
      const priceResult = await recordPriceVersion(supabase, {
        pricingItemId,
        costPrice: row.default_cost_ex_vat_zar,
        sellPrice: row.recommended_sell_ex_vat_zar,
        supplierId,
        sourceType: "csv_import",
        sourceReference: row.source_reference ?? row.item_code,
        validFrom: row.price_date ?? undefined,
        createdBy: opts.actorUserId,
      });
      if (priceResult.ok) priceId = priceResult.id;
    }
  }

  return { pricingItemId, materialId, priceId, skipped: false };
}

async function upsertNonMaterialCatalogue(
  supabase: SupabaseClient,
  row: InventoryImportRow,
  opts: {
    duplicateMode: DuplicateMode;
    actorUserId: string;
    makePreferred: boolean;
    existingPricingId?: string | null;
  },
): Promise<{ pricingItemId: string | null; priceId: string | null; skipped: boolean }> {
  if (opts.existingPricingId && opts.duplicateMode === "skip") {
    return { pricingItemId: opts.existingPricingId, priceId: null, skipped: true };
  }

  const payload = {
    item_code: row.item_code,
    item_type: row.item_type,
    category: row.category,
    name: row.product_name,
    short_description: row.quote_description,
    quote_description: row.quote_description,
    purchase_unit: row.purchase_unit ?? row.quote_unit,
    quote_unit: row.quote_unit,
    conversion_factor: row.conversion_factor,
    default_cost: row.default_cost_ex_vat_zar,
    default_sell_price: row.recommended_sell_ex_vat_zar,
    pricing_method: row.pricing_method,
    default_markup_percent: row.default_markup_percent,
    target_margin_percent: row.target_margin_percent,
    tax_category: taxToDb(row.tax_category),
    waste_percent: row.waste_percent,
    overlap_percent: row.overlap_percent,
    is_active: row.is_active,
    requires_manual_quantity_confirmation: row.requires_manual_confirmation,
    metadata: {
      notes: row.notes,
      confidence: row.confidence,
      source_reference: row.source_reference,
      source_url: row.source_url,
      import: true,
    },
  };

  let pricingItemId = opts.existingPricingId ?? null;
  if (!pricingItemId) {
    const { data: byCode } = await supabase
      .from("pricing_items")
      .select("id")
      .eq("item_code", row.item_code)
      .maybeSingle();
    pricingItemId = byCode?.id ?? null;
  }

  if (pricingItemId) {
    if (opts.duplicateMode === "skip") return { pricingItemId, priceId: null, skipped: true };
    await supabase.from("pricing_items").update(payload).eq("id", pricingItemId);
  } else {
    const { data: created, error } = await supabase
      .from("pricing_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Pricing item insert failed");
    pricingItemId = created.id;
  }

  let priceId: string | null = null;
  if (
    pricingItemId &&
    (row.default_cost_ex_vat_zar != null || row.recommended_sell_ex_vat_zar != null) &&
    opts.duplicateMode !== "skip"
  ) {
    const priceResult = await recordPriceVersion(supabase, {
      pricingItemId,
      costPrice: row.default_cost_ex_vat_zar,
      sellPrice: row.recommended_sell_ex_vat_zar,
      sourceType: "csv_import",
      sourceReference: row.source_reference ?? row.item_code,
      validFrom: row.price_date ?? undefined,
      createdBy: opts.actorUserId,
    });
    if (priceResult.ok) priceId = priceResult.id;
  }

  return { pricingItemId, priceId, skipped: false };
}

export async function commitInventoryImport(
  supabase: SupabaseClient,
  input: CommitImportInput,
): Promise<CommitImportResult> {
  const selected = input.rows.filter((r) => !r.excluded && r.data);
  const invalid = selected.filter((r) => r.status === "invalid" || !r.data);

  if (input.importMode === "all_or_nothing" && invalid.length > 0) {
    return {
      batchId: "",
      successCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failureCount: invalid.length,
      warningCount: 0,
      errors: ["All-or-nothing mode blocked: resolve invalid rows first."],
    };
  }

  const { data: batch, error: batchError } = await supabase
    .from("pricing_import_batches")
    .insert({
      filename: input.filename,
      file_hash: input.fileHash,
      imported_by: input.actorUserId,
      row_count: input.rows.length,
      status: "draft",
      import_mode: input.importMode,
      duplicate_mode: input.duplicateMode,
      template_type: input.templateType ?? null,
      mapping_snapshot: input.mappingSnapshot ?? {},
      validation_summary: input.validationSummary ?? {},
      original_csv: input.csvText.slice(0, 500_000),
      summary: {},
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return {
      batchId: "",
      successCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failureCount: input.rows.length,
      warningCount: 0,
      errors: [batchError?.message ?? "Failed to create import batch."],
    };
  }

  let successCount = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failureCount = 0;
  let warningCount = 0;
  const errors: string[] = [];

  for (const row of input.rows) {
    if (row.excluded) {
      skippedCount += 1;
      await supabase.from("pricing_import_rows").insert({
        batch_id: batch.id,
        row_number: row.rowNumber,
        item_code: row.data?.item_code ?? row.raw.item_code ?? null,
        status: "excluded",
        action: "exclude",
        payload: row.data ?? row.raw,
        warnings: row.warnings,
        errors: row.errors,
      });
      continue;
    }

    if (!row.data || row.status === "invalid") {
      failureCount += 1;
      await supabase.from("pricing_import_rows").insert({
        batch_id: batch.id,
        row_number: row.rowNumber,
        item_code: row.raw.item_code ?? null,
        status: "failed",
        action: "skip",
        payload: row.raw,
        warnings: row.warnings,
        errors: row.errors,
      });
      continue;
    }

    try {
      const isMaterial =
        row.data.item_type === "material" ||
        row.data.item_type === "allowance" ||
        row.data.item_type === "other";

      const result = isMaterial
        ? await upsertMaterialAndCatalogue(supabase, row.data, {
            duplicateMode: row.status === "duplicate" ? input.duplicateMode : "update_fields",
            actorUserId: input.actorUserId,
            makePreferred: input.makePreferred,
            existingPricingId: row.existingPricingItemId,
          })
        : await upsertNonMaterialCatalogue(supabase, row.data, {
            duplicateMode: row.status === "duplicate" ? input.duplicateMode : "update_fields",
            actorUserId: input.actorUserId,
            makePreferred: input.makePreferred,
            existingPricingId: row.existingPricingItemId,
          });

      if (result.skipped) {
        skippedCount += 1;
        await supabase.from("pricing_import_rows").insert({
          batch_id: batch.id,
          row_number: row.rowNumber,
          item_code: row.data.item_code,
          status: "skipped",
          action: "skip",
          payload: row.data,
          warnings: row.warnings,
          errors: [],
          pricing_item_id: result.pricingItemId,
          material_item_id: "materialId" in result ? result.materialId : null,
        });
      } else {
        successCount += 1;
        if (row.status === "duplicate") updatedCount += 1;
        else createdCount += 1;
        if (row.warnings.length) warningCount += 1;
        await supabase.from("pricing_import_rows").insert({
          batch_id: batch.id,
          row_number: row.rowNumber,
          item_code: row.data.item_code,
          status: "imported",
          action: input.duplicateMode === "add_price" ? "add_price" : "import",
          payload: row.data,
          source_data: row.raw,
          normalised_data: row.data,
          warnings: row.warnings,
          errors: [],
          pricing_item_id: result.pricingItemId,
          material_item_id: "materialId" in result ? result.materialId : null,
          created_price_id: result.priceId ?? null,
        });
      }
    } catch (err) {
      failureCount += 1;
      const message = err instanceof Error ? err.message : "Import failed";
      errors.push(`Row ${row.rowNumber}: ${message}`);
      await supabase.from("pricing_import_rows").insert({
        batch_id: batch.id,
        row_number: row.rowNumber,
        item_code: row.data.item_code,
        status: "failed",
        action: "import",
        payload: row.data,
        warnings: row.warnings,
        errors: [message],
      });
    }
  }

  const status =
    failureCount === 0
      ? "committed"
      : successCount > 0
        ? "partial"
        : "failed";

  await supabase
    .from("pricing_import_batches")
    .update({
      status,
      success_count: successCount,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      failure_count: failureCount,
      warning_count: warningCount,
      rollback_status: successCount > 0 ? "eligible" : "not_applicable",
      summary: { errors: errors.slice(0, 50) },
      error_report: errors.length ? errors.join("\n") : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id);

  return {
    batchId: batch.id,
    successCount,
    createdCount,
    updatedCount,
    skippedCount,
    failureCount,
    warningCount,
    errors,
  };
}
