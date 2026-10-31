"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import { adminOpsDb } from "@/lib/operations/admin-db";
import {
  BOOKING_STATUS_LABELS,
  describeBookingSaveError,
  parseBookingForm,
  saDate,
  saTime,
  type RawBookingForm,
} from "@/lib/operations/calendar";
import { bookingHistory, type BookingHistoryItem } from "@/lib/operations/calendar-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^#[0-9a-f]{6}$/i;

function formToRecord(formData: FormData): RawBookingForm {
  const out: RawBookingForm = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = key === "team_ids" ? all : all[0];
  }
  // The drawer's "Cancel booking" button submits the same form.
  if (out.cancel_booking) out.status = "cancelled";
  return out;
}

function refresh(projectId: string | null) {
  revalidatePath("/admin/operations/calendar/");
  if (projectId) revalidatePath(`/admin/operations/projects/${projectId}/`);
}

function fail(context: string, error: unknown): AdminActionState {
  unstable_rethrow(error);
  console.error(`[calendar] ${context}:`, error);
  return actionFailure(describeActionError(error));
}

/** Create or update a booking. One database transaction writes the booking, its teams and the audit row. */
export async function saveBookingAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const parsed = parseBookingForm(formToRecord(formData));
    if (!parsed.ok) return actionFailure(parsed.error);
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const label = admin.profile.full_name || admin.profile.email;

    const { data, error } = await db.rpc("ops_calendar_save_booking", {
      p: parsed.value,
      p_actor: admin.user.id,
      p_actor_label: label,
    });
    if (error) return actionFailure(describeBookingSaveError(error));

    const saved = data as { id: string; project_id: string | null; start_at: string; end_at: string; status: string } | null;
    if (saved?.project_id) {
      const when = `${saDate(saved.start_at)} ${saTime(saved.start_at)}–${saTime(saved.end_at)}`;
      const status = BOOKING_STATUS_LABELS[saved.status as keyof typeof BOOKING_STATUS_LABELS] ?? saved.status;
      const { error: logError } = await db.from("ops_project_activity").insert({
        project_id: saved.project_id,
        actor_id: admin.user.id,
        actor_label: label,
        kind: "calendar",
        summary: `${parsed.value.id ? "Booking updated" : "Booked"}: ${when} (${status})`,
        data: { booking_id: saved.id },
      });
      if (logError) console.error("[calendar] activity log failed:", logError.message);
    }
    refresh(saved?.project_id ?? null);
    return actionSuccess(parsed.value.id ? "Booking updated." : "Booking added.");
  } catch (error) {
    return fail("save booking", error);
  }
}

/** Create or rename a team. Teams are never deleted; they are switched off. */
export async function saveTeamAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim().slice(0, 60);
    const leader = String(formData.get("leader_name") ?? "").trim().slice(0, 80) || null;
    const colour = String(formData.get("colour") ?? "#026BC6").trim();
    const active = formData.get("active") !== "off";
    if (!name) return actionFailure("Give the team a name.");
    if (!HEX_RE.test(colour)) return actionFailure("Pick a colour.");
    if (id && !UUID_RE.test(id)) return actionFailure("That team could not be found.");

    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const row = { name, leader_name: leader, colour, active };
    const { error } = id ? await db.from("ops_teams").update(row).eq("id", id) : await db.from("ops_teams").insert(row);
    if (error) {
      if (error.code === "23505") return actionFailure("A team with that name already exists.");
      console.error("[calendar] save team:", error.message);
      return actionFailure("The team could not be saved.");
    }
    refresh(null);
    return actionSuccess(id ? "Team updated." : "Team added.");
  } catch (error) {
    return fail("save team", error);
  }
}

export async function bookingHistoryAction(bookingId: string): Promise<BookingHistoryItem[]> {
  if (!UUID_RE.test(bookingId)) return [];
  try {
    const { db } = await adminOpsDb();
    return await bookingHistory(db, bookingId);
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}
