import { SubServicePage } from "@/components/SubServicePage";
import { createPageMetadata } from "@/lib/pages";
import { PVC_DAM_LINING_PAGE } from "@/lib/sub-service-pages";

const page = PVC_DAM_LINING_PAGE;

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  h1: page.h1,
  image: page.image,
  serviceName: page.serviceName,
});

export default function PvcDamLiningPage() {
  return <SubServicePage page={page} />;
}
