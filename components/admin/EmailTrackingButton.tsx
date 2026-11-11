"use client";

import { useState, useTransition } from "react";
import { emailOrderTrackingAction } from "@/app/admin/orders/actions";

export function EmailTrackingButton({ orderId, email }: { orderId: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="ops-courier">
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Email the saved courier and tracking details to ${email}?`)) return;
          setResult(null);
          startTransition(async () => setResult(await emailOrderTrackingAction(orderId)));
        }}
      >
        {pending ? "Sending…" : "Email tracking to customer"}
      </button>
      {result ? (
        <p
          className={`admin-action-message admin-action-message--${result.ok ? "success" : "error"}`}
          role={result.ok ? "status" : "alert"}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
