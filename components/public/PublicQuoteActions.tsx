"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptPublicQuoteAction, rejectPublicQuoteAction } from "@/app/q/actions";

export function PublicQuoteActions({ token }: { token: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"none" | "accept" | "reject">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (mode === "none") {
    return (
      <div className="admin-panel__actions">
        <button
          type="button"
          className="btn btn--md btn--primary"
          onClick={() => setMode("accept")}
        >
          Accept quotation
        </button>
        <button
          type="button"
          className="btn btn--md btn--secondary"
          onClick={() => setMode("reject")}
        >
          Reject quotation
        </button>
      </div>
    );
  }

  if (mode === "accept") {
    return (
      <form
        className="admin-form-grid"
        action={(formData) => {
          startTransition(async () => {
            setError(null);
            const result = await acceptPublicQuoteAction(token, formData);
            if (!result.ok) setError(result.error);
            else router.push(`/q/${token}/accepted/`);
          });
        }}
      >
        <p>
          Electronic quotation acceptance records your agreement to the commercial
          terms shown. This is not presented as a qualified electronic signature.
        </p>
        <label className="admin-field">
          <span>Full name</span>
          <input className="form-input" name="acceptorName" required />
        </label>
        <label className="admin-field">
          <span>Job title (optional)</span>
          <input className="form-input" name="jobTitle" />
        </label>
        <label className="admin-field">
          <span>PO / reference (optional)</span>
          <input className="form-input" name="purchaseOrder" />
        </label>
        <label className="admin-field admin-field--full">
          <span>Note (optional)</span>
          <textarea className="form-input" name="note" rows={3} />
        </label>
        <label className="admin-field admin-field--full">
          <span>
            <input type="checkbox" name="confirmed" value="true" required /> I
            confirm acceptance of this quotation and its terms
          </span>
        </label>
        {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
        <div className="admin-panel__actions">
          <button className="btn btn--md btn--primary" type="submit" disabled={pending}>
            Confirm acceptance
          </button>
          <button
            type="button"
            className="btn btn--md btn--secondary"
            onClick={() => setMode("none")}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="admin-form-grid"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const result = await rejectPublicQuoteAction(token, formData);
          if (!result.ok) setError(result.error);
          else router.push(`/q/${token}/rejected/`);
        });
      }}
    >
      <label className="admin-field admin-field--full">
        <span>Reason (optional, sent privately to Damtech)</span>
        <textarea className="form-input" name="reason" rows={3} />
      </label>
      <label className="admin-field">
        <span>
          <input type="checkbox" name="requestRevision" /> Request a revised quotation
        </span>
      </label>
      <label className="admin-field admin-field--full">
        <span>
          <input type="checkbox" name="confirmed" value="true" required /> I confirm
          rejection of this quotation
        </span>
      </label>
      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
      <div className="admin-panel__actions">
        <button className="btn btn--md btn--primary" type="submit" disabled={pending}>
          Confirm rejection
        </button>
        <button
          type="button"
          className="btn btn--md btn--secondary"
          onClick={() => setMode("none")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
