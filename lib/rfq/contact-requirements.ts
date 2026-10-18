import { PROVINCE_OPTIONS } from "../form.ts";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequiredContactField = "email" | "province";

export type RequiredContactProblem = { field: RequiredContactField; message: string };

export function checkRfqEmail(email: string): RequiredContactProblem | null {
  const value = email.trim();
  if (!value) return { field: "email", message: "Please enter your email address." };
  if (!EMAIL_PATTERN.test(value)) {
    return { field: "email", message: "Please enter a valid email address." };
  }
  return null;
}

export function checkRfqProvince(province: string): RequiredContactProblem | null {
  const value = province.trim();
  if (!value || !(PROVINCE_OPTIONS as readonly string[]).includes(value)) {
    return { field: "province", message: "Please select the province of the project." };
  }
  return null;
}

/**
 * Every public RFQ (quote form, contact form, embedded lead form, detailed
 * wizard) must carry a valid email address and a South African province.
 * Phone stays optional. Returns the first problem, or null when both are valid.
 */
export function checkRequiredRfqContact(input: {
  email: string;
  province: string;
}): RequiredContactProblem | null {
  return checkRfqEmail(input.email) ?? checkRfqProvince(input.province);
}
