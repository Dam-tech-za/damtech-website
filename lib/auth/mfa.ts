import type { SupabaseClient } from "@supabase/supabase-js";

export type AssuranceLevel = "aal1" | "aal2";

/**
 * How long one authenticator code is trusted. A signed-in admin stays signed
 * in on that device and is asked for a fresh code only after this many days
 * (or after signing out). The session itself stays aal2 throughout, so the
 * database 2FA lock keeps working.
 */
export const MFA_REMEMBER_DAYS = 30;

type AuthMethod = { method?: unknown; timestamp?: unknown } | string;

/**
 * aal2 only while the newest authenticator-code check in this session is
 * younger than MFA_REMEMBER_DAYS. Pure so it can be unit-tested.
 */
export function effectiveAssurance(
  currentLevel: string | null | undefined,
  methods: readonly AuthMethod[] | null | undefined,
  nowMs: number = Date.now(),
): AssuranceLevel {
  if (currentLevel !== "aal2") return "aal1";
  let newest = 0;
  for (const entry of methods ?? []) {
    if (typeof entry === "string" || entry.method !== "totp") continue;
    const seconds = Number(entry.timestamp);
    if (Number.isFinite(seconds) && seconds > newest) newest = seconds;
  }
  if (!newest) return "aal1";
  const ageMs = nowMs - newest * 1000;
  return ageMs < MFA_REMEMBER_DAYS * 24 * 60 * 60 * 1000 ? "aal2" : "aal1";
}

/**
 * Assurance level of the current session for the admin gates: aal2 once an
 * authenticator-app code has been verified within the last MFA_REMEMBER_DAYS,
 * otherwise aal1. Call after auth.getUser() in the same request, which has
 * verified the token this reads the level from.
 */
export async function getAssuranceLevel(
  supabase: SupabaseClient,
): Promise<AssuranceLevel> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return "aal1";
    return effectiveAssurance(data.currentLevel, data.currentAuthenticationMethods);
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
