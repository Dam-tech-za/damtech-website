import type { SupabaseClient } from "@supabase/supabase-js";

export type AssuranceLevel = "aal1" | "aal2";

/**
 * Assurance level of the current session: aal2 once an authenticator-app code
 * has been verified in this session, otherwise aal1 (password or Google only).
 * Call after auth.getUser() in the same request, which has verified the token
 * this reads the level from.
 */
export async function getAssuranceLevel(
  supabase: SupabaseClient,
): Promise<AssuranceLevel> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return "aal1";
    return data.currentLevel === "aal2" ? "aal2" : "aal1";
  } catch {
    return "aal1";
  }
}

export type TotpFactor = { id: string; friendlyName: string | null; verified: boolean };

/** Authenticator-app factors on the signed-in account (verified and unverified). */
export async function listTotpFactors(supabase: SupabaseClient): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return [];
  return data.all
    .filter((factor) => factor.factor_type === "totp")
    .map((factor) => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? null,
      verified: factor.status === "verified",
    }));
}

/** Six digits, spaces allowed (some apps show "123 456"). */
export function normaliseTotpCode(raw: string): string | null {
  const code = raw.replace(/\s+/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}

/** Only same-site admin paths are allowed as the post-verification destination. */
export function safeAdminNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("/admin/mfa")) return "/admin/";
  return raw;
}
