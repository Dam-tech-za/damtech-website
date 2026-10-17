import { ResidentialWaterproofingPage } from "@/components/ResidentialWaterproofingPage";
import {
  getResidentialPage,
  residentialMetadata,
} from "@/lib/residential-waterproofing";

const page = getResidentialPage("waterproofing-pretoria")!;

export const metadata = residentialMetadata(page);

export default function WaterproofingPretoriaPage() {
  return <ResidentialWaterproofingPage page={page} />;
}
