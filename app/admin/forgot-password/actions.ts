"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { normaliseResetEmail, resetLinkOrigin, validateNewPassword } from "@/lib/auth/password-policy";
import { writeAuditLog } from "@/lib/auth/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CANONICAL_ORIGIN } from "@/lib/site-url";
import {
  actionFailure,
  actionSuccess,
  type AdminActionState,
} from "@/lib/admin/action-state";

const NEUTRAL_MESSAGE =
  "If that email belongs to an active Damtech admin, a reset link is on its way. Open it in this browser within an hour. Check your spam folder if it does not arrive in a few minutes.";

async function clientIp(): Promise<string> {
  const list = await headers();
  return (
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Step 1: email a password-reset link. The reply is the same whether or not
 * the address is an admin, so the form cannot be used to discover accounts.
 */
export async function requestPasswordResetAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const email = normaliseResetEmail(String(formData.get("email") ?? ""));
  if (!email) return actionFailure("Enter a valid email address.");

  const ip = await clientIp();
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit({
      key: `password-reset:ip:${ip}`,
      limit: 5,
      windowMs: 15 * 60_000,
      name: "password-reset-ip",
      onProviderError: "fail_open_public",
    }),
    rateLimit({
      key: `password-reset:email:${email}`,
      limit: 3,
      windowMs: 60 * 60_000,
      name: "password-reset-email",
      onProviderError: "fail_open_public",
    }),
  ]);
  if (!ipLimit.success || !emailLimit.success) {
    return actionFailure("Too many reset requests. Please wait a while and try again.");
  }

  try {
    // Only send to active admins: keeps the Supabase email quota for real use.
    const service = createServiceRoleClient();
    const { data: profile } = await service
      .from("admin_profiles")
      .select("id")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (profile) {
      const origin = resetLinkOrigin((await headers()).get("origin"), CANONICAL_ORIGIN);
      const redirectTo = new URL("/auth/callback", origin);
      redirectTo.searchParams.set("next", "/admin/reset-password/");

      const supabase = await createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString(),
      });
      if (error) {
        console.error("[password-reset] send failed:", error.message);
        if (error.status === 429) {
          return actionFailure(
            "The email service is busy. Please wait a few minutes and try again.",
          );
        }
        return actionFailure(
          "The reset email could not be sent. Please try again in a few minutes.",
        );
      }
      await writeAuditLog({
        actorUserId: profile.id,
        actorEmail: email,
        action: "admin_password_reset_requested",
        entityType: "admin_profile",
        entityId: profile.id,
      });
    }
  } catch (error) {
    console.error(
      "[password-reset] request failed:",
      error instanceof Error ? error.message : error,
    );
    return actionFailure("The reset email could not be sent. Please try again in a few minutes.");
  }

  return actionSuccess(NEUTRAL_MESSAGE);
}

/**
 * Step 2: set the new password. Requires the session created by the emailed
 * link (or an existing signed-in session).
 */
export async function setNewPasswordAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const problem = validateNewPassword(password, confirm);
  if (problem) return actionFailure(problem);

  const user = await getCurrentUser();
  if (!user?.email) {
    return actionFailure(
      "Your reset link has expired. Request a new one from the sign-in page.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[password-reset] update failed:", error.message);
    if (error.code === "same_password") {
      return actionFailure("Choose a password you have not used for this account before.");
    }
    if (error.code === "weak_password") {
      return actionFailure("That password is too easy to guess. Choose a longer or less common one.");
    }
    if (error.code === "reauthentication_needed" || error.status === 401) {
      return actionFailure("Your reset link has expired. Request a new one from the sign-in page.");
    }
    return actionFailure("The password could not be changed. Please try again.");
  }

  await writeAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    action: "admin_password_changed",
    entityType: "admin_profile",
    entityId: user.id,
  });

  redirect("/admin/?password=changed");
}
