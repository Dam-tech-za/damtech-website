import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPricingHubPage() {
  await requireAdmin({ permission: "viewPricing" });

  const links = [
    {
      href: "/admin/pricing/materials/",
      title: "Materials",
      body: "Geomembrane, geotextile, fittings and consumables library",
    },
    {
      href: "/admin/pricing/labour/",
      title: "Labour",
      body: "Crew rates, productivity and installation labour items",
    },
    {
      href: "/admin/pricing/suppliers/",
      title: "Suppliers",
      body: "Supplier contacts, price validity and preferred vendors",
    },
    {
      href: "/admin/pricing/travel/",
      title: "Travel & delivery",
      body: "Km rates, delivery defaults and travel labour settings",
    },
    {
      href: "/admin/pricing/tank-models/",
      title: "Tank models",
      body: "Corrugated steel tank catalogue for RFQ matching",
    },
  ];

  return (
    <div className="admin-metric-grid">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="admin-metric-card admin-metric-card--link">
          <p className="admin-metric-card__label">{link.title}</p>
          <p className="admin-metric-card__hint">{link.body}</p>
        </Link>
      ))}
    </div>
  );
}
