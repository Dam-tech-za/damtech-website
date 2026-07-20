"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

export async function upsertCrewAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    productivity_rate: formData.get("productivity_rate")
      ? Number(formData.get("productivity_rate"))
      : null,
    productivity_unit: String(formData.get("productivity_unit") ?? "").trim() || null,
    minimum_hours: formData.get("minimum_hours")
      ? Number(formData.get("minimum_hours"))
      : null,
    is_active: true,
  };
  if (!payload.code || !payload.name) return;

  const { data, error } = await supabase
    .from("labour_crews")
    .upsert(payload, { onConflict: "code" })
    .select("id")
    .single();
  if (error) {
    console.error("[pricing] crew upsert failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "labour_crew_upserted",
    entityType: "labour_crew",
    entityId: data?.id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/labour/");
}

export async function upsertCrewMemberAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "managePricing" });
  const supabase = await createClient();
  const payload = {
    crew_id: String(formData.get("crew_id") ?? ""),
    labour_item_id: String(formData.get("labour_item_id") ?? ""),
    quantity: Number(formData.get("quantity") ?? 1) || 1,
  };
  if (!payload.crew_id || !payload.labour_item_id) return;

  const { error } = await supabase
    .from("labour_crew_members")
    .upsert(payload, { onConflict: "crew_id,labour_item_id" });
  if (error) {
    console.error("[pricing] crew member upsert failed:", error.message);
    return;
  }
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "labour_crew_member_upserted",
    entityType: "labour_crew",
    entityId: payload.crew_id,
    afterData: payload,
  });
  revalidatePath("/admin/pricing/labour/");
}
