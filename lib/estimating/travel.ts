import { addMoney, multiplyMoney, roundMoney } from "./money";

export type TravelInputs = {
  returnKm: number;
  trips: number;
  ratePerKm: number;
  tollFees?: number;
  accommodation?: number;
  subsistence?: number;
  travelLabourHours?: number;
  travelLabourRate?: number;
  manualAdjustment?: number;
  vehicleType?: string;
};

export type TravelResult = {
  distanceCost: number;
  tollFees: number;
  accommodation: number;
  subsistence: number;
  travelLabourCost: number;
  manualAdjustment: number;
  total: number;
  vehicleType: string | null;
};

/**
 * distance_cost = return_km × trips × rate_per_km
 */
export function calculateTravelCost(input: TravelInputs): TravelResult {
  const returnKm = Math.max(0, input.returnKm || 0);
  const trips = Math.max(0, input.trips || 0);
  const ratePerKm = Math.max(0, input.ratePerKm || 0);

  const distanceCost = roundMoney(returnKm * trips * ratePerKm);
  const tollFees = roundMoney(input.tollFees || 0);
  const accommodation = roundMoney(input.accommodation || 0);
  const subsistence = roundMoney(input.subsistence || 0);
  const travelLabourCost = roundMoney(
    (input.travelLabourHours || 0) * (input.travelLabourRate || 0),
  );
  const manualAdjustment = roundMoney(input.manualAdjustment || 0);

  return {
    distanceCost,
    tollFees,
    accommodation,
    subsistence,
    travelLabourCost,
    manualAdjustment,
    total: addMoney(
      distanceCost,
      tollFees,
      accommodation,
      subsistence,
      travelLabourCost,
      manualAdjustment,
    ),
    vehicleType: input.vehicleType?.trim() || null,
  };
}

export type DeliveryInputs = {
  supplierToSiteKm: number;
  deliveries: number;
  ratePerKm: number;
  fixedDeliveryCost?: number;
  craneOffloading?: number;
  specialHandling?: number;
  loadType?: string;
};

export type DeliveryResult = {
  distanceCost: number;
  fixedDeliveryCost: number;
  craneOffloading: number;
  specialHandling: number;
  total: number;
  loadType: string | null;
};

export function calculateDeliveryCost(input: DeliveryInputs): DeliveryResult {
  const distanceCost = roundMoney(
    Math.max(0, input.supplierToSiteKm || 0) *
      Math.max(0, input.deliveries || 0) *
      Math.max(0, input.ratePerKm || 0),
  );
  const fixedDeliveryCost = roundMoney(input.fixedDeliveryCost || 0);
  const craneOffloading = roundMoney(input.craneOffloading || 0);
  const specialHandling = roundMoney(input.specialHandling || 0);

  return {
    distanceCost,
    fixedDeliveryCost,
    craneOffloading,
    specialHandling,
    total: addMoney(
      distanceCost,
      fixedDeliveryCost,
      craneOffloading,
      specialHandling,
    ),
    loadType: input.loadType?.trim() || null,
  };
}

export function scaleTravelWithBurden(
  travelTotal: number,
  burdenPercent: number,
): number {
  return multiplyMoney(travelTotal, 1 + Math.max(0, burdenPercent) / 100);
}
