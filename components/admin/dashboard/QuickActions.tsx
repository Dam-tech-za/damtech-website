import Link from "next/link";
import { AdminPanel } from "@/components/admin/ui";

type QuickActionsProps = {
  expiringQuotesCount: number;
};

const ACTIONS = [
  {
    href: "/admin/rfqs/?status=new",
    label: "Review New RFQs",
    icon: "①",
  },
  {
    href: "/admin/quotes/new/",
    label: "Create Quote",
    icon: "②",
  },
  {
    href: "/admin/customers/",
    label: "Add Customer",
    icon: "③",
  },
  {
    href: "/admin/pricing/materials/",
    label: "Add Material Price",
    icon: "④",
  },
  {
    href: "/admin/pricing/suppliers/",
    label: "Add Supplier",
    icon: "⑤",
  },
] as const;

export function QuickActions({ expiringQuotesCount }: QuickActionsProps) {
  return (
    <AdminPanel title="Quick Actions">
      <ul className="dash-quick">
        {ACTIONS.map((action) => (
          <li key={action.href}>
            <Link href={action.href} className="dash-quick__item">
              <span className="dash-quick__icon" aria-hidden>
                {action.icon}
              </span>
              <span>{action.label}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/admin/quotes/?expiring=1"
            className="dash-quick__item"
          >
            <span className="dash-quick__icon" aria-hidden>
              ⑥
            </span>
            <span>
              View Expiring Quotes
              {expiringQuotesCount > 0 ? ` (${expiringQuotesCount})` : ""}
            </span>
          </Link>
        </li>
      </ul>
    </AdminPanel>
  );
}
