import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";
import { LazyFAQ } from "@/components/lazy";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { SiteSection } from "@/components/SiteSection";
import { resolveRelatedLinks } from "@/lib/related-services";

export function ServiceProseSections({
  sections,
  tone = "muted",
  nested = false,
}: {
  sections: ServiceSection[];
  tone?: "default" | "muted";
  nested?: boolean;
}) {
  if (sections.length === 0) return null;

  const content = (
    <div className="site-prose-sections">
      {sections.map((section) => (
        <article key={section.id ?? section.heading} className="site-prose-card">
          <PageSectionHeader
            id={section.id}
            eyebrow="MORE DETAIL"
            title={section.heading}
          />
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="site-prose-card__text">
              {paragraph}
            </p>
          ))}
        </article>
      ))}
    </div>
  );

  if (nested) return content;

  return <SiteSection tone={tone}>{content}</SiteSection>;
}

export function ServiceFaqSection({
  faqs,
  heading = "Frequently Asked Questions",
  eyebrow = "FAQ",
  intro,
}: {
  faqs: ServiceFaqItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
}) {
  return (
    <LazyFAQ
      items={faqs}
      heading={heading}
      eyebrow={eyebrow}
      intro={intro}
      tone="default"
    />
  );
}

export function RelatedPageLinks({
  links,
  heading = "Related Pages",
  eyebrow = "EXPLORE SERVICES",
  intro,
  excludeHref,
}: {
  links: readonly { href: string; label: string }[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  excludeHref?: string;
}) {
  return (
    <RelatedServicesGrid
      links={resolveRelatedLinks(links)}
      heading={heading}
      eyebrow={eyebrow}
      intro={intro}
      excludeHref={excludeHref}
      nested
    />
  );
}
