import { createHash, randomBytes } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";

const DRAFT_TTL_HOURS = 24;

export type CalculatorDraftPayload = {
  calculatorType: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createCalculatorQuoteDraft(
  payload: CalculatorDraftPayload,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "Draft storage is not configured." };
  }

  const calculatorType = payload.calculatorType.trim().slice(0, 120);
  if (!calculatorType) {
    return { ok: false, error: "Calculator type is required." };
  }

  const token = randomBytes(32).toString("base64url");
  const expires = new Date();
  expires.setHours(expires.getHours() + DRAFT_TTL_HOURS);

  const client = createServiceRoleClient();
  const { error } = await client.from("calculator_quote_drafts").insert({
    token_hash: hashToken(token),
    calculator_type: calculatorType,
    inputs: payload.inputs ?? {},
    results: payload.results ?? {},
    expires_at: expires.toISOString(),
  });

  if (error) {
    console.error("[rfq.draft] create failed:", error.message);
    return { ok: false, error: "Unable to prepare quote draft." };
  }

  return { ok: true, token };
}

export async function consumeCalculatorQuoteDraft(
  token: string,
): Promise<
  | { ok: true; draft: CalculatorDraftPayload }
  | { ok: false; error: string }
> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "Draft storage is not configured." };
  }

  const cleaned = token.trim();
  if (!cleaned || cleaned.length > 200) {
    return { ok: false, error: "Invalid draft token." };
  }

  const client = createServiceRoleClient();
  const tokenHash = hashToken(cleaned);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("calculator_quote_drafts")
    .select("id, calculator_type, inputs, results, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Draft not found or already used." };
  }
  if (data.consumed_at) {
    return { ok: false, error: "This quote draft has already been used." };
  }
  if (data.expires_at && data.expires_at < now) {
    return { ok: false, error: "This quote draft has expired." };
  }

  await client
    .from("calculator_quote_drafts")
    .update({ consumed_at: now })
    .eq("id", data.id);

  return {
    ok: true,
    draft: {
      calculatorType: data.calculator_type,
      inputs: (data.inputs ?? {}) as Record<string, unknown>,
      results: (data.results ?? {}) as Record<string, unknown>,
    },
  };
}
