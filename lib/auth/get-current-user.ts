import { createClient } from "@/lib/supabase/server";
import type { AdminProfile, AdminRole } from "./types";
import { ADMIN_ROLES } from "./types";

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

function mapProfile(row: Record<string, unknown>): AdminProfile | null {
  if (
    typeof row.id !== "string" ||
    typeof row.email !== "string" ||
    !isAdminRole(row.role) ||
    typeof row.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    role: row.role,
    is_active: row.is_active,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    last_login_at:
      typeof row.last_login_at === "string" ? row.last_login_at : null,
  };
}

export type CurrentAdmin =
  | {
      user: { id: string; email: string };
      profile: AdminProfile;
    }
  | null;

/**
 * Returns the signed-in Supabase user plus active admin profile, or null.
 * Does not throw — callers decide how to redirect.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return null;
    }

    const { data, error: profileError } = await supabase
      .from("admin_profiles")
      .select(
        "id, email, full_name, avatar_url, role, is_active, created_at, updated_at, last_login_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !data) {
      return null;
    }

    const profile = mapProfile(data as Record<string, unknown>);
    if (!profile || !profile.is_active) {
      return null;
    }

    return {
      user: { id: user.id, email: user.email },
      profile,
    };
  } catch {
    return null;
  }
}

/** Auth user only (may be unapproved). Used by login / unauthorised flows. */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
