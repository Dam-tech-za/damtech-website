"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { validateUploadMeta } from "@/lib/pricing/csv/parse";
import type { DuplicateMode, ImportMode } from "@/lib/pricing/csv/commit";
import type { TankCanonicalHeader } from "@/lib/pricing/tank-import/columns";
import {
  buildTankImportPreview,
  type TankImportPreview,
} from "@/lib/pricing/tank-import/preview";
import {
  validateTankRow,
  type TankRowValidationResult,
} from "@/lib/pricing/tank-import/validate";
import { commitTankImport } from "@/lib/pricing/tank-import/commit";
import {
  TANK_CANONICAL_HEADERS,
  type TankAutoMapResult,
} from "@/lib/pricing/tank-import/columns";

export type PreviewTankImportResult =
  | {
      ok: true;
      headers: string[];
      mapping: Record<string, TankCanonicalHeader | "">;
      delimiter: string;
      hadBom: boolean;
      fileHash: string;
      autoMap: TankAutoMapResult;
      rows: TankRowValidationResult[];
      summary: TankImportPreview["summary"];
    }
  | { ok: false; error: string };

async function lookupExistingCodes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  codes: string[],
): Promise<{ codes: Set<string>; ids: Map<string, string> }> {
  const existingCodes = new Set<string>();
  const existingIds = new Map<string, string>();
  if (codes.length) {
    const { data } = await supabase
      .from("tank_models")
      .select("id, model_code")
      .in("model_code", codes);
    for (const row of data ?? []) {
      existingCodes.add(String(row.model_code));
      existingIds.set(String(row.model_code), String(row.id));
    }
  }
  return { codes: existingCodes, ids: existingIds };
}

export async function previewTankImportAction(input: {
  filename: string;
  mimeType?: string;
  csvText: string;
  mapping?: Record<string, TankCanonicalHeader | "">;
  byteLength?: number;
}): Promise<PreviewTankImportResult> {
  await assertAdmin({ permission: "managePricing" });

  const meta = validateUploadMeta({
    filename: input.filename,
    mimeType: input.mimeType,
    byteLength: input.byteLength ?? new TextEncoder().encode(input.csvText).length,
  });
  if (!meta.ok) return { ok: false, error: meta.error };

  const supabase = await createClient();

  const scout = buildTankImportPreview(input.csvText, { mappingOverride: input.mapping });
  const codes = scout.rows
    .map((r) => r.data?.tank_code)
    .filter((c): c is string => Boolean(c));

  const { codes: existingCodes, ids: existingIds } = await lookupExistingCodes(supabase, codes);

  const preview = buildTankImportPreview(input.csvText, {
    mappingOverride: input.mapping,
    existingCodes,
  });

  const rows = preview.rows.map((row) =>
    row.data && existingIds.has(row.data.tank_code)
      ? { ...row, existingTankModelId: existingIds.get(row.data.tank_code) ?? null }
      : row,
  );

  return {
    ok: true,
    headers: preview.headers,
    mapping: preview.mapping,
    delimiter: preview.delimiter,
    hadBom: preview.hadBom,
    fileHash: preview.fileHash,
    autoMap: preview.autoMap,
    rows,
    summary: preview.summary,
  };
}

export async function revalidateTankRowsAction(input: {
  rows: Array<{ rowNumber: number; raw: Record<string, string> }>;
}): Promise<{ ok: true; rows: TankRowValidationResult[] } | { ok: false; error: string }> {
  await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();

  const seen = new Set<string>();
  const validated = input.rows.map(({ rowNumber, raw }) => validateTankRow(raw, rowNumber, seen));

  const codes = validated
    .map((r) => r.data?.tank_code)
    .filter((c): c is string => Boolean(c));
  const { ids: existingIds } = await lookupExistingCodes(supabase, codes);

  const rows = validated.map((row) => {
    if (row.data && existingIds.has(row.data.tank_code)) {
      return {
        ...row,
        status: "duplicate" as const,
        existingTankModelId: existingIds.get(row.data.tank_code) ?? null,
        warnings: [
          ...row.warnings,
          `tank_code ${row.data.tank_code} already exists; default action is Skip`,
        ],
      };
    }
    return row;
  });

  return { ok: true, rows };
}

export async function commitTankImportAction(input: {
  filename: string;
  csvText: string;
  fileHash: string;
  rows: TankRowValidationResult[];
  duplicateMode: DuplicateMode;
  importMode: ImportMode;
  mappingSnapshot?: Record<string, string | null> | null;
  validationSummary?: Record<string, unknown> | null;
}): Promise<
  | {
      ok: true;
      batchId: string;
      successCount: number;
      createdCount: number;
      updatedCount: number;
      skippedCount: number;
      failureCount: number;
      warningCount: number;
      errors: string[];
    }
  | { ok: false; error: string }
> {
  const admin = await assertAdmin({ permission: "managePricing" });

  const supabase = await createClient();
  const result = await commitTankImport(supabase, {
    filename: input.filename,
    fileHash: input.fileHash,
    csvText: input.csvText,
    rows: input.rows,
    duplicateMode: input.duplicateMode,
    importMode: input.importMode,
    actorUserId: admin.user.id,
    mappingSnapshot: input.mappingSnapshot ?? null,
    validationSummary: input.validationSummary ?? null,
  });

  if (!result.batchId && result.errors.length) {
    return { ok: false, error: result.errors[0] };
  }

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "pricing_tank_models_csv_imported",
    entityType: "pricing_import_batches",
    entityId: result.batchId,
    afterData: {
      filename: input.filename,
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
      skippedCount: result.skippedCount,
      failureCount: result.failureCount,
    },
  });

  revalidatePath("/admin/pricing/tank-models/");
  revalidatePath("/admin/pricing/tank-models/import/");
  revalidatePath("/admin/pricing/tank-models/import/history/");
  revalidatePath("/admin/quotes/");

  return { ok: true, ...result };
}

