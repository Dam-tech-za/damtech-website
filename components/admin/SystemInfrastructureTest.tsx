"use client";

import { useState, useTransition } from "react";
import { testRfqInfrastructureAction } from "@/app/admin/settings/system/actions";

export function SystemInfrastructureTest() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof testRfqInfrastructureAction>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(sendTestEmail: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const next = await testRfqInfrastructureAction({ sendTestEmail });
        setResult(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Test failed.");
      }
    });
  }

  return (
    <section className="admin-panel__section" style={{ marginTop: "1.5rem" }}>
      <h3 className="admin-subheading">Test RFQ infrastructure</h3>
      <p className="admin-empty__hint">
        Probes database connectivity and rate-limit providers. Optional Resend
        test does not create a customer RFQ.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="admin-btn"
          disabled={pending}
          onClick={() => run(false)}
        >
          {pending ? "Testing…" : "Run infrastructure test"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={pending}
          onClick={() => run(true)}
        >
          Run test + send Resend email
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <ul className="admin-list" style={{ marginTop: "1rem" }}>
          {result.checks.map((check) => (
            <li key={check.name}>
              <strong>{check.name}</strong>: {check.status} — {check.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
