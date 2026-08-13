"use client";

import { useState, useTransition } from "react";
import { resendOrderConfirmationAction } from "@/app/admin/orders/actions";

export function ResendOrderConfirmationButton({ orderId }: { orderId: string }) {
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
            const result = await resendOrderConfirmationAction(orderId);
            setMessage(
              result.ok
                ? "Customer confirmation resent."
                : result.error || "Resend failed.",
            );
          });
        }}
      >
        {pending ? "Sending…" : "Resend confirmation"}
      </button>
      {message ? <p className="admin-empty__hint">{message}</p> : null}
    </div>
  );
}
