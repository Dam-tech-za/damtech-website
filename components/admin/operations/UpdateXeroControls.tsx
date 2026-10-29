"use client";

/**
 * Silent K&S49 contact repair on board load.
 * The old bulk "Update Xero" button is removed — use the selection-bar
 * "From Xero" review card instead (never silent overwrite).
 */

import { useEffect, useState } from "react";
import { restoreCorruptedXeroContactsAction } from "@/app/admin/operations/project-actions";

export function UpdateXeroControls() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void restoreCorruptedXeroContactsAction().then((r) => {
      if (r.restored > 0) {
        setMessage(`Restored client details on ${r.restored} project${r.restored === 1 ? "" : "s"}.`);
      }
    });
  }, []);

  if (!message) return null;
  return (
    <p className="ops-xero-update ops-xero-update--quiet" role="status">
      {message}
    </p>
  );
}
