import dynamic from "next/dynamic";
import { BlockSkeleton, FaqSkeleton } from "@/components/skeletons";

/** Below-fold and non-critical UI — code-split to reduce initial JS. */

export const LazyFAQ = dynamic(
  () => import("@/components/FAQ").then((mod) => mod.FAQ),
  { loading: () => <FaqSkeleton /> },
);

export const LazyCTA = dynamic(
  () => import("@/components/CTA").then((mod) => mod.CTA),
  { loading: () => <BlockSkeleton className="h-[28rem] w-full" /> },
);

export const LazyHomeFinalCtaSection = dynamic(
  () =>
    import("@/components/HomeFinalCtaSection").then(
      (mod) => mod.HomeFinalCtaSection,
    ),
  { loading: () => <BlockSkeleton className="h-72 w-full" /> },
);

export const LazyInternalServiceLinks = dynamic(
  () =>
    import("@/components/InternalServiceLinks").then(
      (mod) => mod.InternalServiceLinks,
    ),
  { loading: () => <BlockSkeleton className="h-40 w-full" /> },
);

export const LazyRelatedPosts = dynamic(
  () => import("@/components/RelatedPosts").then((mod) => mod.RelatedPosts),
  { loading: () => <BlockSkeleton className="h-72 w-full" /> },
);

export const LazyFormSection = dynamic(
  () => import("@/components/FormSection").then((mod) => mod.FormSection),
  { loading: () => <BlockSkeleton className="h-[28rem] w-full" /> },
);

export const LazyProjectGallery = dynamic(
  () => import("@/components/ProjectGallery").then((mod) => mod.ProjectGallery),
  { loading: () => <BlockSkeleton className="h-64 w-full" /> },
);

export const LazyPostCallToAction = dynamic(
  () =>
    import("@/components/PostCallToAction").then((mod) => mod.PostCallToAction),
  { loading: () => <BlockSkeleton className="h-44 w-full" /> },
);

export const LazyPostServiceLinks = dynamic(
  () =>
    import("@/components/PostServiceLinks").then((mod) => mod.PostServiceLinks),
  { loading: () => <BlockSkeleton className="h-52 w-full" /> },
);

export const LazyCalculatorHub = dynamic(
  () =>
    import("@/components/calculators/CalculatorHub").then(
      (mod) => mod.CalculatorHub,
    ),
  { loading: () => <BlockSkeleton className="min-h-[40rem] w-full" /> },
);

export const LazyServiceIntroSection = dynamic(
  () =>
    import("@/components/ServiceIntroSection").then(
      (mod) => mod.ServiceIntroSection,
    ),
  { loading: () => <BlockSkeleton className="h-[32rem] w-full" /> },
);

export const LazyComparisonTable = dynamic(
  () =>
    import("@/components/ComparisonTable").then((mod) => mod.ComparisonTable),
  { loading: () => <BlockSkeleton className="h-64 w-full" /> },
);

export const LazyInfoCardGrid = dynamic(
  () => import("@/components/InfoCardGrid").then((mod) => mod.InfoCardGrid),
  { loading: () => <BlockSkeleton className="h-80 w-full" /> },
);

export const LazyBenefitCardGrid = dynamic(
  () =>
    import("@/components/BenefitCardGrid").then((mod) => mod.BenefitCardGrid),
  { loading: () => <BlockSkeleton className="h-72 w-full" /> },
);

export const LazySectionCta = dynamic(
  () => import("@/components/SectionCta").then((mod) => mod.SectionCta),
  { loading: () => <BlockSkeleton className="h-40 w-full" /> },
);

export const LazyServiceProseSections = dynamic(
  () =>
    import("@/components/ServicePageSections").then(
      (mod) => mod.ServiceProseSections,
    ),
  { loading: () => <BlockSkeleton className="h-96 w-full" /> },
);

export const LazyProcessStepsSection = dynamic(
  () =>
    import("@/components/ProcessStepsSection").then(
      (mod) => mod.ProcessStepsSection,
    ),
  { loading: () => <BlockSkeleton className="h-80 w-full" /> },
);

export const LazyProjectProofStrip = dynamic(
  () =>
    import("@/components/ProjectProofStrip").then(
      (mod) => mod.ProjectProofStrip,
    ),
  { loading: () => <BlockSkeleton className="h-96 w-full" /> },
);

export const LazyServiceFaqSection = dynamic(
  () =>
    import("@/components/ServicePageSections").then(
      (mod) => mod.ServiceFaqSection,
    ),
  { loading: () => <FaqSkeleton /> },
);

export const LazyRelatedPageLinks = dynamic(
  () =>
    import("@/components/ServicePageSections").then(
      (mod) => mod.RelatedPageLinks,
    ),
  { loading: () => <BlockSkeleton className="h-56 w-full" /> },
);
