"use server";

import { provisionAdminFromAllowlist } from "@/lib/auth/provision-admin";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

/** Soft server-side gate before Google OAuth or password sign-in. */
export async function checkLoginRateLimit(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const ip = await getClientIp();

  const result = await rateLimit({
    key: `login:${ip}`,
    ...RATE_LIMITS.loginInitiation,
  });

  if (!result.success) {
    return {
      ok: false,
      error:
        "Too many sign-in attempts. Please wait a few minutes and try again.",
    };
  }

  return { ok: true };
}

/**
 * Email + password admin login via Supabase Auth.
 * Same allowlist provisioning as Google OAuth.
 */
export async function signInWithEmailPassword(
  formData: FormData,
): Promise<{ ok: false; error: string } | void> {
  const limited = await checkLoginRateLimit();
  if (!limited.ok) {
    return limited;
  }

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin/");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin/";

  if (!emailRaw || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  // Extra per-email throttle so one account cannot be brute-forced from many IPs as easily.
  const emailLimit = await rateLimit({
    key: `login:email:${emailRaw}`,
    limit: 15,
    windowMs: 15 * 60_000,
    name: "login-email",
    onProviderError: "fail_open_public",
  });
  if (!emailLimit.success) {
    return {
      ok: false,
      error:
        "Too many sign-in attempts for this email. Please wait a few minutes and try again.",
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return {
      ok: false,
      error: "Admin authentication is not configured on this environment.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailRaw,
    password,
  });

  if (error || !data.user?.email) {
    return {
      ok: false,
      error: "Invalid email or password.",
    };
  }

  const provision = await provisionAdminFromAllowlist({
    userId: data.user.id,
    email: data.user.email,
    fullName:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : typeof data.user.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : null,
    avatarUrl:
      typeof data.user.user_metadata?.avatar_url === "string"
        ? data.user.user_metadata.avatar_url
        : null,
  });

  if (!provision.ok) {
    await supabase.auth.signOut();
    if (provision.reason === "inactive") {
      return {
        ok: false,
        error: "This admin account has been deactivated.",
      };
    }
    if (provision.reason === "not_allowlisted") {
      return {
        ok: false,
        error: "This account is not approved for Damtech Administration.",
      };
    }
    return { ok: false, error: provision.message };
  }

  redirect(next.startsWith("/") ? next : "/admin/");
}
