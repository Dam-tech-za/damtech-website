import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-membranes-and-coatings")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingMembranesAndCoatingsPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
