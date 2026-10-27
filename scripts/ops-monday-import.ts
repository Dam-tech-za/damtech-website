/**
 * One-off Monday → Operations import.
 *
 *   node --experimental-strip-types scripts/ops-monday-import.ts <export.json>          # dry run (default)
 *   node --experimental-strip-types scripts/ops-monday-import.ts <export.json> --write  # writes
 *
 * <export.json> = { "projects": MondayProjectItem[], "materials": MondayMaterialItem[] }
 * (see lib/operations/monday.ts). Keep the export outside the repo: it holds
 * customer phone numbers and emails.
 *
 * --write needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and
 * SUPABASE_SERVICE_ROLE_KEY for the TARGET database. Run against a Supabase
 * branch first. Safe to re-run: rows are keyed by monday_item_id and existing
 * ones are skipped, never overwritten.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  migrateMondayMaterial,
  migrateMondayProject,
  type MondayMaterialItem,
  type MondayProjectItem,
} from "../lib/operations/monday.ts";
import { todayInSouthAfrica } from "../lib/operations/lifecycle.ts";

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error("Usage: ops-monday-import.ts <export.json> [--write]");
  process.exit(1);
}
const write = flag === "--write";
const input = JSON.parse(readFileSync(file, "utf8")) as { projects: MondayProjectItem[]; materials: MondayMaterialItem[] };
const today = todayInSouthAfrica();
const projects = input.projects.map((p) => migrateMondayProject(p, today));
const materials = input.materials.map(migrateMondayMaterial).filter((m) => m !== null);

for (const p of projects) {
  console.log(`${p.stage.padEnd(16)} ${p.title}`);
  console.log(`  quotes ${p.xero_quote_numbers.join(", ") || "—"} · invoices ${p.xero_invoice_numbers.join(", ") || "—"} · next ${p.next_action_due}`);
  for (const note of p.review_notes) console.log(`  review: ${note}`);
}
for (const m of materials) console.log(`order  ${m.status.padEnd(16)} ${m.supplier_name} – ${m.description}`);

if (!write) {
  console.log(`\nDry run: ${projects.length} projects, ${materials.length} supplier orders. Add --write to import.`);
  process.exit(0);
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the target database.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const idByMonday = new Map<string, string>();
const audit = { projectsCreated: 0, projectsSkipped: 0, projectsFlagged: 0, ordersWritten: 0, ordersSkipped: 0 };
for (const p of projects) {
  const { data: existing, error: readError } = await db.from("ops_projects").select("id").eq("monday_item_id", p.monday_item_id).maybeSingle();
  if (readError) throw readError;
  if (existing) {
    idByMonday.set(p.monday_item_id, existing.id);
    audit.projectsSkipped++;
    console.log(`skip (exists) ${p.title}`);
    continue;
  }
  const { review_notes, ...row } = p;
  const { data, error } = await db.from("ops_projects").insert(row).select("id").single();
  if (error) throw error;
  idByMonday.set(p.monday_item_id, data.id);
  await db.from("ops_project_activity").insert({
    project_id: data.id,
    actor_label: "Monday import",
    kind: "project.migrated",
    summary: review_notes.length ? `Migrated from Monday. Check: ${review_notes.join(" ")}` : "Migrated from Monday.",
  });
  audit.projectsCreated++;
  if (review_notes.length) audit.projectsFlagged++;
  console.log(`created ${p.title}`);
}

for (const m of materials) {
  const projectId = idByMonday.get(m.project_monday_item_id);
  if (!projectId) {
    audit.ordersSkipped++;
    console.log(`skip order (no project) ${m.supplier_name}`);
    continue;
  }
  const row = { ...m } as Partial<typeof m>;
  delete row.project_monday_item_id;
  const { error } = await db
    .from("ops_material_orders")
    .upsert({ ...row, project_id: projectId }, { onConflict: "monday_item_id", ignoreDuplicates: true });
  if (error) throw error;
  audit.ordersWritten++;
  console.log(`order ${m.supplier_name} – ${m.description}`);
}
// Amounts are never imported from Monday: the Xero sync fills them from the
// quote and invoice numbers stored on each project.
console.log("\nAudit:", JSON.stringify(audit));
console.log("Done. Run a Xero sync next so money comes from Xero, then check flagged projects in the admin.");
