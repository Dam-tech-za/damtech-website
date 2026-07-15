import { redirect } from "next/navigation";
import { getCurrentAdmin, type CurrentAdmin } from "./get-current-user";
import { canPerform, hasAnyRole, type PERMISSIONS } from "./permissions";
import type { AdminRole } from "./types";

export type RequireAdminOptions = {
  /** Allowed roles. If omitted, any active admin profile is enough. */
  roles?: readonly AdminRole[];
  /** Named permission from permissions.ts */
  permission?: keyof typeof PERMISSIONS;
};

/**
 * Server-side gate for admin pages and Server Actions.
 * Redirects unauthenticated users to login; unapproved users to unauthorised.
 * Throws for mutation callers that prefer try/catch over redirects — use
 * `assertAdmin()` for actions that should return errors instead.
 */
export async function requireAdmin(
  options: RequireAdminOptions = {},
): Promise<NonNullable<CurrentAdmin>> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    const userPresent = await import("./get-current-user").then((m) =>
      m.getCurrentUser(),
    );
    if (!userPresent) {
      redirect("/admin/login/");
    }
    redirect("/admin/unauthorised/");
  }

  if (options.roles && !hasAnyRole(admin.profile.role, options.roles)) {
    redirect("/admin/unauthorised/");
  }

  if (
    options.permission &&
    !canPerform(admin.profile.role, options.permission)
  ) {
    redirect("/admin/unauthorised/");
  }

  return admin;
}

export class AdminAuthError extends Error {
  readonly code: "unauthenticated" | "unauthorised" | "forbidden";

  constructor(
    code: "unauthenticated" | "unauthorised" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
    this.code = code;
  }
}

/**
 * Non-redirecting gate for Server Actions / Route Handlers that return JSON/form errors.
 */
export async function assertAdmin(
  options: RequireAdminOptions = {},
): Promise<NonNullable<CurrentAdmin>> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    const user = await import("./get-current-user").then((m) =>
      m.getCurrentUser(),
    );
    if (!user) {
      throw new AdminAuthError("unauthenticated", "Sign in required.");
    }
    throw new AdminAuthError(
      "unauthorised",
      "Your account is not approved for admin access.",
    );
  }

  if (options.roles && !hasAnyRole(admin.profile.role, options.roles)) {
    throw new AdminAuthError(
      "forbidden",
      "Your role cannot perform this action.",
    );
  }

  if (
    options.permission &&
    !canPerform(admin.profile.role, options.permission)
  ) {
    throw new AdminAuthError(
      "forbidden",
      "Your role cannot perform this action.",
    );
  }

  return admin;
}
