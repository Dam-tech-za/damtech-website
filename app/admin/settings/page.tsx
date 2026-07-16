import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminPageHeader,
  SettingsNavCard,
} from "@/components/admin/ui";

export default async function AdminSettingsIndexPage() {
  await requireAdmin({ permission: "manageSettings" });

  const groups = [
    {
      title: "Business",
      items: [
        {
          href: "/admin/settings/company/",
          title: "Company details",
          description:
            "Legal name, trading details, addresses, banking and branding.",
        },
      ],
    },
    {
      title: "Quotations",
      items: [
        {
          href: "/admin/settings/quotes/",
          title: "Quote defaults",
          description:
            "Numbering, validity, payment terms, deposits and approval rules.",
        },
      ],
    },
    {
      title: "Estimating",
      items: [
        {
          href: "/admin/settings/estimating/",
          title: "Estimating inputs",
          description:
            "VAT, markup versus margin, allowances, labour burden and travel.",
        },
      ],
    },
    {
      title: "PDF & email",
      items: [
        {
          href: "/admin/settings/pdf/",
          title: "PDF branding",
          description: "Logo, header, footer, colours and banking display.",
        },
        {
          href: "/admin/settings/email/",
          title: "Email delivery",
          description:
            "Sender address, reply-to, notifications and test delivery.",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          href: "/admin/settings/system/",
          title: "System health",
          description:
            "Supabase, Resend, Upstash, storage and cron status checks.",
        },
      ],
    },
  ];

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Settings"
        description="Configure company, quotation, estimating and system preferences."
      />

      {groups.map((group) => (
        <section key={group.title} className="admin-section">
          <header className="admin-section__header">
            <h2 className="admin-section__title">{group.title}</h2>
          </header>
          <div className="admin-settings-grid">
            {group.items.map((item) => (
              <SettingsNavCard
                key={item.href}
                href={item.href}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
