import type { QuoteLineType, QuoteStatus } from "./types";

export type VatPricingMode = "exclusive" | "inclusive";
export type DiscountType = "none" | "amount" | "percent";

export type EditableLine = {
  id?: string;
  sortOrder: number;
  lineType: QuoteLineType;
  itemCode: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  costUnitPrice: number | null;
  sellUnitPrice: number;
  discountPercent: number;
  taxCategory: "standard" | "exempt" | "zero";
  sourceMaterialItemId?: string | null;
  sourceLabourItemId?: string | null;
  sourceSupplierPriceId?: string | null;
  sourcePricingItemId?: string | null;
  metadata?: Record<string, unknown> | null;
  showCosting?: boolean;
};

export type QuoteBuilderDefaults = {
  quoteId?: string;
  quoteNumber?: string;
  revisionNumber?: number;
  status?: QuoteStatus;
  title: string;
  customerId: string;
  rfqId: string;
  rfqReference?: string;
  projectReference: string;
  projectLocation: string;
  serviceRequired: string;
  scopeSummary: string;
  projectDescription: string;
  assumptions: string;
  exclusions: string;
  paymentTerms: string;
  programmeNotes: string;
  warrantyWording: string;
  customerMessage: string;
  internalNotes: string;
  issueDate: string;
  validUntil: string;
  discountAmount: number;
  discountType: DiscountType;
  discountPercent: number;
  discountReason: string;
  vatRate: number;
  vatPricingMode: VatPricingMode;
  depositPercent: number;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  province: string;
  lines: EditableLine[];
  estimatorConfirmedSuggestions: boolean;
  hasCalculatorSuggestions: boolean;
  projectTemplateId?: string;
  projectTemplateVersionId?: string;
  projectTemplateName?: string;
};

export type SaveStatus =
  | "idle"
  | "unsaved"
  | "saving"
  | "saved"
  | "error";

export const QUOTE_UNIT_OPTIONS = [
  "ea",
  "item",
  "m",
  "m²",
  "m³",
  "km",
  "hour",
  "day",
  "roll",
  "tank",
  "kL",
  "lump sum",
] as const;

export const QUOTE_SERVICE_OPTIONS = [
  "HDPE dam lining",
  "PVC dam/reservoir lining",
  "Dortom lining",
  "Corrugated steel reservoir",
  "Torch-on waterproofing",
  "Concrete reservoir repair",
  "Leak repair",
  "Other",
] as const;

export const NON_PRICED_LINE_TYPES = new Set<QuoteLineType>(["heading", "note"]);
