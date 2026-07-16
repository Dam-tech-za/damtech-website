type AdminStatusBadgeProps = {
  status: string;
  label?: string;
  domain?: "rfq" | "quote" | "pricing" | "system" | "generic";
};

function humanize(status: string): string {
  return status.replaceAll("_", " ");
}

export function AdminStatusBadge({
  status,
  label,
  domain = "generic",
}: AdminStatusBadgeProps) {
  const safe = status || "unknown";
  return (
    <span
      className={`admin-status admin-status--${safe} admin-status-badge admin-status-badge--${domain}`}
    >
      {label || humanize(safe)}
    </span>
  );
}
