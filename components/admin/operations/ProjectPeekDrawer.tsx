"use client";

import Link from "next/link";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import { PAYMENT_LABEL_TEXT } from "@/lib/operations/board";
import { formatLocationCell } from "@/lib/operations/distance";
import type { BoardProject } from "@/lib/operations/queries";
import { PaymentPictureBadge } from "./PaymentPictureBadge";
import { PhoneCell } from "./PhoneCell";
import { formatOpsMoney } from "./ops-format";

export function ProjectPeekDrawer({
  project,
  onClose,
}: {
  project: BoardProject | null;
  onClose: () => void;
}) {
  return (
    <AdminDrawer open={Boolean(project)} title={project?.title || "Project"} onClose={onClose}>
      {project ? (
        <dl className="ops-peek">
          <div>
            <dt>Lead</dt>
            <dd>{project.leadName || "—"}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              <PaymentPictureBadge payment={project.payment} />
              {project.payment.label && project.payment.overdue ? (
                <span className="ops-table__meta"> {PAYMENT_LABEL_TEXT[project.payment.label]}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>
              <PhoneCell name={project.contact_person || project.customer_name} phone={project.contact_phone} />
            </dd>
          </div>
          <div>
            <dt>Xero</dt>
            <dd>
              {[...(project.xero_quote_numbers ?? []), ...(project.xero_invoice_numbers ?? [])].join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt>Value</dt>
            <dd>{formatOpsMoney(project.quoted_total_incl_vat)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{formatLocationCell(project) || "—"}</dd>
          </div>
          <div className="ops-peek__full">
            <Link href={`/admin/operations/projects/${project.id}/`} className="admin-btn admin-btn--secondary admin-btn--sm">
              Open full details
            </Link>
          </div>
        </dl>
      ) : null}
    </AdminDrawer>
  );
}
