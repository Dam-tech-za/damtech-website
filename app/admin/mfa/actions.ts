"use server";

import { redirect } from "next/navigation";
import { actionFailure, type AdminActionState } from "@/lib/admin/action-state";
import { writeAuditLog } from "@/lib/auth/audit";
import { getAdminSession } from "@/lib/auth/get-current-user";
import { listTotpFactors, normaliseTotpCode, safeAdminNext } from "@/lib/auth/mfa";
import { rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type TotpEnrolment =
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; error: string };

/**
 * Starts authenticator-app set-up for an approved admin who has none yet.
 * Leftover unverified set-ups (page closed before the code was entered) are
 * removed first so the account never collects half-finished factors.
 */
export async function startTotpEnrolAction(): Promise<TotpEnrolment> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sign in again to set up two-step verification." };

  const supabase = await createClient();
  const factors = await listTotpFactors(supabase);
  if (factors.some((factor) => factor.verified)) {
    return { ok: false, error: "An authenticator app is already set up. Reload the page and enter its code." };
  }
  for (const factor of factors) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Damtech Admin",
    friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error("[mfa] enrol failed:", error?.message);
    return { ok: false, error: "Two-step set-up could not start. Please try again." };
  }

  return { ok: true, factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/**
 * Checks a six-digit authenticator code. Used both to finish set-up (the
 * form sends the new factorId) and at every sign-in afterwards. A correct
 * code upgrades the session to aal2, which unlocks the admin panel.
 */
export async function verifyTotpAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await getAdminSession();
  if (!session) return actionFailure("Your sign-in has expired. Sign in again.");

  const code = normaliseTotpCode(String(formData.get("code") ?? ""));
  if (!code) return actionFailure("Enter the 6-digit code from your authenticator app.");

  const limited = await rateLimit({
    key: `mfa-verify:${session.user.id}`,
    limit: 10,
    windowMs: 15 * 60_000,
    name: "mfa-verify",
    onProviderError: "fail_open_public",
  });
  if (!limited.success) {
    return actionFailure("Too many attempts. Wait a few minutes and try again.");
  }

  const supabase = await createClient();
  const factors = await listTotpFactors(supabase);
  const requestedId = String(formData.get("factorId") ?? "");
  const factor =
    factors.find((candidate) => candidate.id === requestedId) ??
    factors.find((candidate) => candidate.verified);
  if (!factor) {
    return actionFailure("No authenticator app is set up on this account. Reload the page to set one up.");
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) {
    return actionFailure("That code did not work. Check the time on your phone and use the newest code.");
  }

  await writeAuditLog({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    action: factor.verified ? "mfa_verified" : "mfa_enrolled",
    entityType: "admin_auth",
    entityId: session.user.id,
    metadata: { factorId: factor.id },
  });

  redirect(safeAdminNext(String(formData.get("next") ?? "")));
}
