import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

type SpecItem = {
  label: string;
  value: string;
};

type SpecCardGridProps = {
  specs: readonly SpecItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  headingId?: string;
  tone?: "default" | "muted";
};

/** Homepage-style specification cards. */
export function SpecCardGrid({
  specs,
  heading = "Specifications",
  eyebrow = "TECHNICAL DETAIL",
  intro,
  headingId = "specifications-heading",
  tone = "default",
}: SpecCardGridProps) {
  return (
    <SiteSection tone={tone} aria-labelledby={headingId}>
      <PageSectionHeader
        id={headingId}
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
      />
      <dl className="home-why-choose__cards site-card-grid">
        {specs.map((spec) => (
          <div key={spec.label} className="home-why-choose__card">
            <dt className="home-why-choose__card-title">{spec.label}</dt>
            <span className="home-why-choose__card-accent" aria-hidden />
            <dd className="home-why-choose__card-text">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </SiteSection>
  );
}
