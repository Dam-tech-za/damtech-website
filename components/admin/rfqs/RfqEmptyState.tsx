import { AdminButton } from "@/components/admin/ui";

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
          <AdminButton href="/quote/" variant="secondary">
            Open public quote form
          </AdminButton>
          <AdminButton href="/quote/" variant="primary">
            Create RFQ manually
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rfq-empty-state">
      <h2>No RFQs match these filters.</h2>
      <p>Try changing or clearing the current filters.</p>
      <div className="rfq-empty-state__actions">
        <AdminButton href="/admin/rfqs/" variant="primary">
          Clear filters
        </AdminButton>
      </div>
    </div>
  );
}
