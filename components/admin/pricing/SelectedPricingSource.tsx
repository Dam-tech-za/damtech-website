"use client";

export type MaterialSearchItem = {
  id: string;
  item_code: string;
  category: string;
  name: string;
  description: string | null;
  unit: string;
  default_cost: number | null;
  default_sell_price: number | null;
  waste_percent: number | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type LabourSearchItem = {
  id: string;
  item_code: string;
  category: string;
  name: string;
  unit: string;
  hourly_cost: number | null;
  unit_cost: number | null;
  productivity_rate: number | null;
  productivity_unit: string | null;
  notes: string | null;
  is_active?: boolean;
};

export type SupplierPriceRecord = {
  id: string;
  supplier_id: string;
  material_item_id: string;
  supplier_sku: string | null;
  unit_cost: number;
  currency: string;
  minimum_quantity: number | null;
  price_valid_from: string | null;
  price_valid_to: string | null;
  lead_time_days: number | null;
  is_preferred: boolean;
  quote_reference: string | null;
  notes: string | null;
  supplier_name: string | null;
  expired: boolean;
};

export type PricingSourceMetadata = {
  pricingCapturedAt?: string;
  sourceType?: "material" | "labour";
  material?: {
    id: string;
    itemCode: string;
    name: string;
    description: string | null;
    unit: string;
    category: string;
    costUnitPrice: number | null;
    sellUnitPrice: number;
    supplierPriceId: string | null;
    supplierName: string | null;
    supplierSku: string | null;
    supplierValidTo: string | null;
  };
  labour?: {
    id: string;
    itemCode: string;
    name: string;
    unit: string;
    category: string;
    costUnitPrice: number | null;
    sellUnitPrice: number;
    productivityRate: number | null;
    productivityUnit: string | null;
    estimatedHours: number | null;
    hoursOverride: number | null;
    hoursOverrideReason: string | null;
  };
};

type Props = {
  metadata: Record<string, unknown> | null | undefined;
  compact?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatMoney(value: unknown) {
  if (value == null || value === "") return "—";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return "—";
  return `R ${number.toFixed(2)}`;
}

export function SelectedPricingSource({ metadata, compact = false }: Props) {
  const source = isRecord(metadata?.pricingSource) ? (metadata?.pricingSource as PricingSourceMetadata) : null;
  if (!source) return null;

  if (source.sourceType === "labour" && source.labour) {
    return (
      <div className={`admin-empty${compact ? " admin-empty--compact" : ""}`}>
        <p>
          <strong>Labour source</strong> {source.labour.itemCode} · {source.labour.name}
        </p>
        <p className="admin-empty__hint">
          {source.labour.category} · {source.labour.unit} · Cost {formatMoney(source.labour.costUnitPrice)} · Sell {formatMoney(source.labour.sellUnitPrice)}
        </p>
        <p className="admin-empty__hint">
          Productivity: {source.labour.productivityRate ?? "—"}
          {source.labour.productivityUnit ? ` ${source.labour.productivityUnit}` : ""}
          {source.labour.estimatedHours != null ? ` · Est. hours ${source.labour.estimatedHours.toFixed(2)}` : ""}
        </p>
        {source.labour.hoursOverride != null ? (
          <p className="admin-empty__hint">
            Override: {source.labour.hoursOverride.toFixed(2)}
            {source.labour.hoursOverrideReason ? ` · ${source.labour.hoursOverrideReason}` : ""}
          </p>
        ) : null}
        {source.pricingCapturedAt ? (
          <p className="admin-empty__hint">Captured {new Date(source.pricingCapturedAt).toLocaleString("en-ZA")}</p>
        ) : null}
      </div>
    );
  }

  if (source.material) {
    return (
      <div className={`admin-empty${compact ? " admin-empty--compact" : ""}`}>
        <p>
          <strong>Material source</strong> {source.material.itemCode} · {source.material.name}
        </p>
        <p className="admin-empty__hint">
          {source.material.category} · {source.material.unit} · Cost {formatMoney(source.material.costUnitPrice)} · Sell {formatMoney(source.material.sellUnitPrice)}
        </p>
        <p className="admin-empty__hint">
          Supplier: {source.material.supplierName ?? "—"}
          {source.material.supplierSku ? ` · SKU ${source.material.supplierSku}` : ""}
          {source.material.supplierValidTo ? ` · Valid to ${source.material.supplierValidTo}` : ""}
        </p>
        {source.pricingCapturedAt ? (
          <p className="admin-empty__hint">Captured {new Date(source.pricingCapturedAt).toLocaleString("en-ZA")}</p>
        ) : null}
      </div>
    );
  }

  return null;
}
