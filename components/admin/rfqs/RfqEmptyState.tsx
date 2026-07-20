import Link from "next/link";

type RfqEmptyStateProps = {
  variant: "none" | "filtered";
};

export function RfqEmptyState({ variant }: RfqEmptyStateProps) {
  if (variant === "none") {
    return (
      <div className="rfq-empty-state">
        <h2>No RFQs have been received yet.</h2>
        <p>Public quote requests will appear here after submission.</p>
        <div className="rfq-empty-state__actions">
          <Link href="/quote/" className="btn btn--md btn--secondary">
            Open public quote form
          </Link>
          <Link href="/quote/" className="btn btn--md btn--primary">
            Create RFQ manually
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rfq-empty-state">
      <h2>No RFQs match these filters.</h2>
      <p>Try changing or clearing the current filters.</p>
      <div className="rfq-empty-state__actions">
        <Link href="/admin/rfqs/" className="btn btn--md btn--primary">
          Clear filters
        </Link>
      </div>
    </div>
  );
}
