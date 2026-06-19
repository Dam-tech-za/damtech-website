import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { HEADER_NAV_LINKS, siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:py-4">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white"
            aria-hidden
          >
            DT
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-lg font-bold tracking-tight text-navy">
              {siteConfig.name}
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Dam liners &amp; waterproofing
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-5 lg:flex lg:flex-1 lg:justify-center xl:gap-6"
          aria-label="Main"
        >
          {HEADER_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm font-medium text-slate-700 transition hover:text-water"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/quote" className="btn-primary hidden text-sm lg:inline-flex">
            Get a Quote
          </Link>
          <MobileNav links={HEADER_NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
