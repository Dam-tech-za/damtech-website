import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminSuppliersRedirectPage() {
  await requireAdmin();
  redirect("/admin/pricing/suppliers/");
}
