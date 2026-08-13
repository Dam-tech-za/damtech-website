import { z } from "zod";
import {
  MATERIAL_PREFERENCE_OPTIONS,
  PROVINCE_OPTIONS,
  SERVICE_OPTIONS,
  TIMEFRAME_OPTIONS,
  normaliseServiceOption,
} from "@/lib/form";
import {
  resolveCatalogueLine,
  type CatalogueLineSnapshot,
} from "@/lib/catalogue";
import { RFQ_STATUSES, type RfqStatus } from "./statuses";
import { softParseProjectSize } from "./soft-size-parse";
import type { EnquiryChannel } from "./enquiry-channel";

export { RFQ_STATUSES, type RfqStatus };
export {
  ASSET_MEASUREMENT_STATUSES,
  INFO_REQUEST_FIELDS,
  type AssetMeasurementStatus,
} from "./statuses";

export const calculatorPayloadSchema = z
  .object({
    calculatorType: z.string().min(1).max(120),
    inputs: z.record(z.string(), z.unknown()),
    results: z.record(z.string(), z.unknown()),
  })
  .strict();

export type CalculatorPayload = z.infer<typeof calculatorPayloadSchema>;

function sanitizeString(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

export const publicRfqSubmissionSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  email: z.string().max(320).optional().default(""),
  province: z.string().max(80).optional().default(""),
  serviceRequired: z.enum(SERVICE_OPTIONS),
  projectSize: z.string().max(200).optional().default(""),
  projectLocation: z.string().max(300).optional().default(""),
  message: z.string().min(1).max(8000),
  sourcePage: z.string().min(1).max(300),
  preferredContactMethod: z.string().max(40).optional(),
  website: z.string().max(200).optional().default(""), // honeypot
  calculatorJson: z.string().max(20000).optional().default(""),
  materialPreference: z.string().max(80).optional().default(""),
  numberOfAssetsEstimate: z.string().max(10).optional().default(""),
  preferredTimeframe: z.string().max(80).optional().default(""),
  damType: z.string().max(80).optional().default(""),
  liningAreaValue: z.string().max(40).optional().default(""),
  liningAreaUnit: z.string().max(20).optional().default(""),
  tankCapacityKl: z.string().max(40).optional().default(""),
  waterproofingAreaM2: z.string().max(40).optional().default(""),
  surfaceType: z.string().max(80).optional().default(""),
  town: z.string().max(120).optional().default(""),
  deliveryAddress: z.string().max(500).optional().default(""),
});

export type PublicRfqSubmission = z.infer<typeof publicRfqSubmissionSchema>;

export type ParsedSimpleServiceFields = {
  damType?: string;
  liningAreaValue?: string;
  liningAreaUnit?: string;
  tankCapacityKl?: string;
  waterproofingAreaM2?: string;
  surfaceType?: string;
  catalogueLine?: CatalogueLineSnapshot;
};

export function buildSimpleServiceFields(
  data: PublicRfqSubmission,
): ParsedSimpleServiceFields {
  const fields: ParsedSimpleServiceFields = {};
  if (data.damType) fields.damType = data.damType;
  if (data.liningAreaValue) fields.liningAreaValue = data.liningAreaValue;
  if (data.liningAreaUnit) fields.liningAreaUnit = data.liningAreaUnit;
  if (data.tankCapacityKl) fields.tankCapacityKl = data.tankCapacityKl;
  if (data.waterproofingAreaM2) {
    fields.waterproofingAreaM2 = data.waterproofingAreaM2;
  }
  if (data.surfaceType) fields.surfaceType = data.surfaceType;
  return fields;
}

function parseAssetsEstimate(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.floor(n), 999);
}

