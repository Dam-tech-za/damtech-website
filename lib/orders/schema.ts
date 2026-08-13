import { z } from "zod";
import { PROVINCE_OPTIONS } from "../form.ts";
import { isCatalogueSku } from "../catalogue/types.ts";
import { resolveOrderableProduct } from "./pricing.ts";
import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  ORDER_CUSTOMER_TYPES,
  ORDER_FIELD_LIMITS,
  ORDER_FULFILMENT_METHOD,
} from "./types.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeOrderString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

/**
 * Accept SA mobiles (0xx / 27xx / +27xx) and other plausible international
 * numbers. Do not reject spaces, dashes or a leading plus.
 */
export function isValidOrderPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > ORDER_FIELD_LIMITS.phone) return false;
  const compact = trimmed.replace(/[()\s.-]/g, "");
  if (!/^\+?[0-9]+$/.test(compact)) return false;
  const digits = compact.replace(/^\+/, "");
  if (/^0[6-8][0-9]{8}$/.test(digits)) return true;
  if (/^27[6-8][0-9]{8}$/.test(digits)) return true;
  return /^[1-9][0-9]{8,14}$/.test(digits);
}

export const publicOrderFormSchema = z.object({
  customerType: z.enum(ORDER_CUSTOMER_TYPES),
  customerName: z.string().min(1).max(ORDER_FIELD_LIMITS.customerName),
  businessName: z.string().max(ORDER_FIELD_LIMITS.businessName).default(""),
  email: z.string().min(1).max(ORDER_FIELD_LIMITS.email),
  phone: z.string().min(1).max(ORDER_FIELD_LIMITS.phone),
  vatNumber: z.string().max(ORDER_FIELD_LIMITS.vatNumber).default(""),
  customerPoNumber: z
    .string()
    .max(ORDER_FIELD_LIMITS.customerPoNumber)
    .default(""),
  billingLine1: z.string().min(1).max(ORDER_FIELD_LIMITS.billingLine1),
  billingLine2: z.string().max(ORDER_FIELD_LIMITS.billingLine2).default(""),
  suburb: z.string().min(1).max(ORDER_FIELD_LIMITS.suburb),
  city: z.string().min(1).max(ORDER_FIELD_LIMITS.city),
  province: z.enum(PROVINCE_OPTIONS),
  postalCode: z.string().min(1).max(ORDER_FIELD_LIMITS.postalCode),
  sku: z.string().min(1).max(ORDER_FIELD_LIMITS.sku),
  quantity: z.number().int().min(MIN_ORDER_QUANTITY).max(MAX_ORDER_QUANTITY),
  notes: z.string().max(ORDER_FIELD_LIMITS.notes).default(""),
  confirmSupplyOnly: z.literal(true),
  confirmExclusions: z.literal(true),
  confirmPolicies: z.literal(true),
  fulfilmentMethod: z.literal(ORDER_FULFILMENT_METHOD),
  website: z.string().max(200).default(""),
  submissionId: z.string().regex(UUID_RE),
  formStartedAt: z.number().finite(),
});

export type PublicOrderFormInput = z.infer<typeof publicOrderFormSchema>;

export type ParsedPublicOrder =
  | {
      ok: true;
      data: PublicOrderFormInput;
      isSpam: boolean;
    }
  | { ok: false; error: string; field?: string };

function isChecked(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") return false;
  return value === "on" || value === "true" || value === "1" || value === "yes";
}

