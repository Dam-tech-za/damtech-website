import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("roof-waterproofing")!;

export const metadata = residentialMetadata(page);

export default function RoofWaterproofingPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
