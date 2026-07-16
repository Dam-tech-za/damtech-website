"use client";

import { useState, useTransition } from "react";
import { resendRfqAdminNotificationAction } from "@/app/admin/settings/system/actions";

export function ResendRfqNotificationButton({ rfqId }: { rfqId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await resendRfqAdminNotificationAction(rfqId);
            setMessage(
              result.ok
                ? "Admin notification resent."
                : result.error || "Resend failed.",
            );
          });
        }}
      >
        {pending ? "Sending…" : "Resend admin notification"}
      </button>
      {message ? <p className="admin-empty__hint">{message}</p> : null}
    </div>
  );
}
