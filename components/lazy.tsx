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
