import { ORDER_FULFILMENT_METHOD } from "./types.ts";

/**
 * Fixed-price catalogue fulfilment is delivery-only throughout South Africa.
 * Do not advertise a public collection point or customer pickup.
 * Pretoria may be used internally as a dispatch origin only.
 */
export const DELIVERY_FULFILMENT = {
  method: ORDER_FULFILMENT_METHOD,
  label: "Delivery only",
  shortLabel: "Delivery only",
  paymentMethodLabel: "Invoice payment",
  paymentExplanation:
    "Your order will be recorded immediately. DamTech will send the formal invoice separately. Payment must only be made using the banking details shown on the official DamTech invoice.",
    explanation:
    "DamTech delivers throughout South Africa. The advertised product price excludes delivery and installation. Delivery is calculated from the kit shipping weight in kilograms. DamTech will confirm the delivery charge on the formal invoice.",
  deliveryChargeNotice:
    "Delivery is calculated from the kit shipping weight in kilograms. DamTech will confirm the delivery charge on the formal invoice.",
  configured: true as const,
} as const;

export function isDeliveryFulfilmentConfigured(): boolean {
  return (
    DELIVERY_FULFILMENT.configured &&
    DELIVERY_FULFILMENT.method === ORDER_FULFILMENT_METHOD
  );
}
