import { SubServicePage } from "@/components/SubServicePage";
import { createPageMetadata } from "@/lib/pages";
import { DAM_LINING_COST_PAGE } from "@/lib/sub-service-pages";

const page = DAM_LINING_COST_PAGE;

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  h1: page.h1,
  image: page.image,
  serviceName: page.serviceName,
});

export default function DamLiningCostPage() {
  return <SubServicePage page={page} />;
}
