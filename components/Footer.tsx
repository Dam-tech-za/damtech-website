import Link from "next/link";
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_SERVICE_LINKS,
  OFFICES,
  phoneTel,
  siteConfig,
  whatsAppUrl,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-navy text-slate-200">
      <div className="site-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-bold text-white">{siteConfig.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {siteConfig.defaultDescription}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">
            Services
          </p>
          <ul className="mt-4 grid gap-2">
            {FOOTER_SERVICE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">
            Company
          </p>
          <ul className="mt-4 grid gap-2">
            {FOOTER_COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">
            Quote
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/quote" className="font-medium text-white hover:text-sky-200">
                Request a Free Quote
              </Link>
            </li>
            <li>
              <a href={`tel:${phoneTel}`} className="hover:text-white">
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
                {siteConfig.email}
              </a>
            </li>
            <li>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-700/60">
        <div className="site-container flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-white">Offices</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {OFFICES.map((office) => (
                <li key={office.name}>
                  <span className="text-slate-200">{office.name}</span>
                  {" — "}
                  <a
                    href={`tel:${office.phone.replace(/\s/g, "")}`}
                    className="hover:text-white"
                  >
                    {office.phone}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-300">
              We work nationwide — don&apos;t let our location fool you.
            </p>
          </div>
          <p className="text-xs text-slate-400 sm:text-right">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
