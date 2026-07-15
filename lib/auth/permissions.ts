import type { AdminNavItem, AdminNavItemId, AdminRole } from "./types";

const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  estimator: 2,
  sales: 3,
  admin: 4,
  owner: 5,
};

/** True if `role` meets or exceeds the minimum required role rank. */
export function roleAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function hasAnyRole(
  role: AdminRole,
  allowed: readonly AdminRole[],
): boolean {
  return allowed.includes(role);
}

/** Nav items each role may see. Mutations are still enforced server-side + RLS. */
const NAV_ACCESS: Record<AdminNavItemId, readonly AdminRole[]> = {
  dashboard: ["owner", "admin", "sales", "estimator", "viewer"],
  rfqs: ["owner", "admin", "sales", "estimator", "viewer"],
  quotes: ["owner", "admin", "sales", "estimator", "viewer"],
  customers: ["owner", "admin", "sales", "viewer"],
  pricing: ["owner", "admin", "estimator", "viewer"],
  suppliers: ["owner", "admin", "viewer"],
  settings: ["owner", "admin"],
  audit: ["owner", "admin"],
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/",
    description: "Overview and metrics",
  },
  {
    id: "rfqs",
    label: "RFQs",
    href: "/admin/rfqs/",
    description: "Incoming requests for quote",
  },
  {
    id: "quotes",
    label: "Quotes",
    href: "/admin/quotes/",
    description: "Draft and sent quotes",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/admin/customers/",
    description: "Customer records",
  },
  {
    id: "pricing",
    label: "Pricing",
    href: "/admin/pricing/",
    description: "Pricing tables and calculators",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "/admin/suppliers/",
    description: "Supplier directory",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings/",
    description: "Admin and security settings",
  },
  {
    id: "audit",
    label: "Audit Log",
    href: "/admin/audit/",
    description: "Security and change history",
  },
];

export function canAccessNavItem(role: AdminRole, itemId: AdminNavItemId): boolean {
  return hasAnyRole(role, NAV_ACCESS[itemId]);
}

export function getNavItemsForRole(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => canAccessNavItem(role, item.id));
}

/** Mutation permission helpers — used by Server Actions before DB writes. */
export const PERMISSIONS = {
  manageAllowlist: ["owner"] as const satisfies readonly AdminRole[],
  changeRoles: ["owner"] as const satisfies readonly AdminRole[],
  manageSettings: ["owner", "admin"] as const satisfies readonly AdminRole[],
  manageQuotes: ["owner", "admin", "sales", "estimator"] as const,
  manageRfqs: ["owner", "admin", "sales", "estimator"] as const,
  manageCustomers: ["owner", "admin", "sales"] as const,
  viewAudit: ["owner", "admin"] as const,
  viewPricing: ["owner", "admin", "estimator", "viewer"] as const,
} as const;

export function canPerform(
  role: AdminRole,
  permission: keyof typeof PERMISSIONS,
): boolean {
  return hasAnyRole(role, PERMISSIONS[permission]);
}
