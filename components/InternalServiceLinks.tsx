import Link from "next/link";
import { SERVICE_LINKS } from "@/lib/site";

type InternalServiceLinksProps = {
  currentPath?: string;
  heading?: string;
};

export function InternalServiceLinks({
  currentPath,
  heading = "Related Damtech Services",
}: InternalServiceLinksProps) {
  const links = SERVICE_LINKS.filter((link) => link.href !== currentPath);

  return (
    <section className="content-wrap border-t border-slate-200 pt-10">
      <h2 className="section-heading">{heading}</h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-navy transition hover:border-water hover:text-water"
            >
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
