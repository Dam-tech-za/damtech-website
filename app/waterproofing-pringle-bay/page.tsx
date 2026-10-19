import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-pringle-bay")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingPringleBayPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
