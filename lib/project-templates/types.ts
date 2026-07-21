export const PROJECT_TEMPLATE_LINE_ROLES = [
  "primary_material",
  "installation",
  "underlay",
  "surface_preparation",
  "testing",
  "repair",
  "accessory",
  "site_establishment",
  "travel",
  "delivery",
  "equipment",
  "provisional_sum",
  "other",
] as const;

export type ProjectTemplateLineRole =
  (typeof PROJECT_TEMPLATE_LINE_ROLES)[number];

export const PROJECT_TEMPLATE_QUANTITY_SOURCES = [
  "manual",
  "measured_area",
  "installation_area",
  "perimeter",
  "penetration_count",
  "tank_count",
  "distance",
  "days",
  "fixed",
] as const;

export type ProjectTemplateQuantitySource =
  (typeof PROJECT_TEMPLATE_QUANTITY_SOURCES)[number];

export const PROJECT_TEMPLATE_SECTION_TYPES = [
  "scope",
  "assumption",
  "exclusion",
  "customer_message",
  "internal_note",
  "warranty",
  "commercial_term",
] as const;

export type ProjectTemplateSectionType =
  (typeof PROJECT_TEMPLATE_SECTION_TYPES)[number];

export const PROJECT_TEMPLATE_FIELD_TYPES = [
  "text",
  "number",
  "area",
  "length",
  "capacity",
  "percentage",
  "select",
  "multi-select",
  "boolean",
  "date",
  "file",
  "measurement_set",
] as const;

export type ProjectTemplateFieldType =
  (typeof PROJECT_TEMPLATE_FIELD_TYPES)[number];

export const PROJECT_TEMPLATE_CATEGORY_GROUPS = [
  "Dam lining",
  "Waterproofing",
  "Repairs",
  "Steel tanks",
  "Reservoirs",
  "Other",
] as const;

export type ProjectTemplateItem = {
  id: string;
  projectTemplateId: string;
  pricingItemId: string | null;
  requestedItemCode: string | null;
  lineRole: ProjectTemplateLineRole | string;
  defaultQuantitySource: ProjectTemplateQuantitySource | string;
  defaultQuantity: number | null;
  defaultUnit: string | null;
  descriptionOverride: string | null;
  isOptional: boolean;
  isSelectedByDefault: boolean;
  sortOrder: number;
  notes: string | null;
  /** Populated when joined to the catalogue at read time. */
  resolvedItemCode?: string | null;
  resolvedName?: string | null;
  resolvedUnit?: string | null;
  resolvedSellPrice?: number | null;
};

export type ProjectTemplateSection = {
  id: string;
  projectTemplateId: string;
  sectionType: ProjectTemplateSectionType | string;
  heading: string | null;
  content: string;
  sortOrder: number;
  isDefault: boolean;
  isRequired: boolean;
  isCustomerVisible: boolean;
};

export type ProjectTemplateField = {
  id: string;
  projectTemplateId: string;
  fieldKey: string;
  label: string;
  fieldType: ProjectTemplateFieldType | string;
  isRequired: boolean;
  isRecommended: boolean;
  options: string[];
  unit: string | null;
  helpText: string | null;
  quantityTarget: string | null;
  sortOrder: number;
};

export type ProjectTemplate = {
  id: string;
  code: string;
  name: string;
  shortDescription: string | null;
  projectCategory: string | null;
  defaultMaterialType: string | null;
  defaultServiceType: string | null;
  defaultQuoteTitle: string | null;
  defaultProjectDescription: string | null;
  defaultScope: string | null;
  defaultAssumptions: string | null;
  defaultExclusions: string | null;
  defaultCustomerMessage: string | null;
  defaultInternalNotes: string | null;
  recommendedMaterialItemId: string | null;
  recommendedInstallationItemId: string | null;
  recommendedGeotextileItemId: string | null;
  recommendedSiteEstablishmentItemId: string | null;
  defaultWarrantyText: string | null;
  defaultValidityDays: number | null;
  defaultLeadTimeText: string | null;
  defaultDurationText: string | null;
  technicalGuidance: string | null;
  requiredInformation: string | null;
  recommendedInformation: string | null;
  riskFlags: string[];
  unresolvedItemCodes: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTemplateWithRelations = ProjectTemplate & {
  items: ProjectTemplateItem[];
  sections: ProjectTemplateSection[];
  fields: ProjectTemplateField[];
};

export type ProjectTemplateVersion = {
  id: string;
  projectTemplateId: string;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  changeSummary: string | null;
  createdAt: string;
};

export type ProjectTemplateSummary = {
  id: string;
  code: string;
  name: string;
  shortDescription: string | null;
  projectCategory: string | null;
  defaultMaterialType: string | null;
  isActive: boolean;
  itemCount: number;
  unresolvedCount: number;
  updatedAt: string;
};
