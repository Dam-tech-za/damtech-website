import { RelatedServicesGrid } from "@/components/RelatedServicesGrid";
import { RELATED_SERVICE_LINKS } from "@/lib/related-services";

type InternalServiceLinksProps = {
  currentPath?: string;
  heading?: string;
};

export function InternalServiceLinks({
  currentPath,
  heading = "Related Damtech Services",
}: InternalServiceLinksProps) {
  return (
    <RelatedServicesGrid
      links={RELATED_SERVICE_LINKS}
      heading={heading}
      excludeHref={currentPath}
      className="border-t border-slate-200 !pt-10"
    />
  );
}
