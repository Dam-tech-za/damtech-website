"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { adminOpsDb, isMissingTableError } from "@/lib/operations/admin-db";

type Result = { ok: true } | { error: string };

// Quotes, commas and brackets would break the PostgREST "or" filter below; names never need them.
const clean = (name: string) => name.replace(/["(),]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Add a name to the Person list. */
export async function addProjectLeadAction(rawName: string): Promise<Result> {
  const name = clean(rawName);
  if (!name) return { error: "Type a name." };
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { error } = await db.from("ops_project_leads").insert({ name, created_by: admin.user.id });
    if (error) {
      if (error.code === "23505") return { error: `${name} is already on the list.` };
      if (isMissingTableError(error)) return { error: "The lead list is not switched on yet." };
      console.error("[operations] add lead:", error.message);
      return { error: "The name could not be added. Try again." };
    }
    revalidatePath("/admin/operations/projects/");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "The name could not be added. Try again." };
  }
}

/** Remove a name from the list, unless a project still has that lead. */
export async function deleteProjectLeadAction(rawName: string): Promise<Result> {
  const name = clean(rawName);
  if (!name) return { error: "That name could not be found." };
  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const pattern = escapeLike(name);
    const { data: inUse, error: useError } = await db
      .from("ops_projects")
      .select("title")
      .is("archived_at", null)
      .or(`project_lead_name.ilike."${pattern}",crew.ilike."${pattern}"`)
      .limit(5);
    if (useError) {
      console.error("[operations] lead in use check:", useError.message);
      return { error: "The name could not be removed. Try again." };
    }
    if (inUse?.length) {
      const titles = inUse.map((p) => p.title as string);
      return { error: `${name} is still the lead on ${titles.length === 5 ? "5 or more projects" : titles.join(", ")}. Change the lead on those first.` };
    }
    const { data, error } = await db.from("ops_project_leads").delete().ilike("name", pattern).select("id");
    if (error) {
      if (isMissingTableError(error)) return { error: "The lead list is not switched on yet." };
      console.error("[operations] delete lead:", error.message);
      return { error: "The name could not be removed. Try again." };
    }
    if (!data?.length) return { error: `${name} comes from a project, not the saved list.` };
    revalidatePath("/admin/operations/projects/");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "The name could not be removed. Try again." };
  }
}
