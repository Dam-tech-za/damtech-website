import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminSettingsIndexPage() {
  await requireAdmin({ permission: "manageSettings" });
  redirect("/admin/settings/estimating/");
}
