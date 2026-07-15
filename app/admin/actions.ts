"use server";

import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/auth/audit";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const user = await getCurrentUser();

  if (user) {
    await writeAuditLog({
      actorUserId: user.id,
      actorEmail: user.email ?? null,
      action: "logout",
      entityType: "admin_auth",
      entityId: user.id,
    });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login/");
}
