"use client";

import { useState } from "react";
import { AdminButton, AdminDialog, AdminField, AdminInput, AdminSelect } from "@/components/admin/ui";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { calculateAreaQuantity, calculateRollQuantity } from "@/lib/pricing/calculate-material";
import { calculateCoverageQuantity } from "@/lib/pricing/calculate-coverage";
import {
  calculateTravelCost,
  calculateTravelQuoteQuantity,
  type TravelCalculatorInput,
} from "@/lib/pricing/calculate-travel";

type QuantityCalculatorDialogProps = {
  open: boolean;
  onClose: () => void;
  item: PricingItemRecord;
  onApply: (quantity: number, calculation: Record<string, unknown>) => void;
};

export function QuantityCalculatorDialog({
  open,
  onClose,
  item,
  onApply,
}: QuantityCalculatorDialogProps) {
  const meta = item.metadata;
  const [measuredArea, setMeasuredArea] = useState(0);
  const [overlap, setOverlap] = useState(item.overlapPercent);
  const [waste, setWaste] = useState(item.wastePercent);
  const [coats, setCoats] = useState(Number((meta as Record<string, unknown>).numberOfCoats ?? 1));
  const [packSize, setPackSize] = useState(Number((meta as Record<string, unknown>).packSize ?? 0));
  const [consumption, setConsumption] = useState(item.coverageRate ?? 0);

  const [travelBasis, setTravelBasis] = useState<"one_way" | "return">("one_way");
  const [oneWayKm, setOneWayKm] = useState(0);
  const [returnKm, setReturnKm] = useState(0);
  const [trips, setTrips] = useState(1);
  const [vehicles, setVehicles] = useState(1);
  const [ratePerKm, setRatePerKm] = useState(Number(meta.sellRatePerKm ?? 0));

  const isTravel = item.itemType === "travel" || item.itemType === "delivery";
  const isCoverage =
    item.pricingMethod === "calculated_consumption" || item.coverageRate != null;

  function handleApply() {
    if (isTravel) {
      const input: TravelCalculatorInput = {
        distanceBasis: travelBasis,
        oneWayDistanceKm: oneWayKm,
        returnDistanceKm: returnKm,
        trips,
        vehicles,
        ratePerKm,
      };
      const distance = calculateTravelQuoteQuantity(input);
      const cost = calculateTravelCost({
        returnKm: distance.returnDistanceKm,
        trips,
        ratePerKm,
      });
      onApply(distance.quoteQuantityKm, {
        calculator: "travel",
        ...input,
        returnDistanceKm: distance.returnDistanceKm,
        quoteQuantityKm: distance.quoteQuantityKm,
        calculatedCost: cost.total,
      });
      return;
    }

    if (isCoverage && packSize > 0) {
      const result = calculateCoverageQuantity({
        treatmentAreaM2: measuredArea,
        consumptionRate: consumption,
        numberOfCoats: coats,
        wastePercent: waste,
        packSize,
      });
      onApply(result.quoteQuantityM2, { calculator: "coverage", ...result });
      return;
    }

    const area = calculateAreaQuantity({
      measuredAreaM2: measuredArea,
      overlapPercent: overlap,
      wastePercent: waste,
    });
    const rollWidth = Number(meta.rollWidthM ?? 0);
    const rollLength = Number(meta.rollLengthM ?? 0);
    const grossRoll = rollWidth * rollLength;
    const rolls =
      grossRoll > 0
        ? calculateRollQuantity({
            procurementAreaM2: area.procurementAreaM2,
            grossAreaPerRollM2: grossRoll,
            usableAreaPerRollM2: Number(meta.usableAreaPerRollM2 ?? grossRoll),
          })
        : null;

    onApply(area.procurementAreaM2, {
      calculator: "area",
      ...area,
      rolls,
    });
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Calculate quantity"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="button" variant="primary" onClick={handleApply}>
            Apply quantity
          </AdminButton>
        </>
      }
    >
      <p className="admin-help-text">{item.name}</p>

      {isTravel ? (
        <div className="admin-stack">
          <AdminField label="Distance basis">
            <AdminSelect
              value={travelBasis}
              onChange={(e) => setTravelBasis(e.target.value as "one_way" | "return")}
            >
              <option value="one_way">One-way supplied</option>
              <option value="return">Return supplied</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="One-way distance (km)">
            <AdminInput type="number" value={oneWayKm} onChange={(e) => setOneWayKm(Number(e.target.value))} />
          </AdminField>
          {travelBasis === "return" ? (
            <AdminField label="Return distance (km)">
              <AdminInput type="number" value={returnKm} onChange={(e) => setReturnKm(Number(e.target.value))} />
            </AdminField>
          ) : null}
          <AdminField label="Trips">
            <AdminInput type="number" value={trips} onChange={(e) => setTrips(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Vehicles">
            <AdminInput type="number" value={vehicles} onChange={(e) => setVehicles(Number(e.target.value))} />
          </AdminField>
        </div>
      ) : isCoverage && packSize > 0 ? (
        <div className="admin-stack">
          <AdminField label="Treatment area (m²)">
            <AdminInput type="number" value={measuredArea} onChange={(e) => setMeasuredArea(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Consumption rate">
            <AdminInput type="number" step="0.01" value={consumption} onChange={(e) => setConsumption(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Coats">
            <AdminInput type="number" value={coats} onChange={(e) => setCoats(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Waste %">
            <AdminInput type="number" value={waste} onChange={(e) => setWaste(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Pack size">
            <AdminInput type="number" value={packSize} onChange={(e) => setPackSize(Number(e.target.value))} />
          </AdminField>
        </div>
      ) : (
        <div className="admin-stack">
          <AdminField label="Measured area (m²)">
            <AdminInput type="number" value={measuredArea} onChange={(e) => setMeasuredArea(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Overlap %">
            <AdminInput type="number" value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} />
          </AdminField>
          <AdminField label="Waste %">
            <AdminInput type="number" value={waste} onChange={(e) => setWaste(Number(e.target.value))} />
          </AdminField>
        </div>
      )}
    </AdminDialog>
  );
}
