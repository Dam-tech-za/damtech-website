"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sendEnquiriesToXeroAction } from "@/app/admin/rfqs/actions";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { CountryFlag } from "@/components/admin/operations/CountryFlag";
import { formatSubmittedDate } from "@/lib/admin/rfqs/rfq-inbox-utils";
import type { RfqInboxRow } from "@/lib/admin/rfqs/rfq-inbox-types";
import { displayPhone } from "@/lib/operations/phone-display";
import { RfqStatusCell } from "./RfqStatusCell";

/** South African numbers for wa.me: 082… → 2782…. */
function whatsappHref(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0(?=\d{9}$)/, "27");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

/**
 * The quick view that opens beside the list when an enquiry is clicked,
 * like the project details panel: who, how to reach them, what they want,
 * the status, and Send to Xero. Everything else is on the full page.
 */
export function RfqPeekDrawer({
  row,
  canManage,
  onClose,
}: {
  row: RfqInboxRow | null;
  canManage: boolean;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setResult(null);
    onClose();
  };

  return (
    <AdminDrawer open={Boolean(row)} title={row ? row.companyName || row.customerName : "Enquiry"} onClose={close}>
      {row ? (
        <div className="ops-peek-form rfq-peek">
          <dl className="rfq-peek__list">
            <div>
              <dt>Customer</dt>
              <dd>
                {row.customerName}
                {row.companyName ? <span className="rfq-peek__muted"> · {row.companyName}</span> : null}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {row.phone ? (
                  <a className="admin-sheet__phone" href={`tel:${row.phone.replace(/\s/g, "")}`}>
                    <CountryFlag country={displayPhone(row.phone)?.country} />
                    {displayPhone(row.phone)?.text ?? row.phone}
                  </a>
                ) : (
                  <span className="rfq-peek__muted">Not provided</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{row.email ? <a href={`mailto:${row.email}`}>{row.email}</a> : <span className="rfq-peek__muted">Not provided</span>}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{[row.projectLocation, row.province].filter(Boolean).join(", ") || <span className="rfq-peek__muted">Not provided</span>}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{row.serviceLabel}</dd>
            </div>
            {row.projectSummary ? (
              <div>
                <dt>What they need</dt>
                <dd className="rfq-peek__text">{row.projectSummary}</dd>
              </div>
            ) : null}
            <div>
              <dt>Received</dt>
              <dd>
                {formatSubmittedDate(row.submittedAt).dateLine} {formatSubmittedDate(row.submittedAt).timeLine} · {row.rfqNumber}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <RfqStatusCell rfqId={row.id} status={row.status} label={row.customerName} canEdit={canManage} />
              </dd>
            </div>
          </dl>

          <div className="rfq-peek__actions">
            {row.phone ? (
              <a className="admin-btn admin-btn--secondary admin-btn--sm" href={`tel:${row.phone.replace(/\s/g, "")}`}>
                Call
              </a>
            ) : null}
            {whatsappHref(row.phone) ? (
              <a className="admin-btn admin-btn--secondary admin-btn--sm" href={whatsappHref(row.phone)!} target="_blank" rel="noopener">
                WhatsApp
              </a>
            ) : null}
            {row.email ? (
              <a className="admin-btn admin-btn--secondary admin-btn--sm" href={`mailto:${row.email}?subject=${encodeURIComponent(`Your Damtech enquiry ${row.rfqNumber}`)}`}>
                Email
              </a>
            ) : null}
          </div>

          {canManage ? (
            <div className="rfq-peek__xero">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await sendEnquiriesToXeroAction([row.id]);
                    setResult({ ok: r.ok, message: r.message });
                  })
                }
              >
                {pending ? "Sending…" : "Send to Xero as a contact"}
              </button>
              {result ? <p className={result.ok ? "rfq-peek__ok" : "rfq-peek__err"}>{result.message}</p> : null}
            </div>
          ) : null}

          <Link href={`/admin/rfqs/${row.id}/`} className="admin-btn admin-btn--ghost admin-btn--sm rfq-peek__full">
            Open full details
          </Link>
        </div>
      ) : null}
    </AdminDrawer>
  );
}
