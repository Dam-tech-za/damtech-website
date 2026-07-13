import { CalculatorJumpLink } from "@/components/calculators/CalculatorJumpLink";

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
        <a href="/quote" className="text-water hover:underline">
          requesting a dam lining quote
        </a>
        .
      </p>

      <section aria-labelledby="dam-lining-calculator-heading">
        <h2 id="dam-lining-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          <CalculatorJumpLink
            calculatorId="dam-lining-area"
            asHeading
            className="text-water hover:underline"
          >
            Dam Lining Area Calculator
          </CalculatorJumpLink>
        </h2>
        <p className="mt-3 text-body">
          The{" "}
          <CalculatorJumpLink
            calculatorId="dam-lining-area"
            className="text-water hover:underline"
          >
            dam lining area calculator
          </CalculatorJumpLink>{" "}
          helps you estimate geomembrane material for earth dams, ponds and reservoirs. Enter
          top and bottom dimensions, depth and side slope to plan HDPE or PVC dam liner
          material before a site inspection. Overlap, anchor trench and wastage allowances are
          applied automatically as Damtech planning defaults.
        </p>
      </section>

      <section aria-labelledby="steel-tank-calculator-heading">
        <h2 id="steel-tank-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          <CalculatorJumpLink
            calculatorId="steel-tank-size"
            asHeading
            className="text-water hover:underline"
          >
            Steel Water Tank Size Calculator
          </CalculatorJumpLink>
        </h2>
        <p className="mt-3 text-body">
          The{" "}
          <CalculatorJumpLink
            calculatorId="steel-tank-size"
            className="text-water hover:underline"
          >
            steel water tank size calculator
          </CalculatorJumpLink>{" "}
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
          <CalculatorJumpLink
            calculatorId="annual-water-requirement"
            className="text-water hover:underline"
          >
            annual water requirement
          </CalculatorJumpLink>
          ,{" "}
          <CalculatorJumpLink
            calculatorId="water-by-land-size"
            className="text-water hover:underline"
          >
            water by land size
          </CalculatorJumpLink>{" "}
          and{" "}
          <CalculatorJumpLink
            calculatorId="irrigation-water"
            className="text-water hover:underline"
          >
            irrigation water requirement calculators
          </CalculatorJumpLink>
          . The{" "}
          <CalculatorJumpLink
            calculatorId="rainwater-harvesting"
            className="text-water hover:underline"
          >
            rainwater harvesting calculator
          </CalculatorJumpLink>{" "}
          estimates catchment yield for tank or lined dam storage planning.
        </p>
      </section>

      <section aria-labelledby="waterproofing-calculator-heading">
        <h2 id="waterproofing-calculator-heading" className="text-xl font-bold text-navy sm:text-2xl">
          <CalculatorJumpLink
            calculatorId="waterproofing-area"
            asHeading
            className="text-water hover:underline"
          >
            Waterproofing Area Calculator
          </CalculatorJumpLink>
        </h2>
        <p className="mt-3 text-body">
          Use the{" "}
          <CalculatorJumpLink
            calculatorId="waterproofing-area"
            className="text-water hover:underline"
          >
            waterproofing area calculator
          </CalculatorJumpLink>{" "}
          to estimate bitumen or torch-on material for roofs, reservoirs, channels and
          water-retaining structures. Upstands are entered on the form; overlap and wastage
          allowances are applied automatically.
        </p>
      </section>
    </div>
  );
}
