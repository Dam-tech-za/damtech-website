import type { DuplicateMode, ImportMode } from "@/lib/pricing/csv/commit";

export type ImportStepId = "upload" | "review" | "preview" | "import" | "complete";

export type PreviewFilter =
  | "all"
  | "ready"
  | "warnings"
  | "invalid"
  | "duplicates"
  | "manual";

export type ImportSettings = {
  importMode: ImportMode;
  duplicateMode: DuplicateMode;
  newPrices: "current" | "future";
  unknownSuppliers: "leave" | "create" | "review";
  manualConfirmation: "active_warning" | "inactive" | "exclude";
};

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  importMode: "valid_rows_only",
  duplicateMode: "skip",
  newPrices: "current",
  unknownSuppliers: "leave",
  manualConfirmation: "active_warning",
};
