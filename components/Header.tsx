import Link from "next/link";
import { DamtechLogo } from "@/components/DamtechLogo";
import { MobileNav } from "@/components/MobileNav";
import { HEADER_NAV_LINKS, siteConfig } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="site-container relative flex items-center justify-between gap-4 py-3.5 lg:gap-6 lg:py-4">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <DamtechLogo size={40} className="block shrink-0 translate-y-0.5" />
          <span className="flex min-w-0 flex-col justify-center leading-tight">
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
          <Link href="/quote" className="btn-primary hidden text-sm sm:inline-flex">
            Request a Free Quote
          </Link>
          <MobileNav links={HEADER_NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
