import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: readonly FAQItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  showHeading?: boolean;
  tone?: "default" | "muted";
};

export function FAQ({
  items,
  heading = "Frequently Asked Questions",
  eyebrow = "FAQ",
  intro,
  showHeading = true,
  tone = "default",
}: FAQProps) {
  if (items.length === 0) return null;

  const content = (
    <div className="site-faq-list">
      {items.map((item) => (
        <details key={item.question} className="site-faq-item">
          <summary className="site-faq-item__question">{item.question}</summary>
          <p className="site-faq-item__answer">{item.answer}</p>
        </details>
      ))}
    </div>
  );

  if (!showHeading) return content;

  return (
    <SiteSection tone={tone} aria-labelledby="faq-section-heading">
      <PageSectionHeader
        id="faq-section-heading"
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
      />
      {content}
    </SiteSection>
  );
}
