type AdminLoadingStateProps = {
  rows?: number;
  label?: string;
};

export function AdminLoadingState({
  rows = 5,
  label = "Loading…",
}: AdminLoadingStateProps) {
  return (
    <div className="admin-ui-loading" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="admin-ui-loading__row" />
      ))}
    </div>
  );
}
