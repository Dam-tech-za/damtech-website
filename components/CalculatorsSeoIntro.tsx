import Link from "next/link";
import {
  CALCULATORS_DAM_LINING_LINK,
  CALCULATORS_HUB_PATH,
  CALCULATORS_STEEL_TANK_LINK,
  CALCULATORS_WATERPROOFING_LINK,
} from "@/lib/calculator-links";

/** Crawlable overview and H2 sections for calculator hub SEO signals. */
export function CalculatorsSeoIntro() {
  return (
    <div className="calc-seo-intro max-w-3xl space-y-8">
      <p className="site-overview__intro">
        Use Damtech&apos;s planning calculators to estimate dam lining area, dam liner
        material quantities, steel water tank sizing, waterproofing area, irrigation water
        requirements, rainwater harvesting potential and water storage needs across South
        Africa. These tools help farms, mines, game lodges and commercial properties prepare
        dimensions and demand figures before{" "}
        <Link href="/quote" className="text-water hover:underline">
          requesting a dam lining quote
        </Link>
        .
      </p>

      <section aria-labelledby="dam-lining-calculator-heading">
        <h2 id="dam-lining-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          Dam Lining Area Calculator
        </h2>
        <p className="mt-3 text-body">
          The{" "}
          <Link href={CALCULATORS_DAM_LINING_LINK.href} className="text-water hover:underline">
            dam lining area calculator
          </Link>{" "}
          helps you estimate geomembrane material for earth dams, ponds and reservoirs. Enter
          top and bottom dimensions, depth, side slope, freeboard, overlap and anchor trench
          allowances to plan HDPE or PVC dam liner material before a site inspection.
        </p>
      </section>

      <section aria-labelledby="steel-tank-calculator-heading">
        <h2 id="steel-tank-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          Steel Water Tank Size Calculator
        </h2>
        <p className="mt-3 text-body">
          The{" "}
          <Link href={CALCULATORS_STEEL_TANK_LINK.href} className="text-water hover:underline">
            steel water tank size calculator
          </Link>{" "}
          estimates corrugated steel reservoir capacity from daily water use, backup storage
          days and a safety factor — useful when sizing farm, lodge or commercial water storage.
        </p>
      </section>

      <section aria-labelledby="water-requirement-calculators-heading">
        <h2 id="water-requirement-calculators-heading" className="text-xl font-bold text-navy sm:text-2xl">
          Water Requirement Calculators
        </h2>
        <p className="mt-3 text-body">
          Plan annual farm water demand, land-size based requirements and crop irrigation
          needs with our{" "}
          <Link href={`${CALCULATORS_HUB_PATH}#annual-water-requirement`} className="text-water hover:underline">
            annual water requirement
          </Link>
          ,{" "}
          <Link href={`${CALCULATORS_HUB_PATH}#water-by-land-size`} className="text-water hover:underline">
            water by land size
          </Link>{" "}
          and{" "}
          <Link href={`${CALCULATORS_HUB_PATH}#irrigation-water`} className="text-water hover:underline">
            irrigation water requirement calculators
          </Link>
          . The rainwater harvesting calculator estimates catchment yield for tank or lined
          dam storage planning.
        </p>
      </section>

      <section aria-labelledby="waterproofing-calculator-heading">
        <h2 id="waterproofing-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          Waterproofing Area Calculator
        </h2>
        <p className="mt-3 text-body">
          Use the{" "}
          <Link href={CALCULATORS_WATERPROOFING_LINK.href} className="text-water hover:underline">
            waterproofing area calculator
          </Link>{" "}
          to estimate bitumen or torch-on material for roofs, reservoirs, channels and
          water-retaining structures, including upstands, overlaps and wastage allowances.
        </p>
      </section>
    </div>
  );
}
