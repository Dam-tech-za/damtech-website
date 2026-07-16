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
    description: "Operations overview",
  },
  {
    id: "rfqs",
    label: "RFQs",
    href: "/admin/rfqs/",
    description: "Incoming enquiries",
  },
  {
    id: "quotes",
    label: "Quotes",
    href: "/admin/quotes/",
    description: "Draft and sent",
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
    description: "Materials and labour",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "/admin/pricing/suppliers/",
    description: "Supplier directory",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings/",
    description: "Company and system",
  },
  {
    id: "audit",
    label: "Audit Log",
    href: "/admin/audit/",
    description: "Change history",
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
  manageEstimatingSettings: ["owner", "admin"] as const satisfies readonly AdminRole[],
  manageQuotes: ["owner", "admin", "sales", "estimator"] as const,
  approveQuotes: ["owner", "admin"] as const,
  sendQuotes: ["owner", "admin", "sales"] as const,
  viewQuoteMargin: ["owner", "admin", "estimator"] as const,
  manageBankDetails: ["owner", "admin"] as const,
  manageQuoteNumbering: ["owner", "admin"] as const,
  exportQuotes: ["owner", "admin", "sales"] as const,
  manageRfqs: ["owner", "admin", "sales", "estimator"] as const,
  manageCustomers: ["owner", "admin", "sales"] as const,
  managePricing: ["owner", "admin", "estimator"] as const,
  viewCostPrices: ["owner", "admin", "estimator"] as const,
  viewSellPrices: ["owner", "admin", "sales", "estimator", "viewer"] as const,
  exportRfqs: ["owner", "admin", "sales", "estimator"] as const,
  archivePricing: ["owner", "admin"] as const,
  viewAudit: ["owner", "admin"] as const,
  viewPricing: ["owner", "admin", "estimator", "viewer"] as const,
} as const;

export function canPerform(
  role: AdminRole,
  permission: keyof typeof PERMISSIONS,
): boolean {
  return hasAnyRole(role, PERMISSIONS[permission]);
}
