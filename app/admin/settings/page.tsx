import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminSettingsIndexPage() {
  await requireAdmin({ permission: "manageSettings" });
  const links = [
    { href: "/admin/settings/estimating/", label: "Estimating" },
    { href: "/admin/settings/quotes/", label: "Quotes" },
    { href: "/admin/settings/company/", label: "Company" },
    { href: "/admin/settings/pdf/", label: "PDF" },
    { href: "/admin/settings/email/", label: "Email" },
    { href: "/admin/settings/system/", label: "System health" },
  ];

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <h2>Settings</h2>
      </header>
      <ul className="admin-list">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
