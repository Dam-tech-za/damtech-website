import { UNRESOLVED_BUSINESS_FACTS } from "../catalogue/unresolved.ts";
import { isUnresolvedFact } from "../catalogue/types.ts";
import { ORDER_FULFILMENT_METHOD } from "./types.ts";

/**
 * Fixed-price checkout fulfilment. DamTech-arranged transport is never part
 * of this total — it stays on the RFQ path.
 *
 * A genuine collection address must be configured before Merchant eligibility
 * can be considered. Do not invent a walk-in office or depot.
 */
export const COLLECTION_FULFILMENT = {
  method: ORDER_FULFILMENT_METHOD,
  label: "Collection / customer-arranged transport",
  paymentMethodLabel: "Invoice payment",
  paymentExplanation:
    "Your order will be recorded immediately. DamTech will send the formal invoice separately. Payment must only be made using the banking details shown on the official DamTech invoice.",
  explanation:
    "The advertised price excludes transport. DamTech will confirm the applicable collection point and collection arrangements on your invoice.",
  location: {
    configured: false as const,
    displayName: null,
    addressLines: null as readonly string[] | null,
    unresolved: UNRESOLVED_BUSINESS_FACTS.collectionLocation,
  },
} as const;

export function isCollectionLocationConfigured(): boolean {
  return (
    COLLECTION_FULFILMENT.location.configured &&
    Boolean(COLLECTION_FULFILMENT.location.displayName) &&
    Boolean(COLLECTION_FULFILMENT.location.addressLines?.length) &&
    !isUnresolvedFact(COLLECTION_FULFILMENT.location.unresolved)
  );
}

/**
 * Public checkout must not show the missing-address Merchant blocker.
 * Returns configured address lines only; otherwise empty.
 */
export function collectionLocationDisplayLines(): readonly string[] {
  if (!isCollectionLocationConfigured()) return [];
  return COLLECTION_FULFILMENT.location.addressLines ?? [];
}
