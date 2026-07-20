export type RfqInboxSort =
  | "submitted_desc"
  | "submitted_asc"
  | "updated_desc"
  | "customer_asc"
  | "location_asc"
  | "size_desc"
  | "size_asc";

export type RfqApproximateSize = {
  displayValue: string | null;
  numericValue: number | null;
  unit: "m²" | "kL" | "m" | "other" | null;
  source:
    | "confirmed"
    | "calculated"
    | "customer_estimate"
    | "customer_text"
    | "missing";
  sortType: "area" | "capacity" | "dimension" | "none";
};

export type RfqInboxRow = {
  id: string;
  rfqNumber: string;
  customerName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  projectLocation: string | null;
  province: string | null;
  serviceLabel: string;
  projectSummary: string | null;
  approximateSize: RfqApproximateSize;
  source: string;
  sourceBadgeLabel: string;
  status: string;
  assignedUserName: string | null;
  submittedAt: string;
  updatedAt: string;
  hasAttachments: boolean;
  hasCalculatorData: boolean;
};

export type RfqInboxFilters = {
  q?: string;
  status?: string;
  service?: string;
  province?: string;
  assigned?: string;
  from?: string;
  to?: string;
  hasCalculator?: string;
  hasAttachments?: string;
  hasDrawings?: string;
  assetType?: string;
  materialPreference?: string;
  measurementMethod?: string;
  measurementRequired?: string;
  source?: string;
  minMaterialArea?: string;
  maxMaterialArea?: string;
  minTankCapacity?: string;
  maxTankCapacity?: string;
  sizeUnit?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
};

export type RfqInboxResult = {
  rows: RfqInboxRow[];
  total: number;
  totalUnfiltered: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
};

export const RFQ_INBOX_SORT_OPTIONS: {
  value: RfqInboxSort;
  label: string;
}[] = [
  { value: "submitted_desc", label: "Newest first" },
  { value: "submitted_asc", label: "Oldest first" },
  { value: "size_desc", label: "Largest project first" },
  { value: "size_asc", label: "Smallest project first" },
  { value: "customer_asc", label: "Customer A–Z" },
  { value: "location_asc", label: "Location A–Z" },
  { value: "updated_desc", label: "Recently updated" },
];

export const RFQ_STATUS_STRIP = [
  { key: "new", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "information_required", label: "Info required" },
  { key: "site_measurement_required", label: "Site measurement" },
  { key: "ready_for_quote", label: "Ready" },
  { key: "converted", label: "Converted" },
] as const;

export const RFQ_STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  information_required: "Information Required",
  site_measurement_required: "Site Measurement",
  ready_for_quote: "Ready for Quote",
  converted: "Converted",
  closed: "Closed",
  spam: "Spam",
  archived: "Archived",
};

export const RFQ_OPTIONAL_COLUMNS = [
  { id: "rfqNumber", label: "RFQ number" },
  { id: "source", label: "Source" },
  { id: "assigned", label: "Assigned estimator" },
  { id: "assetCount", label: "Asset count" },
  { id: "materialPreference", label: "Material preference" },
  { id: "measurementMethod", label: "Measurement method" },
  { id: "lastUpdated", label: "Last updated" },
] as const;

export type RfqOptionalColumnId = (typeof RFQ_OPTIONAL_COLUMNS)[number]["id"];

export const DEFAULT_RFQ_COLUMNS: RfqOptionalColumnId[] = [];
