import Link from "next/link";
import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";

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
        <div key={section.heading}>
          <h2 className="section-heading">{section.heading}</h2>
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
  return (
    <div>
      <h2 className="section-heading">{heading}</h2>
      <div className="mt-6 space-y-4">
        {faqs.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
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
      <h2 className="section-heading">{heading}</h2>
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
