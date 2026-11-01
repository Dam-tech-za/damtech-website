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
  type QuoteSnapshot,
  type RawBookingForm,
} from "@/lib/operations/calendar";
import { bookingHistory, type BookingHistoryItem } from "@/lib/operations/calendar-store";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { getXeroDocumentWithContact, XeroDocumentError } from "@/lib/operations/xero-document";

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

// ---------------------------------------------------------------------------
// Site inspections: unaccepted Xero quotes (read only; nothing changes in Xero)
// ---------------------------------------------------------------------------

export type OpenQuote = { id: string; number: string; contact: string | null; total: number | null; date: string | null; status: string; title: string | null };

/** DRAFT and SENT quotes from the last 90 days, newest first. */
export async function openQuotesAction(): Promise<{ quotes: OpenQuote[] } | { error: string }> {
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "Xero is not connected on this site. Type the client's details instead." };
  try {
    await adminOpsDb({ permission: "manageOperations" });
    const bridge = createXeroBridgeClient(config);
    const from = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
    const lists = await Promise.all(
      (["DRAFT", "SENT"] as const).map((status) =>
        bridge.call<{ id: string; number: string; contact: string | null; total: number | null; date: string | null; status: string; title: string | null }[]>("get_quotes", { status, date_from: from }),
      ),
    );
    const quotes = lists
      .flat()
      .filter((q) => q && ["DRAFT", "SENT"].includes(String(q.status).toUpperCase()))
      .map((q) => ({ id: q.id, number: q.number, contact: q.contact ?? null, total: q.total ?? null, date: q.date ?? null, status: q.status, title: q.title ?? null }))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.number.localeCompare(a.number));
    return { quotes };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[calendar] open quotes:", error instanceof Error ? error.message : error);
    return { error: "Xero did not answer. You can still save the booking with the client's details typed in." };
  }
}

/**
 * The picked quote's client details for the inspector. The contact comes only
 * from the quote's own ContactID (document → ContactID → that contact).
 */
export async function quoteSnapshotAction(number: string): Promise<{ snapshot: QuoteSnapshot; contactId: string } | { error: string }> {
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "Xero is not connected on this site." };
  if (!/^QU-?\d{1,8}$/i.test(number.trim())) return { error: "That quote number does not look right." };
  try {
    await adminOpsDb({ permission: "manageOperations" });
    const found = await getXeroDocumentWithContact(createXeroBridgeClient(config), "quote", number.trim());
    const c = found.contact;
    const address = [c.addressLine, c.city, c.region].filter(Boolean).join(", ") || null;
    return {
      contactId: found.contactId,
      snapshot: {
        quote_id: found.document.id ?? null,
        number: found.document.number,
        status: found.document.status,
        client: c.name,
        person: c.person,
        phone: c.phone,
        email: c.email,
        reference: found.document.reference,
        title: found.document.title,
        total: found.document.total,
        address,
        fetched_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof XeroDocumentError) return { error: error.message };
    console.error("[calendar] quote snapshot:", error instanceof Error ? error.message : error);
    return { error: "Xero did not answer. Try again in a moment." };
  }
}

/** Re-read an inspection's quote from Xero and update its stored details (only when asked). */
export async function refreshInspectionAction(bookingId: string): Promise<AdminActionState> {
  if (!UUID_RE.test(bookingId)) return actionFailure("That booking could not be found.");
  try {
    const { db, admin } = await adminOpsDb({ permission: "manageOperations" });
    const { data: booking } = await db.from("ops_bookings").select("id, version, quote_number, project_id").eq("id", bookingId).maybeSingle();
    if (!booking?.quote_number) return actionFailure("This booking has no Xero quote.");
    const r = await quoteSnapshotAction(String(booking.quote_number));
    if ("error" in r) return actionFailure(r.error);
    const { error } = await db.rpc("ops_calendar_save_booking", {
      p: { id: booking.id, expected_version: booking.version, quote_snapshot: r.snapshot, quote_contact_id: r.contactId },
      p_actor: admin.user.id,
      p_actor_label: admin.profile.full_name || admin.profile.email,
    });
    if (error) return actionFailure(describeBookingSaveError(error));
    refresh((booking.project_id as string | null) ?? null);
    return actionSuccess("Client details refreshed from Xero.");
  } catch (error) {
    return fail("refresh inspection", error);
  }
}
