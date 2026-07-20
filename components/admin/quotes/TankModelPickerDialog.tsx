"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AdminButton,
  AdminDialog,
  AdminField,
  AdminInput,
} from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";

export type TankModelRecord = {
  id: string;
  modelCode: string;
  modelName: string;
  supplierName: string | null;
  nominalCapacityKl: number | null;
  usableCapacityKl: number | null;
  diameterM: number | null;
  heightM: number | null;
  basePrice: number | null;
  installationPrice: number | null;
  validTo: string | null;
  isActive: boolean;
};

type TankModelPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  models: TankModelRecord[];
  showCost: boolean;
  onAddLines: (lines: EditableLine[]) => void;
};

export function TankModelPickerDialog({
  open,
  onClose,
  models,
  showCost,
  onAddLines,
}: TankModelPickerDialogProps) {
  const [requiredCapacity, setRequiredCapacity] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [pending, startTransition] = useTransition();

  const suggestions = useMemo(() => {
    if (!requiredCapacity || requiredCapacity <= 0) return models.slice(0, 8);
    const eligible = models
      .filter((m) => m.isActive && (m.usableCapacityKl ?? 0) >= requiredCapacity)
      .sort((a, b) => (a.usableCapacityKl ?? 0) - (b.usableCapacityKl ?? 0));
    const match = eligible[0];
    if (!match) return models.slice(0, 5);
    const index = models.findIndex((m) => m.id === match.id);
    const below = index > 0 ? models[index - 1] : null;
    const above = eligible[1] ?? null;
    return [below, match, above].filter(Boolean) as TankModelRecord[];
  }, [models, requiredCapacity]);

  const selected = models.find((m) => m.id === selectedId) ?? null;

  function confirm() {
    if (!selected) return;
    startTransition(() => {
      const lines: EditableLine[] = [
        {
          sortOrder: 0,
          lineType: "custom",
          itemCode: selected.modelCode,
          category: "Tank systems",
          description: `${selected.modelName} corrugated steel tank kit`,
          quantity,
          unit: "tank",
          costUnitPrice: showCost ? selected.basePrice : null,
          sellUnitPrice: selected.basePrice ?? 0,
          discountPercent: 0,
          taxCategory: "standard",
          sourcePricingItemId: null,
          metadata: {
            pricingSource: {
              sourceType: "tank_model",
              pricingItemId: null,
              itemCode: selected.modelCode,
              tankModelId: selected.id,
              usableCapacityKl: selected.usableCapacityKl,
              requiredCapacityKl: requiredCapacity || null,
              confirmed: true,
              pricingCapturedAt: new Date().toISOString(),
            },
          },
        },
      ];

      if (includeInstallation && selected.installationPrice != null) {
        lines.push({
          sortOrder: 1,
          lineType: "labour",
          itemCode: `${selected.modelCode}-INSTALL`,
          category: "Tank installation",
          description: `${selected.modelName} installation`,
          quantity,
          unit: "tank",
          costUnitPrice: showCost ? selected.installationPrice : null,
          sellUnitPrice: selected.installationPrice,
          discountPercent: 0,
          taxCategory: "standard",
          metadata: {
            pricingSource: {
              sourceType: "tank_model",
              tankModelId: selected.id,
              role: "installation",
              pricingCapturedAt: new Date().toISOString(),
            },
          },
        });
      }

      if (includeDelivery) {
        lines.push({
          sortOrder: lines.length,
          lineType: "delivery",
          itemCode: "TANK-DELIVERY",
          category: "Delivery",
          description: `Delivery — ${selected.modelName}`,
          quantity: 1,
          unit: "item",
          costUnitPrice: null,
          sellUnitPrice: 0,
          discountPercent: 0,
          taxCategory: "standard",
          metadata: {
            pricingSource: {
              sourceType: "tank_model",
              tankModelId: selected.id,
              role: "delivery",
              priceRequired: true,
              pricingCapturedAt: new Date().toISOString(),
            },
          },
        });
      }

      onAddLines(lines);
      onClose();
    });
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Select tank model"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            disabled={!selected || pending}
            onClick={confirm}
          >
            Confirm selection
          </AdminButton>
        </>
      }
    >
      <div className="admin-form-grid">
        <AdminField label="Required capacity (kL)">
          <AdminInput
            type="number"
            step="0.1"
            value={requiredCapacity || ""}
            onChange={(e) => setRequiredCapacity(Number(e.target.value))}
          />
        </AdminField>
        <AdminField label="Quantity">
          <AdminInput
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </AdminField>
      </div>

      <p className="admin-help-text">
        Suggestions show the smallest active model meeting usable capacity, plus one below and one
        above where available. Confirm before adding quote lines.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Supplier</th>
              <th>Usable kL</th>
              <th>Ø / H</th>
              <th>Kit price</th>
              {showCost ? <th>Install</th> : null}
              <th />
            </tr>
          </thead>
          <tbody>
            {suggestions.map((model) => (
              <tr key={model.id}>
                <td>
                  <strong>{model.modelName}</strong>
                  <div className="admin-help-text">{model.modelCode}</div>
                </td>
                <td>{model.supplierName ?? "—"}</td>
                <td>{model.usableCapacityKl ?? "—"}</td>
                <td>
                  {model.diameterM ?? "—"} / {model.heightM ?? "—"}
                </td>
                <td>
                  {model.basePrice != null ? formatZar(model.basePrice) : "—"}
                </td>
                {showCost ? (
                  <td>
                    {model.installationPrice != null
                      ? formatZar(model.installationPrice)
                      : "—"}
                  </td>
                ) : null}
                <td>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant={selectedId === model.id ? "primary" : "secondary"}
                    onClick={() => setSelectedId(model.id)}
                  >
                    Select
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-stack" style={{ marginTop: "1rem" }}>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={includeInstallation}
            onChange={(e) => setIncludeInstallation(e.target.checked)}
          />
          Include installation line
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={includeDelivery}
            onChange={(e) => setIncludeDelivery(e.target.checked)}
          />
          Include delivery line (price to confirm)
        </label>
      </div>
    </AdminDialog>
  );
}
