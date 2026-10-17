import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-overstrand")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingOverstrandPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
