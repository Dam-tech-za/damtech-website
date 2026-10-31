"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { actionFailure, actionSuccess, describeActionError, type AdminActionState } from "@/lib/admin/action-state";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { CHECKLIST_SET_LABELS, checklistFamily, checklistTasks, type ChecklistSet } from "@/lib/operations/checklists";
import { isProjectService } from "@/lib/operations/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SETS: ChecklistSet[] = ["readiness", "quality", "handover"];

/** Add a service-specific starter checklist to a project as ordinary tasks. */
export async function addChecklistAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const set = String(formData.get("set") ?? "") as ChecklistSet;
  if (!UUID.test(projectId) || !SETS.includes(set)) return actionFailure("That checklist could not be added.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const [{ data: project }, { data: tasks }] = await Promise.all([
      db.from("ops_projects").select("service").eq("id", projectId).maybeSingle(),
      db.from("ops_project_tasks").select("title, sort_order").eq("project_id", projectId),
    ]);
    if (!project) return actionFailure("This project could not be found.");
    const service = String(project.service);
    const family = isProjectService(service) ? checklistFamily(service) : null;
    if (!family) return actionFailure("Set the project's service first; supply-only jobs have no site checklist.");
    const existing = (tasks ?? []) as { title: string; sort_order: number | null }[];
    const add = checklistTasks(set, family, existing.map((t) => t.title));
    if (!add.length) return actionSuccess(`The ${CHECKLIST_SET_LABELS[set].toLowerCase()} checklist is already on this project.`);
    const start = Math.max(0, ...existing.map((t) => t.sort_order ?? 0)) + 1;
    const { error } = await db.from("ops_project_tasks").insert(add.map((t, i) => ({ project_id: projectId, title: t.title, kind: t.kind, sort_order: start + i })));
    if (error) throw error;
    const label = admin.profile.full_name || admin.profile.email;
    const { error: logError } = await db.from("ops_project_activity").insert({
      project_id: projectId,
      actor_id: admin.user.id,
      actor_label: label,
      kind: "task.added",
      summary: `${CHECKLIST_SET_LABELS[set]} checklist added (${add.length} items)`,
      data: { set },
    });
    if (logError) console.error("[operations] checklist log:", logError.message);
    revalidatePath(`/admin/operations/projects/${projectId}/`);
    return actionSuccess(`${add.length} items added.`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] add checklist:", error);
    return actionFailure(describeActionError(error));
  }
}