export function parsePublicRfqFormData(
  formData: FormData,
  sourcePage: string,
):
  | {
      ok: true;
      data: PublicRfqSubmission;
      calculator: CalculatorPayload | null;
      isSpam: boolean;
      softEstimates: ReturnType<typeof softParseProjectSize>;
      simpleServiceFields: ParsedSimpleServiceFields;
      assetsEstimate: number | null;
      enquiryChannel: EnquiryChannel;
      catalogueLine: CatalogueLineSnapshot | null;
    }
  | { ok: false; error: string } {
  const rawService = sanitizeString(formData.get("serviceRequired"), 80);
  const normalisedService = normaliseServiceOption(rawService) ?? rawService;

  const raw = {
    name: sanitizeString(formData.get("name"), 200),
    company: sanitizeString(formData.get("company"), 200),
    phone: sanitizeString(formData.get("phone"), 40),
    email: sanitizeString(formData.get("email"), 320).toLowerCase(),
    province: sanitizeString(formData.get("province"), 80),
    serviceRequired: normalisedService,
    projectSize: sanitizeString(formData.get("projectSize"), 200),
    projectLocation: sanitizeString(formData.get("projectLocation"), 300),
    message: sanitizeString(formData.get("message"), 8000),
    sourcePage: sanitizeString(sourcePage, 300) || "/quote",
    preferredContactMethod: sanitizeString(
      formData.get("preferredContactMethod"),
      40,
    ),
    website: sanitizeString(formData.get("website"), 200),
    calculatorJson: sanitizeString(formData.get("calculatorJson"), 20000),
    materialPreference: sanitizeString(formData.get("materialPreference"), 80),
    numberOfAssetsEstimate: sanitizeString(
      formData.get("numberOfAssetsEstimate"),
      10,
    ),
    preferredTimeframe: sanitizeString(formData.get("preferredTimeframe"), 80),
    damType: sanitizeString(formData.get("damType"), 80),
    liningAreaValue: sanitizeString(formData.get("liningAreaValue"), 40),
    liningAreaUnit: sanitizeString(formData.get("liningAreaUnit"), 20),
    tankCapacityKl: sanitizeString(formData.get("tankCapacityKl"), 40),
    waterproofingAreaM2: sanitizeString(formData.get("waterproofingAreaM2"), 40),
    surfaceType: sanitizeString(formData.get("surfaceType"), 80),
    town: sanitizeString(formData.get("town"), 120),
    deliveryAddress: sanitizeString(formData.get("deliveryAddress"), 500),
  };

  const requestedSku = sanitizeString(formData.get("sku"), 40).toUpperCase();
  const requestedQty = sanitizeString(
    formData.get("quantity") || formData.get("qty"),
    10,
  );
  // Never trust a product name or price supplied through the form or URL.
  void formData.get("price");
  void formData.get("name");
  void formData.get("unitPrice");
  void formData.get("productName");

  let catalogueLine: CatalogueLineSnapshot | null = null;
  if (requestedSku) {
    catalogueLine = resolveCatalogueLine(requestedSku, Number(requestedQty || "1"));
    if (!catalogueLine) {
      return {
        ok: false,
        error: "Select a product from the Damtech catalogue to request an invoice.",
      };
    }
    raw.serviceRequired = catalogueLine.rfqService;
    if (!raw.projectSize) {
      raw.projectSize = `${catalogueLine.productName} × ${catalogueLine.quantity}`;
    }
    if (!raw.projectLocation && raw.town) {
      raw.projectLocation = raw.town;
    }
    if (!raw.numberOfAssetsEstimate) {
      raw.numberOfAssetsEstimate = String(catalogueLine.quantity);
    }
  }

  if (!raw.phone && !raw.email) {
    return {
      ok: false,
      error: "Please provide a phone number or email address so we can reach you.",
    };
  }

  if (raw.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (
    raw.province &&
    !(PROVINCE_OPTIONS as readonly string[]).includes(raw.province)
  ) {
    raw.province = "";
  }

  if (
    raw.materialPreference &&
    !(MATERIAL_PREFERENCE_OPTIONS as readonly string[]).includes(
      raw.materialPreference,
    )
  ) {
    raw.materialPreference = "";
  }

  if (
    raw.preferredTimeframe &&
    !(TIMEFRAME_OPTIONS as readonly string[]).includes(raw.preferredTimeframe)
  ) {
    raw.preferredTimeframe = "";
  }

  if (catalogueLine) {
    if (!raw.province) {
      return {
        ok: false,
        error: "Please select the province for delivery so we can calculate transport.",
      };
    }
    if (!raw.town) {
      return {
        ok: false,
        error: "Please enter the town or project location for delivery.",
      };
    }
    if (!raw.deliveryAddress) {
      return {
        ok: false,
        error: "Please enter a delivery address or delivery location.",
      };
    }
  }

  const parsed = publicRfqSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid form submission.";
    return { ok: false, error: first };
  }

  let calculator: CalculatorPayload | null = null;
  if (parsed.data.calculatorJson) {
    try {
      const json = JSON.parse(parsed.data.calculatorJson) as unknown;
      const calc = calculatorPayloadSchema.safeParse(json);
      if (calc.success) calculator = calc.data;
    } catch {
      calculator = null;
    }
  }

  const page = parsed.data.sourcePage.toLowerCase();
  let enquiryChannel: EnquiryChannel = "simple_public_rfq";
  if (catalogueLine) enquiryChannel = "catalogue_invoice_request";
  else if (page.includes("contact")) enquiryChannel = "contact_enquiry";
  else if (
    page.includes("project-budget") ||
    page.includes("quote-preparation") ||
    calculator
  ) {
    enquiryChannel = "calculator_quote_preparation";
  }

  const simpleServiceFields = buildSimpleServiceFields(parsed.data);
  if (catalogueLine) {
    simpleServiceFields.catalogueLine = catalogueLine;
  }

  return {
    ok: true,
    data: parsed.data,
    calculator,
    isSpam: Boolean(parsed.data.website),
    softEstimates: softParseProjectSize(parsed.data.projectSize),
    simpleServiceFields,
    assetsEstimate:
      catalogueLine?.quantity ??
      parseAssetsEstimate(parsed.data.numberOfAssetsEstimate),
    enquiryChannel,
    catalogueLine,
  };
}
