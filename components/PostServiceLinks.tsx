import Link from "next/link";
import type { InternalServiceLink } from "@/lib/internal-links";

type PostServiceLinksProps = {
  links: InternalServiceLink[];
  heading?: string;
};

export function PostServiceLinks({
  links,
  heading = "Related Damtech services",
}: PostServiceLinksProps) {
  if (links.length === 0) return null;

  return (
    <aside className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-navy">{heading}</h2>
      <ul className="mt-4 space-y-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-semibold text-water underline-offset-2 hover:text-navy hover:underline"
            >
              {link.label}
            </Link>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {link.description}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
