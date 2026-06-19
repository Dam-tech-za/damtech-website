import Link from "next/link";
import {
  FOOTER_LINKS,
  OFFICES,
  phoneTel,
  siteConfig,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-navy text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{siteConfig.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {siteConfig.defaultDescription}
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <p>
              <span className="font-medium text-white">Phone: </span>
              <a href={`tel:${phoneTel}`} className="hover:text-white">
                {siteConfig.phone}
              </a>
            </p>
            <p>
              <span className="font-medium text-white">Email: </span>
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
            Quick Links
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {FOOTER_LINKS.map((link) => (
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
            <Link href="/about-us-waterproofing-company" className="hover:text-white">
              About Damtech
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
