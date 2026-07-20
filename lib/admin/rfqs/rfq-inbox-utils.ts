export function countActiveAdvancedFilters(
  filters: Record<string, string | undefined>,
): number {
  const advancedKeys = [
    "source",
    "service",
    "province",
    "assigned",
    "from",
    "to",
    "measurementRequired",
    "hasCalculator",
    "hasDrawings",
    "hasAttachments",
    "minMaterialArea",
    "maxMaterialArea",
    "minTankCapacity",
    "maxTankCapacity",
    "sizeUnit",
    "assetType",
    "materialPreference",
    "measurementMethod",
  ];
  return advancedKeys.filter((key) => Boolean(filters[key]?.trim())).length;
}

export function buildFilterParams(
  filters: Record<string, string | undefined>,
  omit: string[] = [],
): URLSearchParams {
  return new URLSearchParams(
    Object.entries(filters)
      .filter(([k, v]) => Boolean(v?.trim()) && !omit.includes(k))
      .map(([k, v]) => [k, String(v)]),
  );
}

export function formatSubmittedDate(iso: string): {
  dateLine: string;
  timeLine: string;
  relative: string;
  tooltip: string;
} {
  const date = new Date(iso);
  const dateLine = date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLine = date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tooltip = date.toLocaleString("en-ZA");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  let relative = "";
  if (diffDays === 0) relative = "Today";
  else if (diffDays === 1) relative = "Yesterday";
  else if (diffDays > 1 && diffDays < 7) relative = `${diffDays} days ago`;

  return { dateLine, timeLine, relative, tooltip };
}

export function canViewRfqContact(role: string): boolean {
  return role !== "viewer";
}
