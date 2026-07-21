"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AdminButton,
  AdminDialog,
  AdminField,
  AdminInput,
} from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import { suggestTankModels } from "@/lib/pricing/tank-import/matching";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";

export type TankModelRecord = {
  id: string;
  modelCode: string;
  modelName: string;
  supplierName: string | null;
  supplierModelCode?: string | null;
  ringCount?: number | null;
  nominalCapacityKl: number | null;
  usableCapacityKl: number | null;
  diameterM: number | null;
  heightM: number | null;
  basePrice: number | null;
  installationPrice: number | null;
  priceVersionId?: string | null;
  steelCost?: number | null;
  steelSell?: number | null;
  linerCost?: number | null;
  linerSell?: number | null;
  roofIncluded?: boolean;
  roofSell?: number | null;
  foundationIncluded?: boolean;
  foundationSell?: number | null;
  installationIncluded?: boolean;
  totalSell?: number | null;
  requiresManualConfirmation?: boolean;
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

function baseSource(model: TankModelRecord, role: string, requiredCapacity: number) {
  return {
    sourceType: "tank_model" as const,
    pricingItemId: null,
    itemCode: model.modelCode,
    tankModelId: model.id,
    tankCode: model.modelCode,
    priceVersionId: model.priceVersionId ?? null,
    diameterM: model.diameterM,
    heightM: model.heightM,
    ringCount: model.ringCount ?? null,
    nominalCapacityKl: model.nominalCapacityKl,
    usableCapacityKl: model.usableCapacityKl,
    requiredCapacityKl: requiredCapacity || null,
    supplierModelCode: model.supplierModelCode ?? null,
    role,
    confirmed: true,
    pricingCapturedAt: new Date().toISOString(),
  };
}

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
  const [combined, setCombined] = useState(false);
  const [includeLiner, setIncludeLiner] = useState(true);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeRoof, setIncludeRoof] = useState(false);
  const [includeFoundation, setIncludeFoundation] = useState(false);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [includeCrane, setIncludeCrane] = useState(false);
  const [pending, startTransition] = useTransition();

  const suggestions = useMemo(() => {
    if (!requiredCapacity || requiredCapacity <= 0) return models.slice(0, 8);
    return suggestTankModels(models, requiredCapacity).map((s) => s.model);
  }, [models, requiredCapacity]);

  const selected = models.find((m) => m.id === selectedId) ?? null;

  function pctVsRequired(model: TankModelRecord): string {
    if (!requiredCapacity || !model.usableCapacityKl) return "";
    const pct = Math.round(((model.usableCapacityKl - requiredCapacity) / requiredCapacity) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  function confirm() {
    if (!selected) return;
    const model = selected;
    startTransition(() => {
      const capacityLabel =
        model.usableCapacityKl != null ? `${Math.round(model.usableCapacityKl)} kL` : model.modelName;

      const steelSell = model.steelSell ?? model.basePrice ?? 0;

      if (combined) {
        const total =
          model.totalSell ??
          steelSell +
            (includeLiner ? model.linerSell ?? 0 : 0) +
            (includeInstallation ? model.installationPrice ?? 0 : 0);
        onAddLines([
          {
            sortOrder: 0,
            lineType: "custom",
            itemCode: model.modelCode,
            category: "Tank systems",
            description: `Supply and installation of ${capacityLabel} corrugated steel water-storage reservoir with reinforced PVC liner`,
            quantity,
            unit: "tank",
            costUnitPrice: showCost ? model.steelCost ?? null : null,
            sellUnitPrice: total,
            discountPercent: 0,
            taxCategory: "standard",
            sourcePricingItemId: null,
            metadata: { pricingSource: baseSource(model, "combined_package", requiredCapacity) },
          },
        ]);
        onClose();
        return;
      }

      const lines: EditableLine[] = [];
      const push = (
        lineType: EditableLine["lineType"],
        code: string,
        category: string,
        description: string,
        sell: number | null,
        cost: number | null,
        role: string,
        opts: { priceRequired?: boolean; qty?: number; unit?: string } = {},
      ) => {
        lines.push({
          sortOrder: lines.length,
          lineType,
          itemCode: code,
          category,
          description,
          quantity: opts.qty ?? quantity,
          unit: opts.unit ?? "tank",
          costUnitPrice: showCost ? cost : null,
          sellUnitPrice: sell ?? 0,
          discountPercent: 0,
          taxCategory: "standard",
          sourcePricingItemId: null,
          metadata: {
            pricingSource: {
              ...baseSource(model, role, requiredCapacity),
              ...(opts.priceRequired ? { priceRequired: true } : {}),
            },
          },
        });
      };

      push(
        "custom",
        model.modelCode,
        "Tank systems",
        `Supply of ${capacityLabel} corrugated steel water-storage reservoir`,
        steelSell,
        model.steelCost ?? null,
        "steel_structure",
      );

      if (includeLiner) {
        push(
          "custom",
          `${model.modelCode}-LINER`,
          "Tank liner",
          `Supply of reinforced PVC liner manufactured for the ${capacityLabel} reservoir`,
          model.linerSell ?? null,
          model.linerCost ?? null,
          "pvc_liner",
          { priceRequired: model.linerSell == null || model.linerSell === 0 },
        );
      }

      if (includeInstallation) {
        push(
          "labour",
          `${model.modelCode}-INSTALL`,
          "Tank installation",
          `Assembly and erection of corrugated steel reservoir and installation of reinforced PVC liner`,
          model.installationPrice,
          null,
          "installation",
          { priceRequired: model.installationPrice == null || model.installationPrice === 0 },
        );
      }

      if (includeRoof) {
        push(
          "custom",
          `${model.modelCode}-ROOF`,
          "Tank roof",
          `Roof for ${capacityLabel} reservoir`,
          model.roofSell ?? null,
          null,
          "roof",
          { priceRequired: model.roofSell == null || model.roofSell === 0 },
        );
      }

      if (includeFoundation) {
        push(
          "custom",
          `${model.modelCode}-FOUNDATION`,
          "Tank foundation",
          `Foundation allowance for ${capacityLabel} reservoir`,
          model.foundationSell ?? null,
          null,
          "foundation",
          { priceRequired: model.foundationSell == null || model.foundationSell === 0 },
        );
      }

      if (includeDelivery) {
        push("delivery", "TANK-DELIVERY", "Delivery", `Delivery — ${model.modelName}`, 0, null, "delivery", {
          priceRequired: true,
          qty: 1,
          unit: "item",
        });
      }

      if (includeCrane) {
        push("custom", "TANK-CRANE", "Crane / offloading", `Crane / offloading — ${model.modelName}`, 0, null, "crane", {
          priceRequired: true,
          qty: 1,
          unit: "item",
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
      size="wide"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="button" variant="primary" disabled={!selected || pending} onClick={confirm}>
            Add quote lines
          </AdminButton>
        </>
      }
    >
      <div className="admin-form-grid">
        <AdminField label="Required usable capacity (kL)">
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
        above where available. Nothing is auto-selected — confirm before adding quote lines.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Supplier</th>
              <th>Usable kL</th>
              <th>vs required</th>
              <th>Ø / H</th>
              <th>Steel sell</th>
              <th>Liner sell</th>
              <th>Total</th>
              <th>R/kL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {suggestions.map((model) => {
              const perKl =
                model.totalSell != null && model.usableCapacityKl
                  ? formatZar(Math.round((model.totalSell / model.usableCapacityKl) * 100) / 100)
                  : "—";
              return (
                <tr key={model.id}>
                  <td>
                    <strong>{model.modelName}</strong>
                    <div className="admin-help-text">{model.modelCode}</div>
                  </td>
                  <td>{model.supplierName ?? "—"}</td>
                  <td>{model.usableCapacityKl ?? "—"}</td>
                  <td>{pctVsRequired(model) || "—"}</td>
                  <td>
                    {model.diameterM ?? "—"} / {model.heightM ?? "—"}
                  </td>
                  <td>{model.steelSell != null ? formatZar(model.steelSell) : model.basePrice != null ? formatZar(model.basePrice) : "—"}</td>
                  <td>{model.linerSell != null ? formatZar(model.linerSell) : "—"}</td>
                  <td>{model.totalSell != null ? formatZar(model.totalSell) : "—"}</td>
                  <td>{perKl}</td>
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
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admin-stack" style={{ marginTop: "1rem" }}>
        <label className="admin-checkbox">
          <input type="checkbox" checked={combined} onChange={(e) => setCombined(e.target.checked)} />
          Combined tank package (single opaque line)
        </label>
        {!combined ? (
          <>
            <label className="admin-checkbox">
              <input type="checkbox" checked={includeLiner} onChange={(e) => setIncludeLiner(e.target.checked)} />
              Reinforced PVC liner line
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={includeInstallation}
                onChange={(e) => setIncludeInstallation(e.target.checked)}
              />
              Tank and liner installation line
            </label>
            <label className="admin-checkbox">
              <input type="checkbox" checked={includeRoof} onChange={(e) => setIncludeRoof(e.target.checked)} />
              Roof line
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={includeFoundation}
                onChange={(e) => setIncludeFoundation(e.target.checked)}
              />
              Foundation line
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={includeDelivery}
                onChange={(e) => setIncludeDelivery(e.target.checked)}
              />
              Delivery line (price to confirm)
            </label>
            <label className="admin-checkbox">
              <input type="checkbox" checked={includeCrane} onChange={(e) => setIncludeCrane(e.target.checked)} />
              Crane / offloading line (price to confirm)
            </label>
          </>
        ) : null}
      </div>
    </AdminDialog>
  );
}
