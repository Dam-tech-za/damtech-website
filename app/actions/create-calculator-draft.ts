"use server";

import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import {
  createCalculatorQuoteDraft,
  type CalculatorDraftPayload,
} from "@/lib/rfq/calculator-draft";

export type CreateCalculatorDraftResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createCalculatorDraftAction(
  payload: CalculatorDraftPayload,
): Promise<CreateCalculatorDraftResult> {
  const limited = await rateLimit({
    key: `calc-draft:${payload.calculatorType || "unknown"}`,
    ...RATE_LIMITS.publicRfqSubmission,
  });
  if (!limited.success) {
    return {
      ok: false,
      error: "Too many requests. Please wait a moment and try again.",
    };
  }

  if (!payload.calculatorType?.trim()) {
    return { ok: false, error: "Calculator type is required." };
  }

  return createCalculatorQuoteDraft({
    calculatorType: payload.calculatorType.trim().slice(0, 120),
    inputs: payload.inputs ?? {},
    results: payload.results ?? {},
  });
}
