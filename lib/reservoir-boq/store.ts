import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/operations/admin-db";
import { designKeys, type BoqSelection, type BoqSettings, type RoofDesign, type WallDesign } from "@/lib/reservoir-boq/boq";

export type ReservoirDesignLoad =
  | { state: "ok"; settings: BoqSettings; wall: WallDesign | null; roof: RoofDesign | null; updatedAt: string | null }
  | { state: "not_installed" }
  | { state: "empty" }
  | { state: "error" };

/** The settings row alone: the lists for the selection boxes. */
export async function loadReservoirSettings(db: SupabaseClient): Promise<ReservoirDesignLoad> {
  const { data, error } = await db.from("reservoir_designs").select("data, updated_at").eq("design_key", "settings").maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return { state: "not_installed" };
    console.error("[reservoir-boq] settings:", error.message);
    return { state: "error" };
  }
  if (!data) return { state: "empty" };
  return { state: "ok", settings: data.data as BoqSettings, wall: null, roof: null, updatedAt: data.updated_at as string };
}

/** Settings plus the wall design and, with a roof, the roof design for one selection. */
export async function loadReservoirDesign(db: SupabaseClient, selection: BoqSelection): Promise<ReservoirDesignLoad> {
  const keys = designKeys(selection);
  const wanted = ["settings", keys.wall, ...(keys.roof ? [keys.roof] : [])];
  const { data, error } = await db.from("reservoir_designs").select("design_key, data, updated_at").in("design_key", wanted);
  if (error) {
    if (isMissingTableError(error)) return { state: "not_installed" };
    console.error("[reservoir-boq] design:", error.message);
    return { state: "error" };
  }
  const byKey = new Map((data ?? []).map((row) => [row.design_key as string, row]));
  const settings = byKey.get("settings");
  if (!settings) return { state: "empty" };
  return {
    state: "ok",
    settings: settings.data as BoqSettings,
    wall: (byKey.get(keys.wall)?.data as WallDesign | undefined) ?? null,
    roof: keys.roof ? ((byKey.get(keys.roof)?.data as RoofDesign | undefined) ?? null) : null,
    updatedAt: (settings.updated_at as string) ?? null,
  };
}