export function parsePublicOrderFormData(formData: FormData): ParsedPublicOrder {
  void formData.get("price");
  void formData.get("unitPrice");
  void formData.get("total");
  void formData.get("productName");
  void formData.get("name");

  const sku = sanitizeOrderString(
    formData.get("sku"),
    ORDER_FIELD_LIMITS.sku,
  ).toUpperCase();
  const quantityRaw = sanitizeOrderString(
    formData.get("quantity") || formData.get("qty"),
    10,
  );
  const quantity = Number(quantityRaw);

  if (!isCatalogueSku(sku) || !resolveOrderableProduct(sku, Number.isFinite(quantity) ? quantity : 0)) {
    return { ok: false, error: "This kit is not available to order online.", field: "sku" };
  }
  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_ORDER_QUANTITY ||
    quantity > MAX_ORDER_QUANTITY
  ) {
    return {
      ok: false,
      error: `Enter a quantity between ${MIN_ORDER_QUANTITY} and ${MAX_ORDER_QUANTITY}.`,
      field: "quantity",
    };
  }

  const email = sanitizeOrderString(
    formData.get("email"),
    ORDER_FIELD_LIMITS.email,
  ).toLowerCase();
  const phone = sanitizeOrderString(formData.get("phone"), ORDER_FIELD_LIMITS.phone);
  const customerName = sanitizeOrderString(
    formData.get("customerName") || formData.get("name"),
    ORDER_FIELD_LIMITS.customerName,
  );
  const customerTypeRaw = sanitizeOrderString(formData.get("customerType"), 20);
  const province = sanitizeOrderString(formData.get("province"), ORDER_FIELD_LIMITS.province);

  if (customerTypeRaw !== "individual" && customerTypeRaw !== "business") {
    return { ok: false, error: "Select whether you are ordering as an individual or a business.", field: "customerType" };
  }
  if (!customerName) {
    return { ok: false, error: "Enter your full name.", field: "customerName" };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  }
  if (!isValidOrderPhone(phone)) {
    return {
      ok: false,
      error: "Enter a valid South African mobile or international phone number.",
      field: "phone",
    };
  }

  const billingLine1 = sanitizeOrderString(
    formData.get("billingLine1"),
    ORDER_FIELD_LIMITS.billingLine1,
  );
  const suburb = sanitizeOrderString(formData.get("suburb"), ORDER_FIELD_LIMITS.suburb);
  const city = sanitizeOrderString(formData.get("city"), ORDER_FIELD_LIMITS.city);
  const postalCode = sanitizeOrderString(
    formData.get("postalCode"),
    ORDER_FIELD_LIMITS.postalCode,
  );
  if (!billingLine1) {
    return { ok: false, error: "Enter billing address line 1.", field: "billingLine1" };
  }
  if (!suburb) {
    return { ok: false, error: "Enter the suburb.", field: "suburb" };
  }
  if (!city) {
    return { ok: false, error: "Enter the city or town.", field: "city" };
  }
  if (!(PROVINCE_OPTIONS as readonly string[]).includes(province)) {
    return { ok: false, error: "Select a province.", field: "province" };
  }
  if (!postalCode) {
    return { ok: false, error: "Enter the postal code.", field: "postalCode" };
  }

  if (!isChecked(formData.get("confirmSupplyOnly"))) {
    return {
      ok: false,
      error: "Confirm that this is a fixed-price supply-only kit.",
      field: "confirmSupplyOnly",
    };
  }
  if (!isChecked(formData.get("confirmExclusions"))) {
    return {
      ok: false,
      error: "Confirm that transport and installation are excluded.",
      field: "confirmExclusions",
    };
  }
  if (!isChecked(formData.get("confirmPolicies"))) {
    return {
      ok: false,
      error: "Agree to DamTech’s terms, privacy policy and returns/cancellation policy.",
      field: "confirmPolicies",
    };
  }

  const submissionId = sanitizeOrderString(formData.get("submissionId"), 36);
  if (!UUID_RE.test(submissionId)) {
    return { ok: false, error: "Please reload the page and try again.", field: "submissionId" };
  }

  const formStartedRaw = sanitizeOrderString(formData.get("formStartedAt"), 20);
  const formStartedAt = Number(formStartedRaw);
  if (!Number.isFinite(formStartedAt)) {
    return { ok: false, error: "Please reload the page and try again.", field: "formStartedAt" };
  }

  const parsed = publicOrderFormSchema.safeParse({
    customerType: customerTypeRaw,
    customerName,
    businessName: sanitizeOrderString(
      formData.get("businessName"),
      ORDER_FIELD_LIMITS.businessName,
    ),
    email,
    phone,
    vatNumber: sanitizeOrderString(
      formData.get("vatNumber"),
      ORDER_FIELD_LIMITS.vatNumber,
    ),
    customerPoNumber: sanitizeOrderString(
      formData.get("customerPoNumber"),
      ORDER_FIELD_LIMITS.customerPoNumber,
    ),
    billingLine1,
    billingLine2: sanitizeOrderString(
      formData.get("billingLine2"),
      ORDER_FIELD_LIMITS.billingLine2,
    ),
    suburb,
    city,
    province,
    postalCode,
    sku,
    quantity,
    notes: sanitizeOrderString(formData.get("notes"), ORDER_FIELD_LIMITS.notes),
    confirmSupplyOnly: true,
    confirmExclusions: true,
    confirmPolicies: true,
    fulfilmentMethod: ORDER_FULFILMENT_METHOD,
    website: sanitizeOrderString(formData.get("website"), 200),
    submissionId,
    formStartedAt,
  });

  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields and try again." };
  }

  return {
    ok: true,
    data: parsed.data,
    isSpam: Boolean(parsed.data.website),
  };
}
