"use server";

import { headers } from "next/headers";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { publicClientRateKey } from "@/lib/rate-limit/types";
import {
  createCalculatorQuoteDraft,
  type CalculatorDraftPayload,
} from "@/lib/rfq/calculator-draft";
import { customerMessageForCode } from "@/lib/rfq/submission-result";

export type CreateCalculatorDraftResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createCalculatorDraftAction(
  payload: CalculatorDraftPayload,
): Promise<CreateCalculatorDraftResult> {
  if (!payload.calculatorType?.trim()) {
    return { ok: false, error: "Calculator type is required." };
  }

  const headerList = await headers();
  const key = publicClientRateKey(headerList, "calculator-draft");
  const limited = await rateLimit({
    key,
    ...RATE_LIMITS.calculatorDraftCreate,
  });
  if (!limited.success && limited.reason === "rate_limited") {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limited.resetAt - Date.now()) / 1000),
    );
    return {
      ok: false,
      error: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }),
    };
  }

  return createCalculatorQuoteDraft({
    calculatorType: payload.calculatorType.trim().slice(0, 120),
    inputs: payload.inputs ?? {},
    results: payload.results ?? {},
  });
}
