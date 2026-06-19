import { SubServicePage } from "@/components/SubServicePage";
import { createPageMetadata } from "@/lib/pages";
import { HDPE_DAM_LINING_PAGE } from "@/lib/sub-service-pages";

const page = HDPE_DAM_LINING_PAGE;

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  h1: page.h1,
  image: page.image,
  serviceName: page.serviceName,
});

export default function HDPEDamLiningPage() {
  return <SubServicePage page={page} />;
}
