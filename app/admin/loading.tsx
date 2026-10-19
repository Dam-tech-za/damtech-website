import { AdminLoadingState } from "@/components/admin/ui";

/** Shown instantly while an admin page loads its data from the database. */
export default function AdminLoading() {
  return (
    <div className="admin-stack--page">
      <div className="admin-loading-title" aria-hidden />
      <AdminLoadingState rows={6} label="Loading page" />
    </div>
  );
}
