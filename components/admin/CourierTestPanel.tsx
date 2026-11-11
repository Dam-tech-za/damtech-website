"use client";

import { useState, useTransition } from "react";
import { testCourierConnectionAction, type CourierTestResult } from "@/app/admin/orders/courier-test-action";

export function CourierTestPanel() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CourierTestResult | null>(null);

  return (
    <div className="ops-courier">
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        disabled={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => setResult(await testCourierConnectionAction()));
        }}
      >
        {pending ? "Asking The Courier Guy…" : "Test Courier Guy connection"}
      </button>
      {result ? (
        <>
          <p
            className={`admin-action-message admin-action-message--${result.ok ? "success" : "error"}`}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}
          </p>
          {result.lines.length > 0 ? (
            <ul className="ops-courier__test">
              {result.lines.map((line) => (
                <li key={line.label} data-ok={line.ok}>
                  <strong>{line.ok ? "OK" : "Failed"}</strong> {line.label}
                  <span className="admin-muted"> {line.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
