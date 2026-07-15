import { z } from "zod";
import { PROVINCE_OPTIONS, SERVICE_OPTIONS } from "@/lib/form";

export const RFQ_STATUSES = [
  "new",
  "reviewing",
  "information_required",
  "ready_for_quote",
  "converted",
  "closed",
  "spam",
] as const;

export type RfqStatus = (typeof RFQ_STATUSES)[number];

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
});

export type PublicRfqSubmission = z.infer<typeof publicRfqSubmissionSchema>;

export function parsePublicRfqFormData(
  formData: FormData,
  sourcePage: string,
):
  | {
      ok: true;
      data: PublicRfqSubmission;
      calculator: CalculatorPayload | null;
      isSpam: boolean;
    }
  | { ok: false; error: string } {
  const raw = {
    name: sanitizeString(formData.get("name"), 200),
    company: sanitizeString(formData.get("company"), 200),
    phone: sanitizeString(formData.get("phone"), 40),
    email: sanitizeString(formData.get("email"), 320).toLowerCase(),
    province: sanitizeString(formData.get("province"), 80),
    serviceRequired: sanitizeString(formData.get("serviceRequired"), 80),
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
  };

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

  return {
    ok: true,
    data: parsed.data,
    calculator,
    isSpam: Boolean(parsed.data.website),
  };
}