export async function exportTankModelsCsvAction(mode: "full" | "sell"): Promise<
  { ok: true; filename: string; csv: string } | { ok: false; error: string }
> {
  const admin = await assertAdmin({ permission: "viewPricing" });
  const canCosts = canPerform(admin.profile.role, "viewCostPrices");
  if (mode === "full" && !canCosts) {
    return { ok: false, error: "Cost export requires owner, admin or estimator." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tank_models")
    .select(
      "id, model_code, model_name, internal_diameter_m, shell_height_m, ring_count, nominal_capacity_kl, usable_capacity_kl, is_active, tank_model_prices!inner(steel_tank_cost_ex_vat_zar, steel_tank_sell_ex_vat_zar, pvc_liner_cost_ex_vat_zar, pvc_liner_sell_ex_vat_zar, total_sell_ex_vat_zar, valid_from, valid_to, is_current)",
    )
    .order("nominal_capacity_kl")
    .limit(5000);

  if (error) return { ok: false, error: error.message };

  type PriceRow = {
    steel_tank_cost_ex_vat_zar: number | null;
    steel_tank_sell_ex_vat_zar: number | null;
    pvc_liner_cost_ex_vat_zar: number | null;
    pvc_liner_sell_ex_vat_zar: number | null;
    total_sell_ex_vat_zar: number | null;
    valid_from: string | null;
    valid_to: string | null;
    is_current: boolean;
  };
  type ModelRow = {
    model_code: string;
    model_name: string | null;
    internal_diameter_m: number;
    shell_height_m: number;
    ring_count: number | null;
    nominal_capacity_kl: number;
    usable_capacity_kl: number | null;
    is_active: boolean;
    tank_model_prices: PriceRow[];
  };

  const rows = (data ?? []) as unknown as ModelRow[];

  const escape = (v: unknown) => {
    const text = v == null ? "" : String(v);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const perKl = (sell: number | null, usable: number | null) =>
    sell != null && usable && usable > 0 ? Math.round((sell / usable) * 100) / 100 : "";

  const bom = "\uFEFF";

  if (mode === "full") {
    const header =
      "tank_code,model_name,diameter_m,height_m,ring_count,nominal_capacity_kl,usable_capacity_kl,steel_tank_cost_ex_vat_zar,steel_tank_sell_ex_vat_zar,pvc_liner_cost_ex_vat_zar,pvc_liner_sell_ex_vat_zar,total_sell_ex_vat_zar,combined_price_per_usable_kl,valid_from,valid_to,is_active";
    const lines = rows.map((r) => {
      const price = r.tank_model_prices.find((p) => p.is_current) ?? r.tank_model_prices[0];
      return [
        r.model_code,
        r.model_name,
        r.internal_diameter_m,
        r.shell_height_m,
        r.ring_count,
        r.nominal_capacity_kl,
        r.usable_capacity_kl,
        price?.steel_tank_cost_ex_vat_zar ?? "",
        price?.steel_tank_sell_ex_vat_zar ?? "",
        price?.pvc_liner_cost_ex_vat_zar ?? "",
        price?.pvc_liner_sell_ex_vat_zar ?? "",
        price?.total_sell_ex_vat_zar ?? "",
        perKl(price?.total_sell_ex_vat_zar ?? null, r.usable_capacity_kl),
        price?.valid_from ?? "",
        price?.valid_to ?? "",
        r.is_active,
      ]
        .map(escape)
        .join(",");
    });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "pricing_tank_models_csv_exported",
      entityType: "tank_models",
      afterData: { mode, rows: lines.length },
    });
    return {
      ok: true,
      filename: "damtech-tank-models-full.csv",
      csv: bom + [header, ...lines].join("\n"),
    };
  }

  const header =
    "tank_code,model_name,diameter_m,height_m,usable_capacity_kl,steel_tank_sell_ex_vat_zar,pvc_liner_sell_ex_vat_zar,total_sell_ex_vat_zar,combined_price_per_usable_kl,valid_from,valid_to";
  const lines = rows.map((r) => {
    const price = r.tank_model_prices.find((p) => p.is_current) ?? r.tank_model_prices[0];
    return [
      r.model_code,
      r.model_name,
      r.internal_diameter_m,
      r.shell_height_m,
      r.usable_capacity_kl,
      price?.steel_tank_sell_ex_vat_zar ?? "",
      price?.pvc_liner_sell_ex_vat_zar ?? "",
      price?.total_sell_ex_vat_zar ?? "",
      perKl(price?.total_sell_ex_vat_zar ?? null, r.usable_capacity_kl),
      price?.valid_from ?? "",
      price?.valid_to ?? "",
    ]
      .map(escape)
      .join(",");
  });

  return {
    ok: true,
    filename: "damtech-tank-models-sell-prices.csv",
    csv: bom + [header, ...lines].join("\n"),
  };
}

export { TANK_CANONICAL_HEADERS };
