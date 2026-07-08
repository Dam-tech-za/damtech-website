import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";

type SectionCtaProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Inline CTA card matching homepage conversion styling. */
export function SectionCta({
  title = "Ready for a tailored quote?",
  description = "Tell us about your dam, tank or waterproofing project and we will recommend a practical solution.",
  primaryHref = "/quote",
  primaryLabel = "Request a Quote",
  secondaryHref = "/contact",
  secondaryLabel = "Contact Damtech",
}: SectionCtaProps) {
  return (
    <div className="home-final-cta__card home-final-cta__card--inline">
      <h3 className="home-final-cta__title home-final-cta__title--inline">{title}</h3>
      <p className="home-final-cta__intro">{description}</p>
      <div className="home-final-cta__actions">
        <Link href={primaryHref} className="btn-primary home-final-cta__btn">
          {primaryLabel}
          <ArrowRightIcon className="home-final-cta__btn-icon" aria-hidden />
        </Link>
        <Link href={secondaryHref} className="btn-secondary home-final-cta__btn">
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
