import { AdminButton } from "@/components/admin/ui";

type RfqEmptyStateProps = {
  variant: "none" | "filtered";
};

export function RfqEmptyState({ variant }: RfqEmptyStateProps) {
  if (variant === "none") {
    return (
      <div className="rfq-empty-state">
        <h2>No open enquiries. Nice.</h2>
        <p>New quote requests from the website will appear here.</p>
        <div className="rfq-empty-state__actions">
          <AdminButton href="/admin/rfqs/?status=all" variant="secondary">
            See all enquiries
          </AdminButton>
          <AdminButton href="/quote/" variant="primary">
            Log an enquiry
          </AdminButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rfq-empty-state">
      <h2>No enquiries match.</h2>
      <p>Try another status above, or clear the search and filters.</p>
      <div className="rfq-empty-state__actions">
        <AdminButton href="/admin/rfqs/" variant="primary">
          Clear filters
        </AdminButton>
      </div>
    </div>
  );
}
