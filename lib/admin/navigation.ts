import type { AdminNavItem, AdminNavItemId } from "../auth/types";

/**
 * Admin information architecture: sidebar groups, active-item resolution,
 * breadcrumbs and page titles. Pure functions so they can be unit-tested and
 * shared by the desktop sidebar, the mobile menu and the layout.
 */

export type AdminNavGroup = {
  id: string;
  label: string;
  itemIds: AdminNavItemId[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: "overview", label: "Overview", itemIds: ["dashboard"] },
  { id: "operations", label: "Operations", itemIds: ["operations", "procurement"] },
  {
    id: "sales",
    label: "Sales",
    itemIds: ["rfqs", "quotes", "orders", "customers"],
  },
  {
    id: "estimating",
    label: "Estimating",
    itemIds: ["pricing", "project-templates", "suppliers"],
  },
  {
    id: "administration",
    label: "Administration",
    itemIds: ["settings", "audit"],
  },
];

export function groupNavItems(
  items: AdminNavItem[],
): Array<{ group: AdminNavGroup; items: AdminNavItem[] }> {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ADMIN_NAV_GROUPS.map((group) => ({
    group,
    items: group.itemIds
      .map((id) => byId.get(id))
      .filter((item): item is AdminNavItem => Boolean(item)),
  })).filter((entry) => entry.items.length > 0);
}

function normalisePath(pathname: string): string {
  const clean = pathname.split(/[?#]/)[0] || "/";
  return clean.endsWith("/") ? clean : `${clean}/`;
}

/**
 * The nav item whose href is the longest prefix of the current path wins, so
 * /admin/pricing/suppliers/ highlights Suppliers only, not Pricing as well.
 */
export function activeNavItemId(
  pathname: string,
  items: AdminNavItem[],
): AdminNavItemId | null {
  const path = normalisePath(pathname);
  let best: AdminNavItem | null = null;
  for (const item of items) {
    const href = normalisePath(item.href);
    const matches =
      href === "/admin/" ? path === "/admin/" : path.startsWith(href);
    if (matches && (!best || href.length > normalisePath(best.href).length)) {
      best = item;
    }
  }
  return best?.id ?? null;
}

const SEGMENT_LABELS: Record<string, string> = {
  operations: "Operations",
  projects: "Projects",
  procurement: "Procurement",
  rfqs: "Enquiries",
  quotes: "Quotations",
  orders: "Orders",
  customers: "Customers",
  pricing: "Pricing",
  import: "CSV import",
  history: "Import history",
  materials: "Materials",
  labour: "Labour",
  travel: "Travel & delivery",
  services: "Services & installation",
  equipment: "Equipment & site costs",
  "tank-models": "Tank models",
  "project-templates": "Project templates",
  suppliers: "Suppliers",
  review: "Price review",
  new: "New",
  edit: "Edit",
  preview: "Preview",
  revisions: "Revisions",
  settings: "Settings",
  company: "Company",
  email: "Email",
  estimating: "Estimating rules",
  pdf: "PDF layout",
  system: "System health",
  audit: "Audit log",
};

const ID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentLabel(segment: string, parent: string | undefined): string {
  if (ID_SEGMENT.test(segment)) {
    if (parent === "rfqs") return "Enquiry";
    if (parent === "quotes") return "Quotation";
    if (parent === "orders") return "Order";
    if (parent === "customers") return "Customer";
    if (parent === "projects") return "Project";
    return "Details";
  }
  const label = SEGMENT_LABELS[segment];
  if (label) return label;
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export type AdminCrumb = { label: string; href?: string };

export function adminBreadcrumbs(pathname: string): AdminCrumb[] {
  const crumbs: AdminCrumb[] = [{ label: "Overview", href: "/admin/" }];
  const rest = normalisePath(pathname).replace(/^\/admin\/?/, "").replace(/\/$/, "");
  if (!rest) return crumbs;

  const segments = rest.split("/").filter(Boolean);
  let path = "/admin";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const crumb: AdminCrumb = { label: segmentLabel(segment, segments[index - 1]) };
    if (index < segments.length - 1) crumb.href = `${path}/`;
    crumbs.push(crumb);
  });
  return crumbs;
}

export function adminPageTitle(pathname: string): string {
  const rest = normalisePath(pathname).replace(/^\/admin\/?/, "");
  const segment = rest.split("/")[0];
  if (!segment) return "Overview";
  return segmentLabel(segment, undefined);
}
