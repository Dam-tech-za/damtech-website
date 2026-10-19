import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-kleinmond")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingKleinmondPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
