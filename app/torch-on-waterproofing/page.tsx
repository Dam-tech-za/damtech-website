import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("torch-on-waterproofing")!;

export const metadata = residentialMetadata(page);

export default function TorchOnWaterproofingPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
