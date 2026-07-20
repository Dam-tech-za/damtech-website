"use client";

import { AdminButton } from "@/components/admin/ui/AdminButton";
import { RfqActionMenu } from "./RfqActionMenu";
import type { RfqDeleteSummary } from "@/lib/admin/rfqs/delete-rfq";

type RfqRowActionsProps = {
  summary: RfqDeleteSummary;
  canManage: boolean;
  canDelete: boolean;
  compact?: boolean;
  onDeleted?: () => void;
};

export function RfqRowActions({
  summary,
  canManage,
  canDelete,
  compact,
  onDeleted,
}: RfqRowActionsProps) {
  const detailHref = `/admin/rfqs/${summary.id}/`;

  return (
    <div
      className={`rfq-row-actions${compact ? " rfq-row-actions--compact" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      {!compact ? (
        <AdminButton href={detailHref} size="sm" variant="outline">
          View
        </AdminButton>
      ) : null}
      <RfqActionMenu
        summary={summary}
        canManage={canManage}
        canDelete={canDelete}
        compact={compact}
        onDeleted={onDeleted}
      />
    </div>
  );
}
