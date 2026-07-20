import Link from "next/link";
import type { ReactNode } from "react";

type RfqPageHeaderProps = {
  canExport: boolean;
  canManage: boolean;
  exportHref: string;
  refreshSlot?: ReactNode;
};

export function RfqPageHeader({
  canExport,
  canManage,
  exportHref,
  refreshSlot,
}: RfqPageHeaderProps) {
  return (
    <header className="admin-page-header rfq-page-header">
      <div className="admin-page-header__copy">
        <h1 className="admin-page-header__title">RFQs</h1>
        <p className="admin-page-header__description">
          Review incoming enquiries, contact customers and prepare requests for
          quotation.
        </p>
      </div>
      <div className="admin-page-header__actions">
        {refreshSlot}
        {canExport ? (
          <Link href={exportHref} className="btn btn--md btn--secondary">
            Export
          </Link>
        ) : null}
        {canManage ? (
          <Link href="/quote/" className="btn btn--md btn--primary">
            Create RFQ
          </Link>
        ) : null}
      </div>
    </header>
  );
}
