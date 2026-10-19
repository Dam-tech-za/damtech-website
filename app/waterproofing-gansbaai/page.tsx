import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-gansbaai")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingGansbaaiPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
