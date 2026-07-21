import { z } from "zod";

const itemSchema = z.object({
  pricingItemId: z.string().uuid().nullable().optional(),
  requestedItemCode: z.string().trim().max(120).nullable().optional(),
  lineRole: z.string().trim().max(60).default("other"),
  defaultQuantitySource: z.string().trim().max(60).default("manual"),
  defaultQuantity: z.number().finite().nullable().optional(),
  defaultUnit: z.string().trim().max(30).nullable().optional(),
  descriptionOverride: z.string().trim().max(2000).nullable().optional(),
  isOptional: z.boolean().default(false),
  isSelectedByDefault: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const sectionSchema = z.object({
  sectionType: z.string().trim().max(40),
  heading: z.string().trim().max(200).nullable().optional(),
  content: z.string().max(8000).default(""),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isCustomerVisible: z.boolean().default(true),
});

const fieldSchema = z.object({
  fieldKey: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  fieldType: z.string().trim().max(40).default("text"),
  isRequired: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  options: z.array(z.string().trim().max(120)).default([]),
  unit: z.string().trim().max(30).nullable().optional(),
  helpText: z.string().trim().max(500).nullable().optional(),
  quantityTarget: z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const projectTemplateSaveSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(60),
  name: z.string().trim().min(2).max(200),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  projectCategory: z.string().trim().max(120).nullable().optional(),
  defaultMaterialType: z.string().trim().max(120).nullable().optional(),
  defaultServiceType: z.string().trim().max(120).nullable().optional(),
  defaultQuoteTitle: z.string().trim().max(300).nullable().optional(),
  defaultProjectDescription: z.string().max(4000).nullable().optional(),
  defaultScope: z.string().max(12000).nullable().optional(),
  defaultAssumptions: z.string().max(12000).nullable().optional(),
  defaultExclusions: z.string().max(12000).nullable().optional(),
  defaultCustomerMessage: z.string().max(4000).nullable().optional(),
  defaultInternalNotes: z.string().max(4000).nullable().optional(),
  defaultWarrantyText: z.string().max(4000).nullable().optional(),
  defaultValidityDays: z.number().int().min(1).max(365).nullable().optional(),
  defaultLeadTimeText: z.string().trim().max(300).nullable().optional(),
  defaultDurationText: z.string().trim().max(300).nullable().optional(),
  technicalGuidance: z.string().max(4000).nullable().optional(),
  requiredInformation: z.string().max(4000).nullable().optional(),
  recommendedInformation: z.string().max(4000).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  changeSummary: z.string().trim().max(500).nullable().optional(),
  items: z.array(itemSchema).max(200).default([]),
  sections: z.array(sectionSchema).max(200).default([]),
  fields: z.array(fieldSchema).max(100).default([]),
});

export type ProjectTemplateSaveInput = z.infer<typeof projectTemplateSaveSchema>;
