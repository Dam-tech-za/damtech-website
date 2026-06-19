import Link from "next/link";
import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";
import { LazyFAQ } from "@/components/lazy";
import { SectionHeading } from "@/components/SectionHeading";

export function ServiceProseSections({
  sections,
  className = "",
}: {
  sections: ServiceSection[];
  className?: string;
}) {
  return (
    <div className={`space-y-12 ${className}`}>
      {sections.map((section) => (
        <div key={section.id ?? section.heading}>
          <SectionHeading id={section.id}>{section.heading}</SectionHeading>
          {section.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mt-4 max-w-3xl leading-relaxed text-slate-600"
            >
              {paragraph}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ServiceFaqSection({
  faqs,
  heading = "Frequently Asked Questions",
}: {
  faqs: ServiceFaqItem[];
  heading?: string;
}) {
  return <LazyFAQ items={faqs} heading={heading} />;
}

export function RelatedPageLinks({
  links,
  heading = "Related Pages",
}: {
  links: readonly { href: string; label: string }[];
  heading?: string;
}) {
  return (
    <div>
      <SectionHeading>{heading}</SectionHeading>
      <ul className="mt-4 flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-water hover:text-water"
            >
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
