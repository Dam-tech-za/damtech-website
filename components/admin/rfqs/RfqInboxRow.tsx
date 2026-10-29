"use client";

import { useRouter } from "next/navigation";
import type { RfqDeleteSummary } from "@/lib/admin/rfqs/delete-rfq";
import {
  RFQ_STATUS_LABELS,
  type RfqInboxRow,
  type RfqOptionalColumnId,
} from "@/lib/admin/rfqs/rfq-inbox-types";
import { approximateSizeSourceLabel } from "@/lib/admin/rfqs/rfq-size-summary";
import { formatSubmittedDate } from "@/lib/admin/rfqs/rfq-inbox-utils";
import { AdminStatusBadge } from "@/components/admin/ui";
import { RfqRowActions } from "./RfqRowActions";
import { CountryFlag } from "@/components/admin/operations/CountryFlag";
import { displayPhone } from "@/lib/operations/phone-display";

type RfqInboxRowProps = {
  row: RfqInboxRow;
  selected: boolean;
  onToggle: (id: string) => void;
  showContact: boolean;
  optionalColumns: RfqOptionalColumnId[];
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

function locationPrimary(row: RfqInboxRow): string {
  if (row.projectLocation && row.province) {
    return `${row.projectLocation}, ${row.province}`;
  }
  return row.projectLocation || row.province || "Not provided";
}

export function RfqInboxTableRow({
  row,
  selected,
  onToggle,
  showContact,
  optionalColumns,
  canManage,
  canDelete,
  onDeleted,
}: RfqInboxRowProps) {
  const router = useRouter();
  const submitted = formatSubmittedDate(row.submittedAt);
  const detailHref = `/admin/rfqs/${row.id}/`;
  const sizeSource = approximateSizeSourceLabel(row.approximateSize.source);

  function handleRowClick(event: React.MouseEvent<HTMLTableRowElement>) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "a, button, input, select, [role='menu'], [role='menuitem']",
      )
    ) {
      return;
    }
    router.push(detailHref);
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(detailHref);
    }
  }

  return (
    <tr
      className={`rfq-inbox-row${selected ? " is-selected" : ""}`}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      aria-label={`RFQ for ${row.customerName}`}
      aria-selected={selected}
    >
      <td className="rfq-inbox-row__checkbox rfq-col-check admin-sheet__check">
        <label className="sr-only" htmlFor={`select-${row.id}`}>
          Select {row.customerName}
        </label>
        <input
          id={`select-${row.id}`}
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(row.id)}
          onClick={(event) => event.stopPropagation()}
        />
      </td>

      {optionalColumns.includes("rfqNumber") ? (
        <td className="rfq-col-rfq">
          <span className="rfq-inbox-row__mono rfq-inbox-row__truncate">
            {row.rfqNumber}
          </span>
        </td>
      ) : null}

      <td className="rfq-inbox-row__customer rfq-col-customer admin-sheet__lead">
        <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate">
          {row.customerName}
        </span>
        {row.companyName || row.sourceBadgeLabel ? (
          <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate">
            {row.companyName ? (
              <span>{row.companyName}</span>
            ) : null}
            {row.companyName && row.sourceBadgeLabel ? (
              <span className="rfq-col-source-inline"> · {row.sourceBadgeLabel}</span>
            ) : row.sourceBadgeLabel ? (
              <span className="rfq-col-source-inline">{row.sourceBadgeLabel}</span>
            ) : null}
          </span>
        ) : null}
      </td>

      <td className="rfq-inbox-row__contact rfq-col-contact">
        {showContact ? (
          <>
            {row.phone ? (
              <a
                href={`tel:${row.phone.replace(/\s/g, "")}`}
                className="rfq-inbox-row__contact-line rfq-inbox-row__truncate admin-sheet__phone"
                aria-label={`Phone ${row.customerName}`}
                title={row.phone}
                onClick={(event) => event.stopPropagation()}
              >
                <CountryFlag country={displayPhone(row.phone)?.country} />
                {displayPhone(row.phone)?.text ?? row.phone}
              </a>
            ) : null}
            {row.email ? (
              <a
                href={`mailto:${row.email}`}
                className="rfq-inbox-row__contact-line rfq-inbox-row__truncate admin-sheet__phone"
                aria-label={`Email ${row.customerName}`}
                title={row.email}
                onClick={(event) => event.stopPropagation()}
              >
                {row.email}
              </a>
            ) : null}
            {!row.phone && !row.email ? (
              <span className="rfq-inbox-row__muted admin-sheet__empty admin-sheet__empty">Not provided</span>
            ) : null}
          </>
        ) : (
          <span className="rfq-inbox-row__muted admin-sheet__empty admin-sheet__empty">Restricted</span>
        )}
      </td>

      <td className="rfq-inbox-row__location rfq-col-location">
        {row.projectLocation || row.province ? (
          <>
            <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate rfq-col-location-combined">
              {locationPrimary(row)}
            </span>
            {row.projectLocation && row.province ? (
              <>
                <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate rfq-col-location-town">
                  {row.projectLocation}
                </span>
                <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate rfq-col-location-province">
                  {row.province}
                </span>
              </>
            ) : (
              <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate rfq-col-location-town">
                {row.projectLocation || row.province}
              </span>
            )}
          </>
        ) : (
          <span className="rfq-inbox-row__muted admin-sheet__empty admin-sheet__empty">Not provided</span>
        )}
      </td>

      <td className="rfq-inbox-row__service rfq-col-service">
        <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate">
          {row.serviceLabel}
        </span>
        {row.projectSummary ? (
          <span
            className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate"
            title={row.projectSummary}
          >
            {row.projectSummary}
          </span>
        ) : null}
        {row.approximateSize.displayValue ? (
          <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate rfq-col-size-inline">
            {row.approximateSize.displayValue}
            {sizeSource ? ` · ${sizeSource}` : ""}
          </span>
        ) : null}
      </td>

      {optionalColumns.includes("size") ? (
      <td className="rfq-inbox-row__size rfq-col-size">
        {row.approximateSize.displayValue ? (
          <>
            <span className="rfq-inbox-row__primary admin-sheet__main rfq-inbox-row__truncate">
              {row.approximateSize.displayValue}
            </span>
            {sizeSource ? (
              <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate rfq-col-size-meta">
                {sizeSource}
              </span>
            ) : null}
          </>
        ) : (
          <span className="rfq-inbox-row__muted admin-sheet__empty admin-sheet__empty">Not provided</span>
        )}
      </td>
      ) : null}

      <td className="rfq-inbox-row__status rfq-col-status">
        <AdminStatusBadge
          status={row.status}
          label={RFQ_STATUS_LABELS[row.status]}
          domain="rfq"
        />
        {row.assignedUserName ? (
          <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-inbox-row__truncate rfq-col-assigned">
            Assigned to {row.assignedUserName}
          </span>
        ) : optionalColumns.includes("assigned") ? (
          <span className="rfq-inbox-row__muted admin-sheet__empty rfq-col-assigned">Unassigned</span>
        ) : null}
      </td>

      <td className="rfq-inbox-row__submitted rfq-col-submitted">
        <span className="rfq-inbox-row__primary admin-sheet__main" title={submitted.tooltip}>
          {submitted.dateLine}
        </span>
        <span className="rfq-inbox-row__secondary admin-sheet__sub rfq-col-submitted-time">
          {submitted.timeLine}
        </span>
      </td>

      {optionalColumns.includes("lastUpdated") ? (
        <td className="rfq-inbox-row__muted admin-sheet__empty rfq-col-updated">
          {formatSubmittedDate(row.updatedAt).dateLine}
        </td>
      ) : null}

      <td className="rfq-inbox-row__actions rfq-col-actions admin-sheet__actions">
        <RfqRowActions
          summary={toDeleteSummary(row)}
          canManage={canManage}
          canDelete={canDelete}
          onDeleted={onDeleted}
        />
      </td>
    </tr>
  );
}

