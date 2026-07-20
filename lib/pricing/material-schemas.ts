import { z } from "zod";

const positive = z.number().min(0).max(1_000_000);
const percent = z.number().min(0).max(100);

export const materialIdentitySchema = z.object({
  itemCode: z.string().min(1).max(80),
  category: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  quoteDescription: z.string().max(2000).optional().nullable(),
  internalDescription: z.string().max(4000).optional().nullable(),
  brand: z.string().max(120).optional().nullable(),
  purchaseUnit: z.string().min(1).max(40),
  quoteUnit: z.string().min(1).max(40),
  taxCategory: z.enum(["standard", "zero_rated", "exempt", "no_vat"]).default("standard"),
  priceValidFrom: z.string().optional().nullable(),
  priceValidTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const hdpeTechnicalSchema = z
  .object({
    thicknessMm: positive.optional().nullable(),
    surfaceType: z.enum(["smooth", "textured", "other"]).optional().nullable(),
    colour: z.string().max(80).optional().nullable(),
    rollWidthM: positive.optional().nullable(),
    rollLengthM: positive.optional().nullable(),
    grossRollAreaM2: positive.optional().nullable(),
    usableRollAreaM2: positive.optional().nullable(),
    overlapPercent: percent.default(0),
    wastePercent: percent.default(0),
    minimumOrder: positive.optional().nullable(),
    warranty: z.string().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.usableRollAreaM2 != null &&
      data.grossRollAreaM2 != null &&
      data.usableRollAreaM2 > data.grossRollAreaM2
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Usable roll area cannot exceed gross roll area.",
        path: ["usableRollAreaM2"],
      });
    }
  });

export const torchOnTechnicalSchema = z.object({
  thicknessMm: positive.optional().nullable(),
  rollWidthM: positive.optional().nullable(),
  rollLengthM: positive.optional().nullable(),
  sideLapM: positive.optional().nullable(),
  endLapM: positive.optional().nullable(),
  grossRollAreaM2: positive.optional().nullable(),
  usableRollAreaM2: positive.optional().nullable(),
  wastePercent: percent.default(0),
  primerRequired: z.boolean().default(false),
  protectiveCoatingRequired: z.boolean().default(false),
  applicationLayers: z.number().int().min(1).max(10).default(1),
});

export const liquidTechnicalSchema = z.object({
  packSize: positive,
  packUnit: z.string().min(1).max(40),
  consumptionRate: positive,
  consumptionUnit: z.string().min(1).max(40),
  numberOfCoats: z.number().int().min(1).max(20).default(1),
  substrateFactor: z.number().min(0.1).max(5).default(1),
  reinforcementRequired: z.boolean().default(false),
  wastePercent: percent.default(0),
});

export const cementitiousTechnicalSchema = z.object({
  packSize: positive,
  kgPerM2PerCoat: positive,
  numberOfCoats: z.number().int().min(1).max(20).default(1),
  primerRequired: z.boolean().default(false),
  wastePercent: percent.default(0),
  maxApplication: positive.optional().nullable(),
});

export const geotextileTechnicalSchema = z.object({
  gsm: positive.optional().nullable(),
  rollWidthM: positive.optional().nullable(),
  rollLengthM: positive.optional().nullable(),
  grossAreaM2: positive.optional().nullable(),
  lapPercent: percent.default(0),
  wastePercent: percent.default(0),
});

export const accessoryTechnicalSchema = z.object({
  accessoryType: z.enum([
    "pipe_boot",
    "outlet",
    "drain",
    "termination_bar",
    "sealant",
    "adhesive",
    "patch",
    "corner_reinforcement",
    "fastener",
    "other",
  ]),
  unit: z.enum(["each", "m", "box", "cartridge", "kit"]),
});

export const pvcTechnicalSchema = z.object({
  gsmOrThickness: z.string().max(80).optional().nullable(),
  formFactor: z.enum(["roll", "prefabricated"]).default("roll"),
  rollWidthM: positive.optional().nullable(),
  rollLengthM: positive.optional().nullable(),
  grossAreaM2: positive.optional().nullable(),
  usableAreaM2: positive.optional().nullable(),
  seamAllowancePercent: percent.default(0),
  wastePercent: percent.default(0),
  tankCapacityKl: positive.optional().nullable(),
  warranty: z.string().max(500).optional().nullable(),
});

export type MaterialCategoryKind =
  | "hdpe"
  | "pvc"
  | "torch_on"
  | "liquid"
  | "cementitious"
  | "geotextile"
  | "accessory"
  | "general";

export function detectMaterialCategoryKind(category: string): MaterialCategoryKind {
  const c = category.toLowerCase();
  if (c.includes("hdpe") || c.includes("geomembrane")) return "hdpe";
  if (c.includes("pvc") || c.includes("dortom")) return "pvc";
  if (c.includes("torch")) return "torch_on";
  if (c.includes("liquid") || c.includes("coating")) return "liquid";
  if (c.includes("cement")) return "cementitious";
  if (c.includes("geotex")) return "geotextile";
  if (
    c.includes("accessor") ||
    c.includes("fitting") ||
    c.includes("sealant") ||
    c.includes("fastener")
  ) {
    return "accessory";
  }
  return "general";
}

export function validateMaterialTechnical(
  kind: MaterialCategoryKind,
  data: unknown,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const schema =
    kind === "hdpe"
      ? hdpeTechnicalSchema
      : kind === "pvc"
        ? pvcTechnicalSchema
        : kind === "torch_on"
          ? torchOnTechnicalSchema
          : kind === "liquid"
            ? liquidTechnicalSchema
            : kind === "cementitious"
              ? cementitiousTechnicalSchema
              : kind === "geotextile"
                ? geotextileTechnicalSchema
                : kind === "accessory"
                  ? accessoryTechnicalSchema
                  : z.record(z.string(), z.unknown());

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid technical data." };
  }
  return { ok: true, data: parsed.data as Record<string, unknown> };
}
