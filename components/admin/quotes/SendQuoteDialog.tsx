"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminCheckbox,
  AdminDialog,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import { formatQuoteNumber } from "@/lib/quotes/types";
import { getQuoteAdminCcEmail, getQuoteReplyToEmail } from "@/lib/email/config";

export type SendQuoteDialogProps = {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  quoteNumber: string;
  revisionNumber: number;
  customerName: string;
  projectTitle: string;
  totalIncVat: number;
  validUntil: string;
  defaultEmail: string;
  defaultMessage?: string;
  canSendTest: boolean;
  onSend: (payload: SendQuotePayload) => Promise<{ ok: boolean; error?: string }>;
};

export type SendQuotePayload = {
  to: string;
  cc: string;
  bcc: string;
  replyTo: string;
  subject: string;
  message: string;
  attachPdf: boolean;
  includeSecureLink: boolean;
  ccAdmin: boolean;
  sendCopyToSelf: boolean;
  testOnly: boolean;
  ownerOverride: boolean;
};

function defaultSubject(quoteNumber: string, projectTitle: string): string {
  return `Damtech Quotation ${quoteNumber} — ${projectTitle}`;
}

function defaultMessage(customerName: string, quoteNumber: string, projectTitle: string, validUntil: string): string {
  return `Dear ${customerName},

Please find attached Damtech quotation ${quoteNumber} for ${projectTitle}.

The quotation is valid until ${validUntil}. You can review the attached PDF or open the secure quotation link below.

Please contact us if you require any clarification.

Kind regards
Damtech Structural Solutions`;
}

export function SendQuoteDialog({
  open,
  onClose,
  quoteId,
  quoteNumber,
  revisionNumber,
  customerName,
  projectTitle,
  totalIncVat,
  validUntil,
  defaultEmail,
  defaultMessage: initialMessage,
  canSendTest,
  onSend,
}: SendQuoteDialogProps) {
  const [to, setTo] = useState(defaultEmail);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [replyTo, setReplyTo] = useState(getQuoteReplyToEmail());
  const [subject, setSubject] = useState(defaultSubject(quoteNumber, projectTitle));
  const [message, setMessage] = useState(
    initialMessage ??
      defaultMessage(customerName, formatQuoteNumber(quoteNumber, revisionNumber).label, projectTitle, validUntil),
  );
  const [attachPdf, setAttachPdf] = useState(true);
  const [includeSecureLink, setIncludeSecureLink] = useState(true);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [sendCopyToSelf, setSendCopyToSelf] = useState(false);
  const [ownerOverride, setOwnerOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(testOnly: boolean) {
    setPending(true);
    setError(null);
    const result = await onSend({
      to,
      cc,
      bcc,
      replyTo,
      subject,
      message,
      attachPdf,
      includeSecureLink,
      ccAdmin,
      sendCopyToSelf,
      testOnly,
      ownerOverride,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Unable to send quotation.");
      return;
    }
    if (!testOnly) onClose();
  }

  const adminCc = getQuoteAdminCcEmail();
  const emailMissing = !to.trim();

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Send Quotation"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </AdminButton>
          {canSendTest ? (
            <AdminButton
              type="button"
              variant="secondary"
              disabled={pending || emailMissing}
              onClick={() => submit(true)}
            >
              Send test to myself
            </AdminButton>
          ) : null}
          <AdminButton
            type="button"
            variant="primary"
            disabled={pending || emailMissing}
            onClick={() => submit(false)}
          >
            {pending ? "Sending…" : "Send Quote"}
          </AdminButton>
        </>
      }
    >
      <input type="hidden" name="quoteId" value={quoteId} />

      <p className="admin-help-text">
        {formatQuoteNumber(quoteNumber, revisionNumber).label} · {customerName} ·{" "}
        {formatZar(totalIncVat)} · Valid until {validUntil}
      </p>

      {emailMissing ? (
        <p className="admin-field-error" role="alert">
          Customer email is required. Update the customer record or enter a recipient address.
        </p>
      ) : null}
      {error ? (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-stack">
        <AdminField label="To" required>
          <AdminInput type="email" value={to} onChange={(e) => setTo(e.target.value)} required />
        </AdminField>
        <AdminField label="CC">
          <AdminInput type="text" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Optional" />
        </AdminField>
        <AdminField label="Reply-to">
          <AdminInput type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
        </AdminField>
        <AdminField label="Subject" required>
          <AdminInput value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </AdminField>
        <AdminField label="Message" required>
          <AdminTextarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </AdminField>

        <div className="admin-stack">
          <AdminCheckbox
            label="Attach quotation PDF"
            checked={attachPdf}
            onChange={(e) => setAttachPdf(e.target.checked)}
          />
          <AdminCheckbox
            label="Include secure online quote link"
            checked={includeSecureLink}
            onChange={(e) => setIncludeSecureLink(e.target.checked)}
          />
          <AdminCheckbox
            label={`CC Damtech admin email (${adminCc})`}
            checked={ccAdmin}
            onChange={(e) => setCcAdmin(e.target.checked)}
          />
          <AdminCheckbox
            label="Send a copy to myself"
            checked={sendCopyToSelf}
            onChange={(e) => setSendCopyToSelf(e.target.checked)}
          />
          <AdminCheckbox
            label="Owner override (send without approval)"
            checked={ownerOverride}
            onChange={(e) => setOwnerOverride(e.target.checked)}
          />
        </div>

        <p className="admin-help-text">
          The quotation will be locked after sending. Further changes require a new revision.
        </p>
      </div>
    </AdminDialog>
  );
}
