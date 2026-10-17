import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("foundation-waterproofing")!;

export const metadata = residentialMetadata(page);

export default function FoundationWaterproofingPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
