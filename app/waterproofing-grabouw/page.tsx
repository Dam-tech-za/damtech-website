import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-grabouw")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingGrabouwPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
