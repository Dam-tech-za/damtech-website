import Link from "next/link";
import { NAV_LINKS, siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white"
            aria-hidden
          >
            DT
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-navy">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Dam liners &amp; waterproofing
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-700 transition hover:text-water"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/contact" className="btn-secondary text-sm">
            Contact Damtech
          </Link>
          <Link href="/contact" className="btn-primary text-sm">
            Request a Quote
          </Link>
        </div>

        <details className="relative lg:hidden">
          <summary className="list-none cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-navy [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <nav className="flex flex-col gap-3" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-700 hover:text-water"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-slate-100" />
              <Link href="/contact" className="btn-primary text-center text-sm">
                Request a Quote
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
