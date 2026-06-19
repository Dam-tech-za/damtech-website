import Link from "next/link";
import { phoneTel, siteConfig } from "@/lib/site";

const QUICK_LINKS = [
  { href: "/dam-liners", label: "Dam Liners" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  { href: "/projects", label: "Projects" },
] as const;

export default function NotFound() {
  return (
    <main className="content-wrap flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-water">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-lg text-slate-600">
        The page may have moved, but Damtech can still help with dam liners,
        steel tanks and waterproofing.
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/services" className="btn-primary w-full sm:w-auto">
          View Services
        </Link>
        <Link href="/quote" className="btn-secondary w-full sm:w-auto">
          Request a Quote
        </Link>
        <Link href="/contact" className="btn-secondary w-full sm:w-auto">
          Contact Damtech
        </Link>
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-3">
        {QUICK_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-water hover:text-navy hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-slate-500">
        Or call{" "}
        <a href={`tel:${phoneTel}`} className="font-medium text-water">
          {siteConfig.phone}
        </a>
      </p>
    </main>
  );
}
