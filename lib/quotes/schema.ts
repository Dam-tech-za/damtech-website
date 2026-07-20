import { z } from "zod";
import { QUOTE_LINE_TYPES } from "./types";

export const quoteLineSchema = z.object({
  id: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0),
  lineType: z.enum(QUOTE_LINE_TYPES),
  itemCode: z.string().max(80).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  description: z.string().min(1).max(2000),
  quantity: z.number().min(0).max(1_000_000),
  unit: z.string().min(1).max(40),
  costUnitPrice: z.number().min(0).max(10_000_000).nullable().optional(),
  sellUnitPrice: z.number().min(0).max(10_000_000),
  discountPercent: z.number().min(0).max(100).default(0),
  taxCategory: z.enum(["standard", "exempt", "zero"]).default("standard"),
  sourceMaterialItemId: z.string().uuid().nullable().optional(),
  sourceLabourItemId: z.string().uuid().nullable().optional(),
  sourceSupplierPriceId: z.string().uuid().nullable().optional(),
  sourcePricingItemId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const quoteSaveSchema = z.object({
  title: z.string().min(1).max(300),
  customerId: z.string().uuid(),
  rfqId: z.string().uuid().nullable().optional(),
  projectReference: z.string().max(200).nullable().optional(),
  projectLocation: z.string().max(300).nullable().optional(),
  serviceRequired: z.string().max(200).nullable().optional(),
  scopeSummary: z.string().max(5000).nullable().optional(),
  projectDescription: z.string().max(8000).nullable().optional(),
  assumptions: z.string().max(8000).nullable().optional(),
  exclusions: z.string().max(8000).nullable().optional(),
  paymentTerms: z.string().max(4000).nullable().optional(),
  programmeNotes: z.string().max(4000).nullable().optional(),
  warrantyWording: z.string().max(4000).nullable().optional(),
  customerMessage: z.string().max(4000).nullable().optional(),
  internalNotes: z.string().max(8000).nullable().optional(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  discountAmount: z.number().min(0).max(100_000_000).default(0),
  discountType: z.enum(["none", "amount", "percent"]).default("amount"),
  discountPercent: z.number().min(0).max(100).default(0),
  discountReason: z.string().max(500).nullable().optional(),
  vatRate: z.number().min(0).max(100).default(15),
  vatPricingMode: z.enum(["exclusive", "inclusive"]).default("exclusive"),
  depositPercent: z.number().min(0).max(100).nullable().optional(),
  contactName: z.string().max(200).nullable().optional(),
  companyName: z.string().max(200).nullable().optional(),
  email: z.string().email().max(320).nullable().optional().or(z.literal("")),
  phone: z.string().max(40).nullable().optional(),
  province: z.string().max(80).nullable().optional(),
  lines: z.array(quoteLineSchema).max(500),
  estimatorConfirmedSuggestions: z.boolean().optional(),
});

export const acceptQuoteSchema = z.object({
  confirmed: z.literal(true),
  acceptorName: z.string().min(2).max(200),
  jobTitle: z.string().max(200).optional(),
  purchaseOrder: z.string().max(120).optional(),
  note: z.string().max(2000).optional(),
});

export const rejectQuoteSchema = z.object({
  confirmed: z.literal(true),
  reason: z.string().max(2000).optional(),
  requestRevision: z.boolean().optional(),
});

export type QuoteSaveInput = z.infer<typeof quoteSaveSchema>;
