import Link from "next/link";
import {
  BLOG_LINKS,
  NAV_LINKS,
  OFFICES,
  SERVICE_LINKS,
  phoneTel,
  siteConfig,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-navy text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-white">{siteConfig.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {siteConfig.defaultDescription}
          </p>
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <a href={`tel:${phoneTel}`} className="hover:text-white">
                {siteConfig.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="hover:text-white"
              >
                {siteConfig.email}
              </a>
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Services
          </h2>
          <ul className="mt-4 space-y-2">
            {SERVICE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Blog
          </h2>
          <ul className="mt-4 space-y-2">
            {BLOG_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-white">
            Navigation
          </h2>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.slice(0, 5).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Offices
          </h2>
          <ul className="mt-4 space-y-4">
            {OFFICES.map((office) => (
              <li key={office.name} className="text-sm">
                <p className="font-medium text-white">{office.name}</p>
                <p className="text-slate-300">{office.phone}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-300">
            We work nationwide — don&apos;t let our location fool you. Give us a
            call.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>
            <Link href="/waterproofing-and-dam-liners" className="hover:text-white">
              FAQ
            </Link>
            {" · "}
            <Link href="/quote" className="hover:text-white">
              Request a Quote
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
