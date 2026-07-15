"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

export async function upsertCustomerAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin({ permission: "manageCustomers" });
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "") || null;
  const payload = {
    customer_type: String(formData.get("customer_type") ?? "individual"),
    name: String(formData.get("name") ?? "").trim(),
    company_name: String(formData.get("company_name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    province: String(formData.get("province") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    vat_number: String(formData.get("vat_number") ?? "").trim() || null,
  };

  if (!payload.name) return;

  if (id) {
    const { error } = await supabase.from("customers").update(payload).eq("id", id);
    if (error) {
      console.error("[customers] update failed:", error.message);
      return;
    }
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "customer_updated",
      entityType: "customer",
      entityId: id,
      afterData: payload,
    });
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...payload, created_by: admin.user.id })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[customers] create failed:", error?.message);
      return;
    }
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "customer_created",
      entityType: "customer",
      entityId: data.id,
      afterData: payload,
    });
  }

  revalidatePath("/admin/customers/");
}
