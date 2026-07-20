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
import { AdminButton, AdminInput } from "@/components/admin/ui";

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
          <AdminButton
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run("Submit for review", () =>
                transitionQuoteAction(props.quoteId, "internal_review"),
              )
            }
          >
            Submit for review
          </AdminButton>
        ) : null}
        {props.status === "internal_review" && props.canApprove ? (
          <AdminButton
            variant="primary"
            disabled={pending}
            onClick={() =>
              run("Approve", () => transitionQuoteAction(props.quoteId, "approved"))
            }
          >
            Approve
          </AdminButton>
        ) : null}
        <AdminButton
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run("Generate PDF", () => generatePdfAction(props.quoteId))
          }
        >
          Generate PDF
        </AdminButton>
        {props.hasPdf ? (
          <AdminButton
            variant="secondary"
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
          </AdminButton>
        ) : null}
        <AdminButton
          variant="secondary"
          disabled={pending}
          onClick={() => run("Duplicate", () => duplicateQuoteAction(props.quoteId))}
        >
          Duplicate
        </AdminButton>
        <AdminButton
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run("Revoke public link", () => revokePublicTokenAction(props.quoteId))
          }
        >
          Revoke link
        </AdminButton>
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
            <AdminInput
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
          <AdminButton type="submit" variant="primary" disabled={pending}>
            Send quotation email
          </AdminButton>
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
            <AdminInput name="reason" required placeholder="Why revise?" />
          </label>
          <AdminButton type="submit" variant="secondary" disabled={pending}>
            Create revision
          </AdminButton>
        </form>
      ) : null}
    </div>
  );
}
