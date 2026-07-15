export const RFQ_STATUSES = [
  "new",
  "reviewing",
  "site_measurement_required",
  "information_required",
  "ready_for_quote",
  "converted",
  "closed",
  "spam",
  "archived",
] as const;

export type RfqStatus = (typeof RFQ_STATUSES)[number];

export const ASSET_MEASUREMENT_STATUSES = [
  "customer_estimate",
  "calculated_estimate",
  "drawing_received",
  "site_measurement_required",
  "under_review",
  "confirmed_for_quote",
  "superseded",
] as const;

export type AssetMeasurementStatus = (typeof ASSET_MEASUREMENT_STATUSES)[number];

export const INFO_REQUEST_FIELDS = [
  { id: "total_area", label: "Total area" },
  { id: "top_dimensions", label: "Top dimensions" },
  { id: "bottom_dimensions", label: "Bottom dimensions" },
  { id: "depth", label: "Depth" },
  { id: "side_slope", label: "Side slope" },
  { id: "diameter", label: "Diameter" },
  { id: "height", label: "Height" },
  { id: "capacity", label: "Capacity" },
  { id: "material_preference", label: "Material preference" },
  { id: "photographs", label: "Photographs" },
  { id: "drawing", label: "Drawing" },
  { id: "inlet_outlet", label: "Inlet/outlet details" },
  { id: "site_location", label: "Site location" },
  { id: "access_conditions", label: "Access conditions" },
  { id: "foundation_details", label: "Foundation details" },
  { id: "other", label: "Other" },
] as const;
