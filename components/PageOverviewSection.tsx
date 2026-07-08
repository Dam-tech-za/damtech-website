import type { ReactNode } from "react";
import { PageImage } from "@/components/PageImage";
import type { SiteImage } from "@/lib/images";
import { SiteSection } from "@/components/SiteSection";

type PageOverviewSectionProps = {
  intro: string;
  children?: ReactNode;
  image?: SiteImage;
  tone?: "default" | "muted";
};

/** Homepage-style intro split with optional image card. */
export function PageOverviewSection({
  intro,
  children,
  image,
  tone = "default",
}: PageOverviewSectionProps) {
  return (
    <SiteSection tone={tone}>
      <div className="site-overview">
        <div className="site-overview__content">
          <p className="site-overview__intro">{intro}</p>
          {children}
        </div>
        {image ? (
          <div className="site-overview__media">
            <PageImage {...image} />
          </div>
        ) : null}
      </div>
    </SiteSection>
  );
}
