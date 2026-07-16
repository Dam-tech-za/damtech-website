"use server";

import { headers } from "next/headers";
import {
  RATE_LIMITS,
  publicSubmissionLimitError,
  rateLimit,
} from "@/lib/security/rate-limit";
import { clientIpFromHeaders } from "@/lib/rate-limit/types";
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
  if (!payload.calculatorType?.trim()) {
    return { ok: false, error: "Calculator type is required." };
  }

  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);

  const limited = await rateLimit({
    key: `calc-draft:${ip}`,
    ...RATE_LIMITS.calculatorDraftCreate,
  });
  if (!limited.success) {
    return {
      ok: false,
      error: publicSubmissionLimitError(limited),
    };
  }

  return createCalculatorQuoteDraft({
    calculatorType: payload.calculatorType.trim().slice(0, 120),
    inputs: payload.inputs ?? {},
    results: payload.results ?? {},
  });
}
