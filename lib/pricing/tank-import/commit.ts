import type { SupabaseClient } from "@supabase/supabase-js";
import type { DuplicateMode, ImportMode } from "../csv/commit";
import type { TankImportRow, TankRowValidationResult } from "./validate";

export type CommitTankImportInput = {
  filename: string;
  fileHash: string;
  csvText: string;
  rows: TankRowValidationResult[];
  duplicateMode: DuplicateMode;
  importMode: ImportMode;
  actorUserId: string;
  mappingSnapshot?: Record<string, string | null> | null;
  validationSummary?: Record<string, unknown> | null;
};

export type CommitTankImportResult = {
  batchId: string;
  successCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failureCount: number;
  warningCount: number;
  errors: string[];
};

const TEMPLATE_TYPE = "tank_models";

async function findSupplierId(
  supabase: SupabaseClient,
  name: string | null,
): Promise<string | null> {
  if (!name) return null;
  const { data } = await supabase
    .from("suppliers")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function modelPayload(row: TankImportRow, supplierId: string | null) {
  return {
    supplier_id: supplierId,
    model_code: row.tank_code,
    model_name: row.model_name,
    nominal_capacity_kl: row.nominal_capacity_kl,
    internal_diameter_m: row.diameter_m,
    shell_height_m: row.height_m,
    usable_capacity_kl: row.usable_capacity_kl,
    ring_count: row.ring_count,
    supplier_model_code: row.supplier_model_code,
    lead_time_days: row.lead_time_days,
    default_inlet_mm: row.default_inlet_mm,
    default_outlet_mm: row.default_outlet_mm,
    default_overflow_mm: row.default_overflow_mm,
    default_drain_mm: row.default_drain_mm,
    wall_area_m2: row.wall_area_m2,
    floor_area_m2: row.floor_area_m2,
    liner_area_m2: row.liner_area_m2,
    confidence: row.confidence,
    requires_manual_confirmation: row.requires_manual_confirmation,
    // Keep legacy inline prices in sync for existing consumers.
    base_price: row.steel_tank_sell_ex_vat_zar,
    installation_price: row.installation_sell_ex_vat_zar,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    is_active: row.is_active,
  };
}

function pricePayload(row: TankImportRow, tankModelId: string, batchId: string, actorUserId: string) {
  return {
    tank_model_id: tankModelId,
    steel_tank_cost_ex_vat_zar: row.steel_tank_cost_ex_vat_zar,
    steel_tank_sell_ex_vat_zar: row.steel_tank_sell_ex_vat_zar,
    pvc_liner_cost_ex_vat_zar: row.pvc_liner_cost_ex_vat_zar,
    pvc_liner_sell_ex_vat_zar: row.pvc_liner_sell_ex_vat_zar,
    roof_included: row.roof_included,
    roof_sell_ex_vat_zar: row.roof_sell_ex_vat_zar,
    foundation_included: row.foundation_included,
    foundation_sell_ex_vat_zar: row.foundation_sell_ex_vat_zar,
    installation_included: row.installation_included,
    installation_sell_ex_vat_zar: row.installation_sell_ex_vat_zar,
    total_sell_ex_vat_zar: row.total_sell_ex_vat_zar,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    price_date: row.price_date,
    confidence: row.confidence,
    requires_manual_confirmation: row.requires_manual_confirmation,
    is_current: true,
    source_reference: row.supplier_model_code ?? row.tank_code,
    import_batch_id: batchId,
    created_by: actorUserId,
  };
}

async function upsertTankModel(
  supabase: SupabaseClient,
  row: TankImportRow,
  opts: {
    duplicateMode: DuplicateMode;
    isDuplicate: boolean;
    existingTankModelId?: string | null;
    batchId: string;
    actorUserId: string;
  },
): Promise<{ tankModelId: string | null; priceId: string | null; skipped: boolean; created: boolean }> {
  const supplierId = await findSupplierId(supabase, row.supplier_name);
  const mode = opts.isDuplicate ? opts.duplicateMode : "update_fields";

  // Existing model handling.
  if (opts.isDuplicate && opts.existingTankModelId) {
    if (mode === "skip") {
      return { tankModelId: opts.existingTankModelId, priceId: null, skipped: true, created: false };
    }

    const payload = modelPayload(row, supplierId);
    if (mode === "reactivate") payload.is_active = true;
    if (mode === "create_new") {
      // Create as a brand-new model under a versioned code to avoid unique clash.
      let candidate = `${row.tank_code}-N`;
      let suffix = 2;
      while ((await supabase.from("tank_models").select("id").eq("model_code", candidate).maybeSingle()).data) {
        candidate = `${row.tank_code}-N${suffix}`;
        suffix += 1;
      }
      const { data: created, error } = await supabase
        .from("tank_models")
        .insert({ ...payload, model_code: candidate })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message ?? "Tank model insert failed");
      const priceId = await writePrice(supabase, row, created.id, opts.batchId, opts.actorUserId);
      return { tankModelId: created.id, priceId, skipped: false, created: true };
    }

    const { error } = await supabase
      .from("tank_models")
      .update(payload)
      .eq("id", opts.existingTankModelId);
    if (error) throw new Error(error.message);

    // update_fields updates metadata only; add_price / reactivate create a new
    // price version (history preserved).
    let priceId: string | null = null;
    if (mode === "add_price" || mode === "reactivate") {
      priceId = await writePrice(supabase, row, opts.existingTankModelId, opts.batchId, opts.actorUserId);
    }
    return { tankModelId: opts.existingTankModelId, priceId, skipped: false, created: false };
  }

  // New model.
  const { data: created, error } = await supabase
    .from("tank_models")
    .insert(modelPayload(row, supplierId))
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Tank model insert failed");
  const priceId = await writePrice(supabase, row, created.id, opts.batchId, opts.actorUserId);
  return { tankModelId: created.id, priceId, skipped: false, created: true };
}

