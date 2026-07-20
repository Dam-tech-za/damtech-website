"use client";

import type { RfqDeleteSummary } from "@/lib/admin/rfqs/delete-rfq";
import {
  RFQ_STATUS_LABELS,
  type RfqInboxRow,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import { approximateSizeSourceLabel } from "@/lib/admin/rfqs/rfq-size-summary";
import { formatSubmittedDate } from "@/lib/admin/rfqs/rfq-inbox-utils";
import { AdminButton, AdminStatusBadge } from "@/components/admin/ui";
import { RfqRowActions } from "./RfqRowActions";

type RfqInboxCardProps = {
  row: RfqInboxRow;
  selected: boolean;
  onToggle: (id: string) => void;
  showContact: boolean;
  canManage: boolean;
  canDelete: boolean;
  onDeleted?: () => void;
};

function toDeleteSummary(row: RfqInboxRow): RfqDeleteSummary {
  return {
    id: row.id,
    rfqNumber: row.rfqNumber,
    customerName: row.customerName,
    companyName: row.companyName,
    serviceLabel: row.serviceLabel,
    submittedAt: row.submittedAt,
    status: row.status,
  };
}

export function RfqInboxCard({
  row,
  selected,
  onToggle,
  showContact,
  canManage,
  canDelete,
  onDeleted,
}: RfqInboxCardProps) {
  const submitted = formatSubmittedDate(row.submittedAt);
  const sizeLabel =
    row.approximateSize.displayValue ??
    "Not provided";
  const sizeSource = approximateSizeSourceLabel(row.approximateSize.source);

  return (
    <article className="rfq-inbox-card">
      <header className="rfq-inbox-card__header">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(row.id)}
            aria-label={`Select ${row.customerName}`}
          />
          <span className="rfq-inbox-card__customer">{row.customerName}</span>
        </label>
        <AdminStatusBadge
          status={row.status}
          label={RFQ_STATUS_LABELS[row.status]}
          domain="rfq"
        />
      </header>

      {row.companyName ? (
        <p className="rfq-inbox-card__company">{row.companyName}</p>
      ) : null}

      <div className="rfq-inbox-card__contact">
        {showContact && row.phone ? (
          <a href={`tel:${row.phone.replace(/\s/g, "")}`}>{row.phone}</a>
        ) : null}
        {showContact && row.email ? (
          <a href={`mailto:${row.email}`}>{row.email}</a>
        ) : null}
        {!showContact ? <span className="rfq-inbox-row__muted">Contact restricted</span> : null}
        {showContact && !row.phone && !row.email ? (
          <span className="rfq-inbox-row__muted">Not provided</span>
        ) : null}
      </div>

      <p className="rfq-inbox-card__location">
        {[row.projectLocation, row.province].filter(Boolean).join(", ") ||
          "Not provided"}
      </p>

      <p className="rfq-inbox-card__service">{row.serviceLabel}</p>
      <p className="rfq-inbox-card__size">
        {sizeLabel}
        {sizeSource ? ` · ${sizeSource}` : ""}
      </p>

      <footer className="rfq-inbox-card__footer">
        <span className="rfq-inbox-card__submitted">
          Submitted {submitted.dateLine}
          {submitted.relative ? ` · ${submitted.relative}` : ""}
        </span>
        <div className="rfq-inbox-card__actions">
          <AdminButton
            href={`/admin/rfqs/${row.id}/`}
            size="sm"
            variant="secondary"
          >
            View RFQ
          </AdminButton>
          <RfqRowActions
            summary={toDeleteSummary(row)}
            canManage={canManage}
            canDelete={canDelete}
            compact
            onDeleted={onDeleted}
          />
        </div>
      </footer>
    </article>
  );
}
