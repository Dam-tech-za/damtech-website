"use client";

import { AdminErrorState } from "@/components/admin/ui/AdminErrorState";

export default function ProjectsBoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-stack--page ops">
      <AdminErrorState
        title="Projects could not be loaded."
        message={error.message?.trim() || "Refresh in a moment, or go back to Operations."}
        incidentId={error.digest}
      />
      <p>
        <button type="button" className="admin-btn admin-btn--secondary" onClick={reset}>
          Try again
        </button>
      </p>
    </div>
  );
}
