export {
  calculateTravelCost,
  calculateDeliveryCost,
  type TravelInputs,
  type TravelResult,
  type DeliveryInputs,
  type DeliveryResult,
} from "@/lib/estimating/travel";

export type TravelCalculatorInput = {
  distanceBasis: "one_way" | "return";
  oneWayDistanceKm: number;
  returnDistanceKm?: number;
  trips: number;
  vehicles: number;
  ratePerKm: number;
  tollFees?: number;
  accommodation?: number;
  subsistence?: number;
  travelLabourHours?: number;
  travelLabourRate?: number;
};

export function resolveReturnDistanceKm(input: TravelCalculatorInput): number {
  if (input.distanceBasis === "return") {
    return Math.max(0, input.returnDistanceKm ?? input.oneWayDistanceKm);
  }
  return Math.max(0, input.oneWayDistanceKm * 2);
}

export function calculateTravelQuoteQuantity(input: TravelCalculatorInput): {
  returnDistanceKm: number;
  quoteQuantityKm: number;
} {
  const returnDistanceKm = resolveReturnDistanceKm(input);
  const trips = Math.max(1, input.trips);
  const vehicles = Math.max(1, input.vehicles);
  return {
    returnDistanceKm,
    quoteQuantityKm: Math.round(returnDistanceKm * trips * vehicles * 100) / 100,
  };
}
