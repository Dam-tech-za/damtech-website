import { LocalSeoPage } from "@/components/LocalSeoPage";
import { createPageMetadata } from "@/lib/pages";
import { getLocalPageBySlug } from "@/lib/local-pages";

const page = getLocalPageBySlug("mining-dam-liners")!;

export const metadata = createPageMetadata({
  title: page.title,
  description: page.description,
  path: `/${page.slug}`,
  h1: page.h1,
  image: page.image,
  serviceName: page.serviceName,
});

export default function MiningDamLinersPage() {
  return <LocalSeoPage page={page} />;
}