async function writePrice(
  supabase: SupabaseClient,
  row: TankImportRow,
  tankModelId: string,
  batchId: string,
  actorUserId: string,
): Promise<string | null> {
  await supabase
    .from("tank_model_prices")
    .update({ is_current: false })
    .eq("tank_model_id", tankModelId)
    .eq("is_current", true);

  const { data, error } = await supabase
    .from("tank_model_prices")
    .insert(pricePayload(row, tankModelId, batchId, actorUserId))
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Tank price insert failed");
  return data.id;
}

export async function commitTankImport(
  supabase: SupabaseClient,
  input: CommitTankImportInput,
): Promise<CommitTankImportResult> {
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
      template_type: TEMPLATE_TYPE,
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
        item_code: row.data?.tank_code ?? row.raw.tank_code ?? null,
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
        item_code: row.raw.tank_code ?? null,
        status: "failed",
        action: "skip",
        payload: row.raw,
        warnings: row.warnings,
        errors: row.errors,
      });
      continue;
    }

    try {
      const result = await upsertTankModel(supabase, row.data, {
        duplicateMode: input.duplicateMode,
        isDuplicate: row.status === "duplicate",
        existingTankModelId: row.existingTankModelId,
        batchId: batch.id,
        actorUserId: input.actorUserId,
      });

      if (result.skipped) {
        skippedCount += 1;
        await supabase.from("pricing_import_rows").insert({
          batch_id: batch.id,
          row_number: row.rowNumber,
          item_code: row.data.tank_code,
          status: "skipped",
          action: "skip",
          payload: row.data,
          warnings: row.warnings,
          errors: [],
          tank_model_id: result.tankModelId,
        });
      } else {
        successCount += 1;
        if (result.created) createdCount += 1;
        else updatedCount += 1;
        if (row.warnings.length) warningCount += 1;
        await supabase.from("pricing_import_rows").insert({
          batch_id: batch.id,
          row_number: row.rowNumber,
          item_code: row.data.tank_code,
          status: "imported",
          action: result.created ? "import" : input.duplicateMode,
          payload: row.data,
          source_data: row.raw,
          normalised_data: row.data,
          warnings: row.warnings,
          errors: [],
          tank_model_id: result.tankModelId,
          tank_model_price_id: result.priceId,
        });
      }
    } catch (err) {
      failureCount += 1;
      const message = err instanceof Error ? err.message : "Import failed";
      errors.push(`Row ${row.rowNumber}: ${message}`);
      await supabase.from("pricing_import_rows").insert({
        batch_id: batch.id,
        row_number: row.rowNumber,
        item_code: row.data.tank_code,
        status: "failed",
        action: "import",
        payload: row.data,
        warnings: row.warnings,
        errors: [message],
      });
    }
  }

  const status = failureCount === 0 ? "committed" : successCount > 0 ? "partial" : "failed";

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
