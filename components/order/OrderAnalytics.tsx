"use client";

import { useEffect } from "react";
import {
  buildCatalogueAnalyticsItem,
  CATALOGUE_ANALYTICS_EVENTS,
} from "@/lib/catalogue/analytics";
import { pushCatalogueAnalytics } from "@/components/catalogue/pushCatalogueAnalytics";
import type { CatalogueProduct } from "@/lib/catalogue";

export function OrderFormViewAnalytics({
  product,
  quantity,
}: {
  product: CatalogueProduct;
  quantity: number;
}) {
  useEffect(() => {
    pushCatalogueAnalytics(
      CATALOGUE_ANALYTICS_EVENTS.orderFormView,
      buildCatalogueAnalyticsItem(product, quantity),
    );
  }, [product, quantity]);

  return null;
}
