"use client";

import { useState, useTransition } from "react";
import {
  duplicateQuoteAction,
  generatePdfAction,
  getPdfUrlAction,
  reviseQuoteAction,
  revokePublicTokenAction,
  sendQuoteAction,
  transitionQuoteAction,
} from "@/app/admin/quotes/actions";

type Props = {
  quoteId: string;
  status: string;
  email: string;
  canApprove: boolean;
  canSend: boolean;
  canRevise: boolean;
  isOwner: boolean;
  hasPdf: boolean;
};

export function QuoteActionsClient(props: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string } | void>) {
    startTransition(async () => {
      setMessage(null);
      const result = await fn();
      if (result && "ok" in result && !result.ok) {
        setMessage(result.error || "Action failed.");
      } else {
        setMessage(`${label} completed.`);
      }
    });
  }

  return (
    <div className="admin-quote-actions">
      {message ? <p className="admin-flash">{message}</p> : null}
      <div className="admin-panel__actions">
        {props.status === "draft" ? (
          <button
            type="button"
            className="btn btn--md btn--secondary"
            disabled={pending}
            onClick={() =>
              run("Submit for review", () =>
                transitionQuoteAction(props.quoteId, "internal_review"),
              )
            }
          >
            Submit for review
          </button>
        ) : null}
        {props.status === "internal_review" && props.canApprove ? (
          <button
            type="button"
            className="btn btn--md btn--primary"
            disabled={pending}
            onClick={() =>
              run("Approve", () => transitionQuoteAction(props.quoteId, "approved"))
            }
          >
            Approve
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--md btn--secondary"
          disabled={pending}
          onClick={() =>
            run("Generate PDF", () => generatePdfAction(props.quoteId))
          }
        >
          Generate PDF
        </button>
        {props.hasPdf ? (
          <button
            type="button"
            className="btn btn--md btn--secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await getPdfUrlAction(props.quoteId);
                if (result.ok) window.open(result.url, "_blank");
                else setMessage(result.error);
              })
            }
          >
            Download PDF
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--md btn--secondary"
          disabled={pending}
          onClick={() => run("Duplicate", () => duplicateQuoteAction(props.quoteId))}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="btn btn--md btn--secondary"
          disabled={pending}
          onClick={() =>
            run("Revoke public link", () => revokePublicTokenAction(props.quoteId))
          }
        >
          Revoke link
        </button>
      </div>

      {props.canSend ? (
        <form
          className="admin-form-grid"
          style={{ marginTop: "1rem" }}
          action={(formData) => {
            run("Send quote", () => sendQuoteAction(props.quoteId, formData));
          }}
        >
          <label className="admin-field">
            <span>Recipient email</span>
            <input
              className="form-input"
              name="recipientEmail"
              type="email"
              defaultValue={props.email}
              required
            />
          </label>
          {props.isOwner && props.status !== "approved" ? (
            <label className="admin-field">
              <span>
                <input type="checkbox" name="ownerOverride" /> Owner override (send
                without approval)
              </span>
            </label>
          ) : null}
          {["sent", "viewed"].includes(props.status) ? (
            <label className="admin-field">
              <span>
                <input type="checkbox" name="resend" /> Confirm resend
              </span>
            </label>
          ) : null}
          <button className="btn btn--md btn--primary" type="submit" disabled={pending}>
            Send quotation email
          </button>
        </form>
      ) : null}

      {props.canRevise ? (
        <form
          className="admin-form-grid"
          style={{ marginTop: "1rem" }}
          action={(formData) => {
            run("Create revision", () => reviseQuoteAction(props.quoteId, formData));
          }}
        >
          <label className="admin-field admin-field--full">
            <span>Revision reason</span>
            <input className="form-input" name="reason" required placeholder="Why revise?" />
          </label>
          <button className="btn btn--md btn--secondary" type="submit" disabled={pending}>
            Create revision
          </button>
        </form>
      ) : null}
    </div>
  );
}
