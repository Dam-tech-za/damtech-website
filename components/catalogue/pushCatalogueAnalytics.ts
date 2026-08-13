import {
  buildCatalogueAnalyticsPayload,
  type CatalogueAnalyticsItem,
} from "@/lib/catalogue/analytics";

export function pushCatalogueAnalytics(
  event: string,
  item: CatalogueAnalyticsItem,
  extra: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    ...buildCatalogueAnalyticsPayload(event, item),
    ...extra,
  });
}
