import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { getSystemSummary } from "@/lib/admin/system-summary";
import { AdminPageHeader, SettingsNavCard } from "@/components/admin/ui";

/**
 * Settings home: everything configurable, grouped, one line each. Status
 * lines (Xero, daily reminder, overall health) come from live checks.
 */
export default async function AdminSettingsIndexPage() {
  const admin = await requireAdmin({ permission: "manageSettings" });
  const role = admin.profile.role;
  const health = await getSystemSummary();
  const row = (label: string) => health.rows.find((r) => r.label === label);
  const problems = health.rows.filter((r) => r.tone !== "good").length;

  const groups: { title: string; items: { href: string; title: string; description: string; meta?: string }[] }[] = [
    {
      title: "Your business",
      items: [
        { href: "/admin/settings/company/", title: "Company details", description: "Name, addresses, banking and logo used on documents." },
        ...(canAccessNavItem(role, "pricing")
          ? [{ href: "/admin/pricing/", title: "Pricing", description: "Materials, labour, travel and tank prices used by the calculators." }]
          : []),
        ...(canAccessNavItem(role, "project-templates")
          ? [{ href: "/admin/project-templates/", title: "Project templates", description: "Standard line items for common job types." }]
          : []),
      ],
    },
    {
      title: "Quotes and documents",
      items: [
        { href: "/admin/settings/quotes/", title: "Quote defaults", description: "Numbering, validity, payment terms and deposits." },
        { href: "/admin/settings/estimating/", title: "Estimating rules", description: "VAT, markup, allowances and travel rates." },
        { href: "/admin/settings/pdf/", title: "PDF layout", description: "Logo, header, footer and colours on PDFs." },
      ],
    },
    {
      title: "Connections and alerts",
      items: [
        { href: "/admin/operations/", title: "Xero", description: "Quotes, invoices and payments come from Xero.", meta: row("Xero") ? `${row("Xero")!.status} · ${row("Xero")!.detail}` : undefined },
        { href: "/admin/settings/email/", title: "Email", description: "Sender address, reply-to and a test send.", meta: row("Email")?.status },
        { href: "/admin/settings/system/", title: "Daily reminder", description: "The 07:15 \"what needs attention\" email, Monday to Saturday.", meta: row("Daily reminder") ? `${row("Daily reminder")!.status} · ${row("Daily reminder")!.detail}` : undefined },
      ],
    },
    {
      title: "Safety",
      items: [
        { href: "/admin/settings/system/", title: "System health", description: "Database, Xero, email and reminders at a glance.", meta: problems ? `${problems} need${problems === 1 ? "s" : ""} a look` : "All working" },
        ...(canAccessNavItem(role, "audit") ? [{ href: "/admin/audit/", title: "Activity log", description: "Who changed what, and when." }] : []),
      ],
    },
  ];

  return (
    <div className="admin-stack--page">
      <AdminPageHeader title="Settings" description="How the admin and the website's documents are set up." />
      {groups.map((group) => (
        <section key={group.title} className="admin-section">
          <header className="admin-section__header">
            <h2 className="admin-section__title">{group.title}</h2>
          </header>
          <div className="admin-settings-grid">
            {group.items.map((item) => (
              <SettingsNavCard key={item.title} href={item.href} title={item.title} description={item.description} meta={item.meta} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
