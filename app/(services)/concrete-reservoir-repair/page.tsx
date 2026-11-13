import { SubServicePage } from "@/components/SubServicePage";
import { createPageMetadata } from "@/lib/pages";
import { CONCRETE_RESERVOIR_REPAIR_PAGE } from "@/lib/sub-service-pages";

const page = CONCRETE_RESERVOIR_REPAIR_PAGE;

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  h1: page.h1,
  image: page.image,
  serviceName: page.serviceName,
});

export default function ConcreteReservoirRepairPage() {
  return <SubServicePage page={page} />;
}
