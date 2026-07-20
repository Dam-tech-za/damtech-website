"use client";

import { useState, useTransition } from "react";
import { AdminButton } from "@/components/admin/ui";
import type { LabourSyncResult } from "@/lib/pricing/sync-labour-item";

type LabourSyncButtonProps = {
  action: () => Promise<{
    ok: boolean;
    result?: LabourSyncResult;
    error?: string;
  }>;
};

export function LabourSyncButton({ action }: LabourSyncButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: "0.35rem", justifyItems: "end" }}>
      <AdminButton
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await action();
            if (!result.ok) {
              setMessage(result.error ?? "Synchronisation failed.");
              return;
            }
            const r = result.result!;
            setMessage(
              `Checked ${r.checked}: created ${r.created}, updated ${r.updated}, failed ${r.failed}.`,
            );
          });
        }}
      >
        {pending ? "Synchronising…" : "Synchronise labour catalogue"}
      </AdminButton>
      {message ? <span className="admin-help-text">{message}</span> : null}
    </div>
  );
}
