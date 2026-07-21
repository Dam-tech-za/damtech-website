export const ADMIN_ROLES = [
  "owner",
  "admin",
  "sales",
  "estimator",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type AdminNavItemId =
  | "dashboard"
  | "rfqs"
  | "quotes"
  | "customers"
  | "pricing"
  | "project-templates"
  | "suppliers"
  | "settings"
  | "audit";

export type AdminNavItem = {
  id: AdminNavItemId;
  label: string;
  href: string;
  description: string;
};

/** Normalise email for allowlist matching. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
