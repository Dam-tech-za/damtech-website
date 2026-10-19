import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-hermanus")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingHermanusPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
