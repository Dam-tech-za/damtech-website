import { z } from "zod";
import { PROVINCE_OPTIONS } from "@/lib/form";
import type { MeasurementMethod, RfqAssetType } from "./calculations";

export const RFQ_ASSET_TYPES = [
  "earth_dam",
  "circular_open_reservoir",
  "corrugated_steel_tank",
  "concrete_rectangular_reservoir",
  "concrete_circular_reservoir",
  "existing_liner_repair",
  "torch_on",
  "other",
] as const satisfies readonly RfqAssetType[];

export const MEASUREMENT_METHODS = [
  "known_total_area",
  "dimensions",
  "separate_areas",
  "known_capacity",
  "catalogue_selection",
  "drawings",
  "site_measurement_required",
] as const satisfies readonly MeasurementMethod[];

export const SERVICE_TYPES = [
  "HDPE dam lining",
  "PVC or reinforced PVC reservoir lining",
  "Dortom lining",
  "Corrugated steel water tank",
  "Concrete reservoir waterproofing",
  "Torch-on waterproofing",
  "Existing liner repair",
  "Leak investigation",
  "Other",
] as const;

export const ASSET_TYPE_LABELS: Record<RfqAssetType, string> = {
  earth_dam: "Earth dam / reservoir",
  circular_open_reservoir: "Circular open reservoir",
  corrugated_steel_tank: "Corrugated steel water tank",
  concrete_rectangular_reservoir: "Concrete rectangular reservoir",
  concrete_circular_reservoir: "Concrete circular reservoir",
  existing_liner_repair: "Existing liner repair",
  torch_on: "Torch-on waterproofing",
  other: "Other",
};

export const publicRfqAssetSchema = z.object({
  localId: z.string().min(1).max(80),
  assetName: z.string().min(1).max(200),
  assetType: z.enum(RFQ_ASSET_TYPES),
  quantity: z.number().int().min(1).max(100),
  measurementMethod: z.enum(MEASUREMENT_METHODS),
  materialPreference: z.string().max(200).optional().nullable(),
  siteNotes: z.string().max(4000).optional().nullable(),
  siteConditions: z.record(z.string(), z.unknown()).optional().default({}),
  rawInputs: z.record(z.string(), z.unknown()).default({}),
});

export const publicMultiRfqSchema = z.object({
  // Contact
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional().default(""),
  email: z.string().max(320).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  alternativePhone: z.string().max(40).optional().default(""),
  preferredContactMethod: z.string().max(40).optional().default(""),
  vatNumber: z.string().max(40).optional().default(""),
  companyRegistration: z.string().max(80).optional().default(""),
  // Location
  farmProjectName: z.string().max(200).optional().default(""),
  addressLine: z.string().max(400).optional().default(""),
  town: z.string().max(120).optional().default(""),
  province: z.string().max(80).optional().default(""),
  postalCode: z.string().max(20).optional().default(""),
  gpsLat: z.number().min(-90).max(90).optional().nullable(),
  gpsLng: z.number().min(-180).max(180).optional().nullable(),
  mapsLink: z.string().max(500).optional().default(""),
  accessNotes: z.string().max(2000).optional().default(""),
  distanceFromTownKm: z.number().min(0).max(5000).optional().nullable(),
  // Services
  servicesRequested: z.array(z.string().max(120)).min(1).max(20),
  // Site conditions (project level)
  siteConditions: z.record(z.string(), z.unknown()).optional().default({}),
  message: z.string().max(8000).optional().default(""),
  // Assets
  assets: z.array(publicRfqAssetSchema).min(1).max(30),
  // Meta
  sourcePage: z.string().min(1).max(300).default("/quote"),
  website: z.string().max(200).optional().default(""),
  formStartedAt: z.number().optional(),
  calculatorSource: z
    .object({
      calculatorType: z.string().max(120),
      inputs: z.record(z.string(), z.unknown()),
      results: z.record(z.string(), z.unknown()),
    })
    .optional()
    .nullable(),
});

export type PublicMultiRfqInput = z.infer<typeof publicMultiRfqSchema>;
export type PublicRfqAssetInput = z.infer<typeof publicRfqAssetSchema>;

export function validateProvince(province: string): string {
  if ((PROVINCE_OPTIONS as readonly string[]).includes(province)) return province;
  return "";
}

export function defaultMeasurementMethod(
  assetType: RfqAssetType,
  fromCalculator?: boolean,
): MeasurementMethod {
  if (assetType === "corrugated_steel_tank") {
    return fromCalculator ? "known_capacity" : "dimensions";
  }
  if (
    assetType === "earth_dam" ||
    assetType === "circular_open_reservoir"
  ) {
    return "known_total_area";
  }
  return "known_total_area";
}
