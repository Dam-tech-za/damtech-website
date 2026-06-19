import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";

type SectionCtaProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function SectionCta({
  title = "Ready for a tailored quote?",
  description = "Tell us about your dam, tank or waterproofing project and we will recommend a practical solution.",
  primaryHref = "/quote",
  primaryLabel = "Request a Quote",
  secondaryHref = "/contact",
  secondaryLabel = "Contact Damtech",
}: SectionCtaProps) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 sm:p-8">
      <SectionHeading as="h3" className="!mt-0 text-xl sm:text-2xl">
        {title}
      </SectionHeading>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
        {description}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={primaryHref} className="btn-primary w-full sm:w-auto">
          {primaryLabel}
        </Link>
        <Link href={secondaryHref} className="btn-secondary w-full sm:w-auto">
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
