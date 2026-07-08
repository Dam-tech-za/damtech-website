import type { FaqCategory } from "@/lib/faq-content";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

type FaqCategoryListProps = {
  categories: readonly FaqCategory[];
  tone?: "default" | "muted";
};

/** Grouped FAQ accordion — preserves visual theme, improves SEO Q&A structure. */
export function FaqCategoryList({
  categories,
  tone = "muted",
}: FaqCategoryListProps) {
  return (
    <>
      {categories.map((category, index) => (
        <SiteSection
          key={category.id}
          tone={index % 2 === 0 ? tone : "default"}
          aria-labelledby={`faq-${category.id}-heading`}
        >
          <PageSectionHeader
            id={`faq-${category.id}-heading`}
            eyebrow={category.eyebrow}
            title={category.title}
          />
          <div className="site-faq-list">
            {category.items.map((item) => (
              <details key={item.question} className="site-faq-item">
                <summary className="site-faq-item__question">
                  {item.question}
                </summary>
                <p className="site-faq-item__answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </SiteSection>
      ))}
    </>
  );
}
