"use client";

import { useEffect } from "react";
import {
  buildCatalogueAnalyticsFromLine,
  buildCatalogueAnalyticsItem,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import type { CatalogueLineSnapshot, CatalogueProduct } from "@/lib/catalogue";
import { pushCatalogueAnalytics } from "./pushCatalogueAnalytics";

export function ViewItemAnalytics({ product }: { product: CatalogueProduct }) {
  useEffect(() => {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.viewItem,
      buildCatalogueAnalyticsItem(product, 1),
    );
  }, [product]);

  return null;
}

export function BeginInvoiceRequestAnalytics({
  line,
}: {
  line: CatalogueLineSnapshot;
}) {
  useEffect(() => {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.beginInvoiceRequest,
      buildCatalogueAnalyticsFromLine(line),
    );
  }, [line]);

  return null;
}
