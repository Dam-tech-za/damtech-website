"use client";

import { useRef, useState } from "react";
import {
  AdminPortalMenu,
  type AdminPortalMenuItem,
} from "@/components/admin/ui/AdminPortalMenu";
import { DeleteRfqDialog } from "./DeleteRfqDialog";
import type { RfqDeleteSummary } from "@/lib/admin/rfqs/delete-rfq";

type RfqActionMenuProps = {
  summary: RfqDeleteSummary;
  canManage: boolean;
  canDelete: boolean;
  compact?: boolean;
  onDeleted?: () => void;
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RfqActionMenu({
  summary,
  canManage,
  canDelete,
  compact,
  onDeleted,
}: RfqActionMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const detailHref = `/admin/rfqs/${summary.id}/`;

  const items: AdminPortalMenuItem[] = [
    { id: "view", label: "View RFQ", href: detailHref },
    { id: "edit", label: "Edit", href: detailHref },
    ...(canManage
      ? ([
          { id: "sep-workflow", label: "", separator: true },
          { id: "assign", label: "Assign", href: `${detailHref}#assign` },
          {
            id: "status",
            label: "Update status",
            href: `${detailHref}#status`,
          },
          {
            id: "info",
            label: "Request information",
            href: `${detailHref}#information`,
          },
          {
            id: "convert",
            label: "Convert to quote",
            href: `${detailHref}#rfq-prepare-quote`,
          },
          { id: "sep-close", label: "", separator: true },
          {
            id: "close",
            label: "Close RFQ",
            href: `${detailHref}#status`,
            tone: "danger",
          },
        ] satisfies AdminPortalMenuItem[])
      : []),
    ...(canDelete
      ? ([
          { id: "sep-delete", label: "", separator: true },
          {
            id: "delete",
            label: "Delete RFQ",
            tone: "danger",
            icon: <TrashIcon />,
            onSelect: () => setDeleteOpen(true),
          },
        ] satisfies AdminPortalMenuItem[])
      : []),
  ];

  return (
    <>
      <AdminPortalMenu
        items={items}
        triggerLabel="More actions"
        triggerClassName={`rfq-row-actions__menu-btn${compact ? " rfq-row-actions__menu-btn--compact" : ""}`}
        menuClassName="admin-portal-menu__list rfq-action-menu__list"
        align="end"
        triggerRef={triggerRef}
      />

      <DeleteRfqDialog
        open={deleteOpen}
        summary={summary}
        returnFocusRef={triggerRef}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => {
          onDeleted?.();
        }}
      />
    </>
  );
}
