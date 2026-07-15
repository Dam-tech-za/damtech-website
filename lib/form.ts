export const SERVICE_OPTIONS = [
  "HDPE dam liner",
  "PVC dam liner",
  "Steel water tank",
  "Bitumen waterproofing",
  "Dam leak repair",
  "Reservoir repair",
  "Water storage consultation",
  "Other",
] as const;

export const MATERIAL_PREFERENCE_OPTIONS = [
  "HDPE",
  "PVC",
  "Steel",
  "Bitumen / torch-on",
  "Unsure",
] as const;

export const TIMEFRAME_OPTIONS = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Planning / budget only",
] as const;

export const PROVINCE_OPTIONS = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
  "Other / outside South Africa",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];
export type ProvinceOption = (typeof PROVINCE_OPTIONS)[number];
export type MaterialPreferenceOption =
  (typeof MATERIAL_PREFERENCE_OPTIONS)[number];
export type TimeframeOption = (typeof TIMEFRAME_OPTIONS)[number];

/** Legacy labels still accepted on parse (mapped onto current SERVICE_OPTIONS). */
export const LEGACY_SERVICE_ALIASES: Record<string, ServiceOption> = {
  "Leak repair": "Dam leak repair",
  "Water-storage consultation": "Water storage consultation",
};

export function normaliseServiceOption(value: string): ServiceOption | null {
  if ((SERVICE_OPTIONS as readonly string[]).includes(value)) {
    return value as ServiceOption;
  }
  const aliased = LEGACY_SERVICE_ALIASES[value];
  return aliased ?? null;
}

export type LeadFormData = {
  name: string;
  company: string;
  phone: string;
  email: string;
  province: string;
  serviceRequired: string;
  projectSize: string;
  projectLocation: string;
  message: string;
  sourcePage: string;
};

export type LeadValidationResult =
  | { ok: true; data: LeadFormData }
  | { ok: false; error: string };

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseLeadFormData(
  formData: FormData,
  sourcePage: string,
): LeadValidationResult {
  const name = clean(formData.get("name"));
  const company = clean(formData.get("company"));
  const phone = clean(formData.get("phone"));
  const email = clean(formData.get("email"));
  const province = clean(formData.get("province"));
  const serviceRequired = clean(formData.get("serviceRequired"));
  const projectSize = clean(formData.get("projectSize"));
  const projectLocation = clean(formData.get("projectLocation"));
  const message = clean(formData.get("message"));

  if (!name) {
    return { ok: false, error: "Please enter your name." };
  }

  if (!phone && !email) {
    return {
      ok: false,
      error: "Please provide a phone number or email address so we can reach you.",
    };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  if (!serviceRequired) {
    return { ok: false, error: "Please select the service you require." };
  }

  const normalisedService = normaliseServiceOption(serviceRequired);
  if (!normalisedService) {
    return { ok: false, error: "Please select a valid service." };
  }

  if (!message) {
    return {
      ok: false,
      error: "Please describe your project or message so we can quote accurately.",
    };
  }

  return {
    ok: true,
    data: {
      name,
      company,
      phone,
      email,
      province,
      serviceRequired: normalisedService,
      projectSize,
      projectLocation,
      message,
      sourcePage,
    },
  };
}
