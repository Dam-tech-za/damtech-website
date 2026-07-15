import {
  createServiceRoleClient,
} from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { writeAuditLog } from "./audit";
import type { AdminProfile, AdminRole } from "./types";
import { ADMIN_ROLES, normaliseEmail } from "./types";

export type ProvisionResult =
  | { ok: true; profile: AdminProfile }
  | { ok: false; reason: "not_allowlisted" | "inactive" | "misconfigured" | "error"; message: string };

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

/**
 * After Google OAuth: match normalised email to allowlist, upsert admin_profiles.
 * Uses the service-role client so allowlist checks cannot be bypassed via RLS.
 */
export async function provisionAdminFromAllowlist(input: {
  userId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<ProvisionResult> {
  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      reason: "misconfigured",
      message: "Admin authentication is not configured on this server.",
    };
  }

  const email = normaliseEmail(input.email);
  if (!email) {
    return {
      ok: false,
      reason: "error",
      message: "Authenticated user has no email address.",
    };
  }

  try {
    const client = createServiceRoleClient();

    const { data: allowlistRow, error: allowlistError } = await client
      .from("admin_email_allowlist")
      .select("email, assigned_role, is_active")
      .eq("email", email)
      .maybeSingle();

    if (allowlistError) {
      console.error("[auth] allowlist lookup failed:", allowlistError.message);
      return {
        ok: false,
        reason: "error",
        message: "Unable to verify admin access.",
      };
    }

    if (!allowlistRow) {
      await writeAuditLog({
        actorUserId: input.userId,
        actorEmail: email,
        action: "access_denied",
        entityType: "admin_auth",
        metadata: { reason: "not_allowlisted" },
      });
      return {
        ok: false,
        reason: "not_allowlisted",
        message: "This Google account is not approved for Damtech Administration.",
      };
    }

    if (!allowlistRow.is_active) {
      await writeAuditLog({
        actorUserId: input.userId,
        actorEmail: email,
        action: "access_denied",
        entityType: "admin_auth",
        metadata: { reason: "allowlist_inactive" },
      });
      return {
        ok: false,
        reason: "inactive",
        message: "This admin account has been deactivated.",
      };
    }

    const role = isAdminRole(allowlistRow.assigned_role)
      ? allowlistRow.assigned_role
      : "viewer";

    const now = new Date().toISOString();

    const { data: profileRow, error: upsertError } = await client
      .from("admin_profiles")
      .upsert(
        {
          id: input.userId,
          email,
          full_name: input.fullName ?? null,
          avatar_url: input.avatarUrl ?? null,
          role,
          is_active: true,
          updated_at: now,
          last_login_at: now,
        },
        { onConflict: "id" },
      )
      .select(
        "id, email, full_name, avatar_url, role, is_active, created_at, updated_at, last_login_at",
      )
      .single();

    if (upsertError || !profileRow) {
      console.error("[auth] profile upsert failed:", upsertError?.message);
      return {
        ok: false,
        reason: "error",
        message: "Unable to create admin profile.",
      };
    }

    if (!profileRow.is_active) {
      await writeAuditLog({
        actorUserId: input.userId,
        actorEmail: email,
        action: "access_denied",
        entityType: "admin_auth",
        metadata: { reason: "profile_inactive" },
      });
      return {
        ok: false,
        reason: "inactive",
        message: "This admin account has been deactivated.",
      };
    }

    const profile: AdminProfile = {
      id: profileRow.id,
      email: profileRow.email,
      full_name: profileRow.full_name,
      avatar_url: profileRow.avatar_url,
      role: isAdminRole(profileRow.role) ? profileRow.role : role,
      is_active: profileRow.is_active,
      created_at: profileRow.created_at,
      updated_at: profileRow.updated_at,
      last_login_at: profileRow.last_login_at,
    };

    await writeAuditLog({
      actorUserId: input.userId,
      actorEmail: email,
      action: "login",
      entityType: "admin_auth",
      entityId: input.userId,
      afterData: { role: profile.role },
    });

    return { ok: true, profile };
  } catch (error) {
    console.error("[auth] provision failed:", error);
    return {
      ok: false,
      reason: "error",
      message: "Unexpected error while verifying admin access.",
    };
  }
}
