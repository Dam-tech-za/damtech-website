import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import type { AdminNavItemId } from "@/lib/auth/types";

type PlaceholderProps = {
  navId: AdminNavItemId;
  title: string;
  description: string;
};

export async function AdminModulePlaceholder({
  navId,
  title,
  description,
}: PlaceholderProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, navId)) {
    redirect("/admin/unauthorised/");
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>{title}</h2>
      </header>
      <div className="admin-empty">
        <p>{title} module coming soon.</p>
        <p className="admin-empty__hint">{description}</p>
      </div>
    </div>
  );
}
