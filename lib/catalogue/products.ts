import { formatZarWholeInclVat } from "./format.ts";
import {
  fishPondImageManifest,
  livestockTroughImageManifest,
  waterTankImageManifest,
} from "./images.ts";
import { cataloguePublicAvailabilityCopy } from "./availability.ts";
import {
  PRODUCT_CATEGORY_LABELS,
  VAT_RATE_PERCENT,
  type CatalogueProduct,
} from "./types.ts";
import { UNRESOLVED_BUSINESS_FACTS } from "./unresolved.ts";

/** Verified from Damtech steel-tank copy: liner, bidem, columns and 50 mm fittings ship with the kit. */
const WATER_TANK_INCLUSIONS = [
  "Corrugated galvanised steel shell",
  "850 gsm PVC liner",
  "Bidem floor sheet",
  "Upright columns for ring loads",
  "50 mm inlet, outlet and overflow fittings",
] as const;

const WATER_TANK_SUPPLY_NOTICE =
  "Fixed-price supply-only reservoir kit. Price includes VAT. Delivery and installation are excluded.";

const FISH_POND_SUPPLY_NOTICE =
  "Fixed-price supply-only pond kit. Price includes VAT. Delivery, installation, filtration, pumps and aeration equipment are excluded.";

const TROUGH_SUPPLY_NOTICE =
  "Fixed-price supply-only livestock water trough. Price includes VAT. Delivery, installation, pipework and automatic filling equipment are excluded.";

const FISH_POND_INCLUSIONS = [
  "Corrugated galvanised steel shell",
  "850 gsm PVC liner",
  "Bidem floor sheet",
] as const;

const FISH_POND_EXCLUSIONS = [
  "Delivery and transport to site",
  "Installation and on-site assembly",
  "Foundation, sand base or civils",
  "Filtration, pumps and aeration equipment",
  "Fish, biological media and water treatment",
] as const;

const TROUGH_EXCLUSIONS = [
  "Delivery and transport to site",
  "Installation and on-site assembly",
  "Foundation, sand base or civils",
  "Pipework and automatic filling equipment",
  "Float valve",
] as const;

const SHARED_WARRANTY =
  "Warranty for this supply-only kit is confirmed in writing on the invoice. Qualifying materials supplied by Damtech may carry a supplier-backed material warranty of up to 10 years where stated in that invoice or quotation and subject to the supplier’s terms. Damtech workmanship cover applies only when Damtech quotes and completes installation separately.";

const SHARED_DELIVERY =
  "Delivery only throughout South Africa. The listed price excludes delivery and installation. DamTech will confirm the delivery charge on the formal invoice after the delivery address is confirmed. Manufacturing takes 5–10 business days after cleared payment. Estimated delivery takes a further 3–5 business days after manufacturing is complete. Estimated total fulfilment time is 8–15 business days after cleared payment.";

const SHARED_AVAILABILITY = cataloguePublicAvailabilityCopy();

const SUPPLY_EXCLUSIONS = [
  "Delivery and transport to site",
  "Installation and on-site assembly",
  "Foundation, sand base or civils",
  "Optional roofs unless listed as included",
] as const;

function waterTankSpecifications(input: {
  sku: string;
  capacityLitresLabel: string;
  diameterM: number;
  heightM: number;
  priceInclVatZar: number;
}): CatalogueProduct["specifications"] {
  return [
    { label: "Nominal marketed capacity", value: input.capacityLitresLabel },
    { label: "Diameter", value: `${input.diameterM} m` },
    { label: "Height", value: `${input.heightM} m` },
    { label: "Product type", value: "Corrugated steel water reservoir kit" },
    { label: "Supply format", value: "Supply only" },
    { label: "Delivery", value: "Excluded" },
    { label: "Installation", value: "Excluded" },
    { label: "SKU", value: input.sku },
    { label: "Price", value: formatZarWholeInclVat(input.priceInclVatZar) },
  ];
}

export const CATALOGUE_PRODUCTS: readonly CatalogueProduct[] = [
  {
    sku: "DMT-WT-10000",
    slug: "10000-litre-water-tank",
    name: "10 000L Corrugated Steel Water Tank",
    h1: "10 000L Corrugated Steel Water Tank",
    seoTitle: "10 000L Water Tank Price South Africa | Damtech",
    seoDescription:
      "Buy a 10 000L corrugated steel water tank kit from Damtech for R12 999 incl. VAT. 3 m diameter × 1.5 m high. Transport and installation excluded.",
    feedTitle: "10 000L Corrugated Steel Water Tank Kit – 3 m × 1.5 m",
    merchantEligible: true,
    heroCopy:
      "Secure practical water storage for a smallholding, farm, estate or commercial property with a compact 10 000L corrugated steel reservoir kit. Its 3 m diameter and 1.5 m height provide useful storage without the footprint of multiple smaller tanks.",
    description:
      "This 10 000 litre water tank is suited to customers who need a compact above-ground water reserve for borehole storage, livestock watering, rainwater collection or general property backup. The modular corrugated-steel construction provides an alternative to linking several small plastic tanks together.",
    bodyHeading: "10 000 Litre Water Storage for Farms and Properties",
    bodyCopy:
      "A 10 000L water tank — often searched as a 10000L water tank — is a practical first step into bulk storage when smaller household tanks no longer cover borehole pumping windows, stock troughs or rainwater capture. The 3 m × 1.5 m kit sits behind a shed or along a service yard without the civils of an earth dam. The price is R12 999 incl. VAT for the supply-only reservoir kit. Delivery and installation are excluded.",
    categoryId: "corrugated-steel-water-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["corrugated-steel-water-tanks"],
    rfqService: "Steel water tank",
    priceInclVatZar: 12999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 10000,
    diameterM: 3,
    heightM: 1.5,
    coreSpecSummary: "10 000L · 3 m × 1.5 m",
    specifications: waterTankSpecifications({
      sku: "DMT-WT-10000",
      capacityLitresLabel: "10 000 litres",
      diameterM: 3,
      heightM: 1.5,
      priceInclVatZar: 12999,
    }),
    inclusions: WATER_TANK_INCLUSIONS,
    exclusions: SUPPLY_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation: SHARED_DELIVERY,
    images: waterTankImageManifest("DMT-WT-10000"),
    applications: [
      "Borehole buffer storage",
      "Smallholding and livestock water",
      "Property backup water",
      "Rainwater storage",
      "Light agricultural use",
    ],
    sitePreparation:
      "The 10 000L kit needs a level, compacted pad that can take a 3 m diameter shell. Damtech steel-tank work typically uses sand or crusher dust on geotextile so the liner is not stressed by settlement. Base preparation, civils and installation are excluded from the R12 999 incl. VAT price. Damtech can quote installation separately after you submit an RFQ.",
    supplyNotice: WATER_TANK_SUPPLY_NOTICE,
    ctaLabel: "Add 10 000L Tank to RFQ — Request Invoice",
    faqs: [
      {
        question: "What is the price of the 10 000L water tank?",
        answer:
          "The 10 000L corrugated steel water tank kit is R12 999 incl. VAT. That is the fixed supply-only price for this SKU. Transport and installation are excluded and are confirmed when Damtech prepares your invoice.",
      },
      {
        question: "Does the R12 999 price include VAT?",
        answer:
          "Yes. R12 999 includes 15% VAT. Damtech does not advertise an ex-VAT consumer price for this kit.",
      },
      {
        question: "Are transport and installation included?",
        answer:
          "No. Delivery and installation are excluded. Add the 10 000L tank to an RFQ so Damtech can confirm delivery to your site and send an invoice. Installation can be quoted separately if you want Damtech to assemble the tank.",
      },
      {
        question: "What are the tank’s dimensions?",
        answer:
          "The 10 000L water tank is 3 m in diameter and 1.5 m high. Nominal marketed capacity is 10 000 litres.",
      },
      {
        question: "What is included in the supply-only kit?",
        answer:
          "The kit includes a corrugated galvanised steel shell, 850 gsm PVC liner, bidem floor sheet, upright columns, and 50 mm inlet, outlet and overflow fittings. Optional roofs, the base, transport and installation are not included.",
      },
      {
        question: "Can Damtech quote for delivery and installation separately?",
        answer:
          "Yes. Submit the invoice request with your province, town and delivery location. Damtech confirms transport and, if you ask, can quote installation separately. Submitting the RFQ does not complete a purchase.",
      },
    ],
    relatedSkus: ["DMT-WT-20000", "DMT-WT-50000"],
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#popular-tank-sizes",
        label: "Compare steel water tank sizes and prices",
      },
      {
        href: "/steel-water-storage-tanks/20000-litre-water-tank/",
        label: "See the 20 000L water tank",
      },
      {
        href: "/calculators/#steel-tank-size",
        label: "Check whether 10 000L is enough",
      },
      {
        href: "/steel-water-storage-tanks/livestock-water-trough/",
        label: "Round livestock water trough",
      },
      { href: "/contact/", label: "Contact Damtech" },
    ],
  },
  {
    sku: "DMT-WT-20000",
    slug: "20000-litre-water-tank",
    name: "20 000L Corrugated Steel Water Tank",
    h1: "20 000L Corrugated Steel Water Tank",
    seoTitle: "20 000L Water Tank Price South Africa | Damtech",
    seoDescription:
      "20 000L corrugated steel water tank kit for R15 999 incl. VAT. Measures 4 m × 1.5 m. A supply-only farm and property tank from Damtech.",
    feedTitle: "20 000L Corrugated Steel Water Tank Kit – 4 m × 1.5 m",
    merchantEligible: true,
    heroCopy:
      "The Damtech 20 000L water tank provides an economical step up from household-sized storage for farms, smallholdings, lodges and commercial properties. Its low 1.5 m profile makes access and routine inspection more practical.",
    description:
      "A 20 000 litre water tank can provide buffer storage between a borehole, pump, irrigation line or livestock watering system. It is aimed at customers who have outgrown smaller domestic tanks but do not yet require a large commercial reservoir.",
    bodyHeading: "Affordable 20 000 Litre Bulk Water Storage",
    bodyCopy:
      "At 4 m × 1.5 m the 20 000L kit holds a working reserve for mixed farm use without the height of a taller ring tank. Farmers and lodge managers use this size to store borehole water pumped when power is available, then draw it for stock or irrigation. The price is R15 999 incl. VAT for the supply-only kit. Delivery and installation are excluded.",
    categoryId: "corrugated-steel-water-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["corrugated-steel-water-tanks"],
    rfqService: "Steel water tank",
    priceInclVatZar: 15999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 20000,
    diameterM: 4,
    heightM: 1.5,
    coreSpecSummary: "20 000L · 4 m × 1.5 m",
    specifications: waterTankSpecifications({
      sku: "DMT-WT-20000",
      capacityLitresLabel: "20 000 litres",
      diameterM: 4,
      heightM: 1.5,
      priceInclVatZar: 15999,
    }),
    inclusions: WATER_TANK_INCLUSIONS,
    exclusions: SUPPLY_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation: SHARED_DELIVERY,
    images: waterTankImageManifest("DMT-WT-20000"),
    applications: [
      "Farm and smallholding backup",
      "Borehole storage",
      "Livestock water reserves",
      "Lodge or guest-farm water",
      "Irrigation buffer storage",
      "Commercial property backup",
    ],
    sitePreparation:
      "Plan a prepared site for a 4 m diameter, 1.5 m high tank. A level, compacted sand or crusher-dust base on geotextile is the usual approach on Damtech steel-reservoir projects. The advertised R15 999 incl. VAT price does not include the base, delivery or installation.",
    supplyNotice: WATER_TANK_SUPPLY_NOTICE,
    ctaLabel: "Add 20 000L Tank to RFQ — Request Invoice",
    faqs: [
      {
        question: "How much does the 20 000L water tank cost?",
        answer:
          "The 20 000L corrugated steel water tank kit is R15 999 incl. VAT. Transport and installation are excluded from that price.",
      },
      {
        question: "Is VAT included in the advertised price?",
        answer:
          "Yes. R15 999 includes 15% VAT. There is no separate ex-VAT consumer price on this page.",
      },
      {
        question: "Is this a plastic or steel water tank?",
        answer:
          "It is a corrugated steel water reservoir kit with an 850 gsm PVC liner. It is not a plastic tank.",
      },
      {
        question: "How large must the prepared site be?",
        answer:
          "The tank is 4 m in diameter and 1.5 m high. The pad must be level across that 4 m footprint. Working room around the shell for assembly is additional and depends on site access. Damtech confirms access when calculating transport.",
      },
      {
        question: "Are the base, delivery and installation included?",
        answer:
          "No. Foundation or sand-base work, transport and installation are excluded. Damtech can quote those items separately after the RFQ.",
      },
      {
        question: "How do I request an invoice?",
        answer:
          "Choose a quantity and select Add 20 000L Tank to RFQ — Request Invoice. Damtech fills the product name and VAT-inclusive price from this catalogue SKU, then confirms transport against your delivery location before sending an invoice. Submitting the form is not a completed purchase.",
      },
    ],
    relatedSkus: ["DMT-WT-10000", "DMT-WT-50000"],
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#popular-tank-sizes",
        label: "All corrugated steel water tank prices",
      },
      {
        href: "/steel-water-storage-tanks/10000-litre-water-tank/",
        label: "Smaller 10 000L water tank",
      },
      {
        href: "/steel-water-storage-tanks/50000-litre-water-tank/",
        label: "Larger 50 000L water tank",
      },
      {
        href: "/agricultural-water-storage/",
        label: "Agricultural water storage planning",
      },
      {
        href: "/calculators/#steel-tank-size",
        label: "Use the steel tank size calculator",
      },
    ],
  },
  {
    sku: "DMT-WT-50000",
    slug: "50000-litre-water-tank",
    name: "50 000L Corrugated Steel Water Tank",
    h1: "50 000L Corrugated Steel Water Tank",
    seoTitle: "50 000L Steel Water Tank Price South Africa | Damtech",
    seoDescription:
      "Order a 50 000L-class corrugated steel water tank kit for R24 999 incl. VAT. 5 m diameter × 2.3 m high. Transport and installation excluded.",
    feedTitle: "50 000L Corrugated Steel Water Tank Kit – 5 m × 2.3 m",
    merchantEligible: true,
    heroCopy:
      "Store approximately 50 000 litres of water in a compact corrugated steel reservoir designed for agricultural, lodge, estate and commercial applications. The 5 m diameter balances useful bulk storage with a manageable site footprint.",
    description:
      "The 50 000L tank is positioned between small property-backup tanks and large farm reservoirs. It can be incorporated into borehole, rainwater, livestock or irrigation systems where a meaningful water buffer is required.",
    bodyHeading: "50 000 Litre Water Tank for Agricultural and Commercial Storage",
    bodyCopy:
      "At 5 m × 2.3 m this 50 000L-class kit stores more volume on a modest footprint than the 1.5 m-high tanks. Game lodges, estates and commercial yards use it as borehole-balancing or irrigation buffer storage. The price is R24 999 incl. VAT for the supply-only kit, including the 850 gsm PVC liner. Delivery and installation are excluded.",
    categoryId: "corrugated-steel-water-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["corrugated-steel-water-tanks"],
    rfqService: "Steel water tank",
    priceInclVatZar: 24999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 50000,
    diameterM: 5,
    heightM: 2.3,
    coreSpecSummary: "50 000L · 5 m × 2.3 m",
    specifications: waterTankSpecifications({
      sku: "DMT-WT-50000",
      capacityLitresLabel: "50 000 litres",
      diameterM: 5,
      heightM: 2.3,
      priceInclVatZar: 24999,
    }),
    inclusions: WATER_TANK_INCLUSIONS,
    exclusions: SUPPLY_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation: SHARED_DELIVERY,
    images: waterTankImageManifest("DMT-WT-50000"),
    applications: [
      "Agricultural water storage",
      "Game lodge and estate backup",
      "Borehole balancing storage",
      "Livestock and game watering",
      "Irrigation buffer storage",
      "Commercial water reserves",
    ],
    sitePreparation:
      "The 50 000L kit is 5 m in diameter and 2.3 m high, so the pad must be level across that footprint. Compacted sand or crusher dust on geotextile is the preparation Damtech specifies for steel reservoirs. Base work, transport and installation are excluded from the R24 999 incl. VAT price and can be quoted separately.",
    supplyNotice: WATER_TANK_SUPPLY_NOTICE,
    ctaLabel: "Add 50 000L Tank to RFQ — Request Invoice",
    faqs: [
      {
        question: "What is the price of a 50 000 litre water tank?",
        answer:
          "This 50 000L-class corrugated steel water tank kit is R24 999 incl. VAT. Delivery and installation are excluded.",
      },
      {
        question: "Does the price include VAT?",
        answer:
          "Yes. R24 999 includes 15% VAT. Damtech does not show an ex-VAT consumer price for this kit.",
      },
      {
        question: "Does the advertised price include the liner?",
        answer:
          "Yes. The R24 999 incl. VAT kit price includes the 850 gsm PVC liner and bidem floor sheet. It is not a shell-only price.",
      },
      {
        question: "Are transport and installation excluded?",
        answer:
          "Yes. Delivery and installation are excluded. Add the kit to an RFQ so Damtech can confirm delivery and send an invoice.",
      },
      {
        question: "What base preparation is required?",
        answer:
          "A level, compacted base — typically sand or crusher dust on geotextile — is required for the 5 m diameter shell. The base is not included in the kit price.",
      },
      {
        question: "Can a roof or additional fittings be quoted separately?",
        answer:
          "Yes. Optional roofs and extra fittings are excluded from this price. Mention them on the RFQ and Damtech will quote them separately with transport.",
      },
    ],
    relatedSkus: ["DMT-WT-20000", "DMT-WT-100000"],
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#popular-tank-sizes",
        label: "Steel water tanks for sale — all sizes",
      },
      {
        href: "/steel-water-storage-tanks/20000-litre-water-tank/",
        label: "20 000L farm and property tank",
      },
      {
        href: "/steel-water-storage-tanks/100000-litre-water-tank/",
        label: "100 000L bulk water tank",
      },
      {
        href: "/agricultural-water-storage/",
        label: "Farm dams and steel tanks together",
      },
      {
        href: "/calculators/#steel-tank-size",
        label: "Estimate required tank volume",
      },
    ],
  },
  {
    sku: "DMT-WT-100000",
    slug: "100000-litre-water-tank",
    name: "100 000L Corrugated Steel Water Tank",
    h1: "100 000L Corrugated Steel Water Tank",
    seoTitle: "100 000L Water Tank Price South Africa | Damtech",
    seoDescription:
      "100 000L corrugated steel water tank kit for R40 999 incl. VAT. 9 m diameter × 1.5 m high. Fixed-price supply-only reservoir from Damtech.",
    feedTitle: "100 000L Corrugated Steel Water Tank Kit – 9 m × 1.5 m",
    merchantEligible: true,
    heroCopy:
      "The Damtech 100 000L water tank provides large-capacity above-ground storage for farms, estates, game lodges and commercial sites. Its broad 9 m diameter and 1.5 m height create a lower-profile reservoir for sites where bulk capacity matters.",
    description:
      "A 100 000 litre water tank creates a substantial reserve for livestock, irrigation, borehole balancing, estate backup or commercial operations. It offers one central storage point instead of a large bank of smaller tanks, simplifying the basic storage layout and connections.",
    bodyHeading: "100 000 Litre Bulk Water Storage",
    bodyCopy:
      "This 100 000L water tank — also found in searches as a 100000L water tank — spreads volume across a 9 m × 1.5 m footprint rather than a tall narrow shell. Farms and commercial sites use it as a single bulk reserve instead of many linked plastic tanks. The price is R40 999 incl. VAT for the supply-only kit. Delivery and installation are excluded.",
    categoryId: "corrugated-steel-water-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["corrugated-steel-water-tanks"],
    rfqService: "Steel water tank",
    priceInclVatZar: 40999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 100000,
    diameterM: 9,
    heightM: 1.5,
    coreSpecSummary: "100 000L · 9 m × 1.5 m",
    specifications: waterTankSpecifications({
      sku: "DMT-WT-100000",
      capacityLitresLabel: "100 000 litres",
      diameterM: 9,
      heightM: 1.5,
      priceInclVatZar: 40999,
    }),
    inclusions: WATER_TANK_INCLUSIONS,
    exclusions: SUPPLY_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation: SHARED_DELIVERY,
    images: waterTankImageManifest("DMT-WT-100000"),
    applications: [
      "Farm water security",
      "Bulk livestock and game water",
      "Irrigation buffer storage",
      "Lodge and estate backup",
      "Borehole balancing",
      "Commercial and operational reserves",
    ],
    sitePreparation:
      "The 100 000L tank is 9 m in diameter and 1.5 m high. The prepared area must cover that 9 m footprint plus working room for assembly around the shell. A level, compacted sand or crusher-dust base on geotextile is required so the liner is not strained. Extra space for pipework depends on the site; Damtech confirms access when calculating transport. The base and installation are not included in the R40 999 incl. VAT price.",
    supplyNotice: WATER_TANK_SUPPLY_NOTICE,
    ctaLabel: "Add 100 000L Tank to RFQ — Request Invoice",
    faqs: [
      {
        question: "How much is the 100 000L water tank?",
        answer:
          "The 100 000L corrugated steel water tank kit is R40 999 incl. VAT. Delivery and installation are excluded.",
      },
      {
        question: "Is R40 999 the complete VAT-inclusive kit price?",
        answer:
          "Yes. R40 999 includes 15% VAT for the supply-only kit, including the 850 gsm PVC liner. It does not include transport, installation, the base or an optional roof.",
      },
      {
        question: "What are the dimensions?",
        answer:
          "The 100 000L water tank is 9 m in diameter and 1.5 m high. Nominal marketed capacity is 100 000 litres.",
      },
      {
        question: "Are installation and transport included?",
        answer:
          "No. Installation and transport are excluded. There is no free delivery. Damtech calculates transport from the delivery location on your RFQ.",
      },
      {
        question: "Can Damtech provide a separate installation quotation?",
        answer:
          "Yes. Ask for installation on the RFQ. Damtech quotes assembly separately from this supply-only kit price. Submitting the RFQ does not complete a purchase.",
      },
      {
        question: "How much space is required around the tank?",
        answer:
          "The shell itself is 9 m in diameter. Allow working room around that footprint for assembly and pipe connections. Damtech does not publish a single clearance figure for every site; access is confirmed when transport is calculated.",
      },
    ],
    relatedSkus: ["DMT-WT-50000", "DMT-WT-20000"],
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#popular-tank-sizes",
        label: "Browse fixed-price steel tank kits",
      },
      {
        href: "/steel-water-storage-tanks/50000-litre-water-tank/",
        label: "50 000L-class water tank",
      },
      {
        href: "/agricultural-water-storage/",
        label: "Bulk storage for farms and lodges",
      },
      {
        href: "/projects/tulbagh-steel-water-tank/",
        label: "Tulbagh steel water tank project",
      },
      {
        href: "/calculators/#steel-tank-size",
        label: "Size a bulk water tank",
      },
    ],
  },
  {
    sku: "DMT-FP-10000",
    slug: "10000-litre-fish-pond",
    name: "10 000L Fish Pond and Aquaculture Tank",
    h1: "10 000L Fish Pond and Aquaculture Tank",
    seoTitle: "10 000L Fish Pond for Sale South Africa | Damtech",
    seoDescription:
      "10 000L corrugated steel fish pond and aquaculture tank kit for R13 999 incl. VAT. Supply only. Delivery, installation and filtration excluded.",
    feedTitle: "10 000L Corrugated Steel Fish Pond Kit",
    merchantEligible: true,
    heroCopy:
      "Create a practical above-ground containment pond for fish farming, aquaculture or a large managed fish-pond system. This 10 000L corrugated steel pond kit combines a modular supporting shell with the verified liner system specified in the Damtech product catalogue.",
    description:
      "The 10 000L fish pond provides significantly more water volume than a small moulded garden pond while avoiding permanent concrete construction. It can be used as the containment component of a correctly designed fish-farming, aquaculture or ornamental pond system.",
    bodyHeading: "Large Fish Pond for South African Properties and Aquaculture Projects",
    bodyCopy:
      "At 10 000 litres this supply-only kit is sized for small aquaculture projects, fish-farming trials and large ornamental fish ponds on farms and estates. Diameter and height are confirmed on the invoice; they are not published here because they are not in the verified commercial data. The price is R13 999 incl. VAT. Delivery, installation, filtration, pumps and aeration are excluded.",
    supportingSections: [
      {
        heading: "Containment Is Only One Part of a Healthy Fish-Pond System",
        copy: "This product supplies the pond structure and verified liner components only. Fish health depends on appropriate filtration, aeration, circulation, stocking density, shade, water temperature and water-quality management. These systems must be selected for the intended species and stocking level. This is not a complete koi system.",
      },
    ],
    supplyNotice: FISH_POND_SUPPLY_NOTICE,
    ctaLabel: "Add 10 000L Fish Pond to RFQ — Request Invoice",
    categoryId: "fish-ponds-and-aquaculture-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["fish-ponds-and-aquaculture-tanks"],
    rfqService: "Fish pond / aquaculture tank",
    priceInclVatZar: 13999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 10000,
    diameterM: UNRESOLVED_BUSINESS_FACTS.fishPondDimensions,
    heightM: UNRESOLVED_BUSINESS_FACTS.fishPondDimensions,
    coreSpecSummary: "10 000L containment · supply only",
    specifications: [
      { label: "Nominal marketed capacity", value: "10 000 litres" },
      { label: "Product type", value: "Corrugated steel fish pond kit" },
      { label: "Supply format", value: "Supply only" },
      { label: "Delivery", value: "Excluded" },
      { label: "Installation", value: "Excluded" },
      { label: "Filtration and aeration", value: "Excluded" },
      { label: "SKU", value: "DMT-FP-10000" },
      { label: "Price", value: formatZarWholeInclVat(13999) },
    ],
    inclusions: FISH_POND_INCLUSIONS,
    exclusions: FISH_POND_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation:
      "This is a supply-only pond kit. Delivery only throughout South Africa. Delivery and installation are excluded from the listed price. DamTech will confirm the delivery charge on the formal invoice. Installation, filtration, pumps and aeration are not included unless quoted separately.",
    sitePreparation:
      "A level, compacted pad is required before assembling the corrugated steel shell so the liner is not stressed by settlement. Damtech typically specifies sand or crusher dust on geotextile for steel kits. Pond diameter is confirmed on the invoice. Base work, assembly, filtration and aeration are excluded from the R13 999 incl. VAT price.",
    applications: [
      "Small aquaculture projects",
      "Fish-farming trials",
      "Quarantine or holding pond",
      "Large ornamental fish pond",
      "Koi containment where suitable filtration is designed separately",
    ],
    images: fishPondImageManifest("DMT-FP-10000"),
    faqs: [
      {
        question: "How much does the 10 000L fish pond cost?",
        answer:
          "The 10 000L fish pond kit is R13 999 incl. VAT. That is the fixed supply-only price. Delivery, installation, filtration, pumps and aeration are excluded.",
      },
      {
        question: "Does the pond include a filter or pump?",
        answer:
          "No. Filters, pumps, aeration equipment, fish and biological media are not included. This kit supplies the corrugated steel shell and the verified liner components only.",
      },
      {
        question: "Can it be used for koi?",
        answer:
          "It can provide containment for a koi pond if a separately designed filtration, aeration and water-quality system is specified for the stocking level. The kit itself is not a complete koi system.",
      },
      {
        question: "Is the liner included?",
        answer:
          "Yes. The advertised R13 999 incl. VAT price includes the 850 gsm PVC liner and bidem floor sheet used in Damtech’s steel-kit catalogue. It is not a shell-only price.",
      },
      {
        question: "Are delivery and installation included?",
        answer:
          "No. Delivery and installation are excluded. Damtech calculates transport from the delivery location on your RFQ and can quote assembly separately.",
      },
      {
        question: "What preparation is required before assembling the pond?",
        answer:
          "Prepare a level, compacted base — typically sand or crusher dust on geotextile — before assembling the shell. The base is not included in the kit price. Exact footprint is confirmed on the invoice because pond diameter is not published as a verified figure.",
      },
      {
        question: "Can Damtech quote for larger fish ponds?",
        answer:
          "Yes. The 15 000L fish-farming pond is listed in this catalogue, and larger containment can be quoted on request. Submitting an RFQ does not complete a purchase.",
      },
    ],
    relatedSkus: ["DMT-FP-15000"],
    relatedHeading: "Related aquaculture kits",
    secondaryCta: {
      href: "/steel-water-storage-tanks/15000-litre-fish-pond/",
      label: "See the 15 000L fish-farming pond",
    },
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#fish-ponds-aquaculture",
        label: "Fish ponds and aquaculture tanks",
      },
      {
        href: "/steel-water-storage-tanks/15000-litre-fish-pond/",
        label: "15 000L fish-farming pond",
      },
      {
        href: "/pvc-dam-lining/",
        label: "PVC lining used inside steel kits",
      },
      { href: "/quote/", label: "Request an invoice" },
    ],
  },
  {
    sku: "DMT-FP-15000",
    slug: "15000-litre-fish-pond",
    name: "15 000L Fish Farming Pond and Aquaculture Tank",
    h1: "15 000L Fish Farming Pond and Aquaculture Tank",
    seoTitle: "15 000L Fish Farming Pond South Africa | Damtech",
    seoDescription:
      "15 000L fish-farming pond and aquaculture tank kit for R17 999 incl. VAT. Corrugated steel supply-only kit. Transport and installation excluded.",
    feedTitle: "15 000L Corrugated Steel Fish Pond Kit",
    merchantEligible: true,
    heroCopy:
      "The 15 000L Damtech fish-farming pond offers additional managed water volume for aquaculture projects, fish holding and larger ornamental-pond applications. It is supplied as a fixed-price corrugated steel and liner kit.",
    description:
      "This larger pond is intended for customers who require more containment volume than the 10 000L model. The final aquaculture system must still be designed around the species, stocking density, water exchange, filtration, aeration and operational requirements.",
    bodyHeading: "15 000 Litre Fish-Farming and Aquaculture Containment",
    bodyCopy:
      "The 15 000L kit is a containment vessel, not a commercially productive fish farm on its own. It does not include aeration, filtration or livestock. Diameter and height remain unpublished until Damtech confirms them on the invoice. The price is R17 999 incl. VAT. Delivery and installation are excluded.",
    supportingSections: [
      {
        heading: "Containment Is Only One Part of a Healthy Fish-Pond System",
        copy: "Stocking density, water exchange, filtration, aeration and husbandry must be designed for the intended species. This supply-only kit does not make the pond commercially productive without that separately engineered aquaculture system.",
      },
    ],
    supplyNotice: FISH_POND_SUPPLY_NOTICE,
    ctaLabel: "Add 15 000L Fish Pond to RFQ — Request Invoice",
    categoryId: "fish-ponds-and-aquaculture-tanks",
    categoryLabel: PRODUCT_CATEGORY_LABELS["fish-ponds-and-aquaculture-tanks"],
    rfqService: "Fish pond / aquaculture tank",
    priceInclVatZar: 17999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: 15000,
    diameterM: UNRESOLVED_BUSINESS_FACTS.fishPondDimensions,
    heightM: UNRESOLVED_BUSINESS_FACTS.fishPondDimensions,
    coreSpecSummary: "15 000L containment · supply only",
    specifications: [
      { label: "Nominal marketed capacity", value: "15 000 litres" },
      { label: "Product type", value: "Corrugated steel fish-farming pond kit" },
      { label: "Supply format", value: "Supply only" },
      { label: "Delivery", value: "Excluded" },
      { label: "Installation", value: "Excluded" },
      { label: "Filtration and aeration", value: "Excluded" },
      { label: "SKU", value: "DMT-FP-15000" },
      { label: "Price", value: formatZarWholeInclVat(17999) },
    ],
    inclusions: FISH_POND_INCLUSIONS,
    exclusions: FISH_POND_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation:
      "This is a supply-only pond kit. Delivery only throughout South Africa. Delivery and installation are excluded from the listed price. DamTech will confirm the delivery charge on the formal invoice. Assembly, filtration and aeration are quoted separately if required.",
    sitePreparation:
      "Prepare a level, compacted sand or crusher-dust base on geotextile before assembling the 15 000L shell. The larger volume still needs an even pad so the liner is not strained. Exact footprint is confirmed on the invoice. The base, transport and installation are excluded from the R17 999 incl. VAT price.",
    applications: [
      "Fish-farming and aquaculture containment",
      "Breeding or grow-out projects",
      "Quarantine and holding",
      "Large ornamental pond systems",
      "Agricultural aquaculture trials",
    ],
    images: fishPondImageManifest("DMT-FP-15000"),
    faqs: [
      {
        question: "What is included in the R17 999 price?",
        answer:
          "R17 999 incl. VAT covers the supply-only corrugated steel shell, 850 gsm PVC liner and bidem floor sheet. Filtration, pumps, aeration, fish, transport and installation are not included.",
      },
      {
        question: "Is VAT included?",
        answer:
          "Yes. R17 999 includes 15% VAT. Damtech does not advertise an ex-VAT consumer price for this kit.",
      },
      {
        question: "What is excluded from the fish-pond kit?",
        answer:
          "Delivery, installation, the prepared base, filtration, pumps, aeration equipment, fish, biological media and water treatment are excluded.",
      },
      {
        question: "Does the pond include aeration or filtration?",
        answer:
          "No. Aeration and filtration must be designed and supplied separately for the intended species and stocking density.",
      },
      {
        question: "Is it suitable for commercial aquaculture?",
        answer:
          "It can provide 15 000 litres of containment for a commercial project, but it is not a commercially productive system on its own. Production depends on a separately engineered aquaculture design.",
      },
      {
        question: "How does it differ from the 10 000L fish pond?",
        answer:
          "It offers 5 000 litres more marketed containment volume at R17 999 incl. VAT rather than R13 999. Both are supply-only liner kits. Neither publishes verified diameter or height on this website.",
      },
      {
        question: "Can transport and assembly be quoted separately?",
        answer:
          "Yes. Add the 15 000L fish pond to an RFQ with your province, town and delivery location. Damtech confirms transport and can quote assembly separately. Submitting the RFQ does not complete a purchase.",
      },
    ],
    relatedSkus: ["DMT-FP-10000"],
    relatedHeading: "Related aquaculture kits",
    secondaryCta: {
      href: "/steel-water-storage-tanks/10000-litre-fish-pond/",
      label: "See the 10 000L fish pond",
    },
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#fish-ponds-aquaculture",
        label: "All fish pond and aquaculture kits",
      },
      {
        href: "/steel-water-storage-tanks/10000-litre-fish-pond/",
        label: "10 000L fish pond kit",
      },
      {
        href: "/agricultural-water-storage/",
        label: "Farm water storage alongside aquaculture",
      },
      {
        href: "/pvc-dam-lining/",
        label: "PVC lining for steel tank interiors",
      },
    ],
  },
  {
    sku: "DMT-LT-1500",
    slug: "livestock-water-trough",
    name: "Round Livestock Water Trough",
    h1: "Round Livestock Water Trough",
    seoTitle: "Livestock Water Trough for Cattle | R4 999 | Damtech",
    seoDescription:
      "Round livestock and cattle water trough for R4 999 incl. VAT. 1.5 m diameter × 381 mm high. Supply only; transport and installation excluded.",
    feedTitle: "Round Galvanised Livestock Water Trough",
    merchantEligible: true,
    heroCopy:
      "A durable round livestock water trough for cattle, sheep, goats and suitable game-farming applications. Also known as a waterkrip or beeswaterkrip, this low-profile farm trough provides access from multiple sides.",
    description:
      "This round cattle water trough provides a practical drinking point in camps, paddocks, kraals and selected game-farming applications. The circular layout allows animals to approach from multiple directions, while the low wall height supports practical access and cleaning.",
    bodyHeading: "Cattle Water Trough for South African Farms",
    bodyCopy:
      "Farmers use this livestock water trough — a cattle drinking trough or farm water trough — where a simple, round watering point is enough. In Afrikaans it is a waterkrip or beeswaterkrip; waterkrippe of this type suit camps that already have a reliable water supply. Die ronde waterkrip is geskik as ’n praktiese drinkpunt vir vee waar die toevoer, vlotterklep en basis korrek voorberei is. The price is R4 999 incl. VAT. Delivery, installation, pipework and automatic filling equipment are excluded.",
    supplyNotice: TROUGH_SUPPLY_NOTICE,
    ctaLabel: "Add Livestock Trough to RFQ — Request Invoice",
    categoryId: "livestock-water-troughs",
    categoryLabel: PRODUCT_CATEGORY_LABELS["livestock-water-troughs"],
    rfqService: "Livestock water trough",
    priceInclVatZar: 4999,
    currency: "ZAR",
    vatIncluded: true,
    vatRatePercent: VAT_RATE_PERCENT,
    supplyOnly: true,
    transportExcluded: true,
    installationExcluded: true,
    capacityLitres: UNRESOLVED_BUSINESS_FACTS.troughFilledCapacity,
    diameterM: 1.5,
    heightM: 0.381,
    grossTheoreticalCapacityLitres: 670,
    coreSpecSummary: "1.5 m diameter · 381 mm high",
    specifications: [
      { label: "Diameter", value: "1.5 m" },
      { label: "Height", value: "0.381 m (381 mm)" },
      {
        label: "Gross theoretical geometric capacity",
        value: "Approximately 670 litres before freeboard",
      },
      { label: "Product type", value: "Round livestock water trough" },
      { label: "Supply format", value: "Supply only" },
      { label: "Delivery", value: "Excluded" },
      { label: "Installation", value: "Excluded" },
      { label: "Pipework and float valve", value: "Not included" },
      { label: "SKU", value: "DMT-LT-1500" },
      { label: "Price", value: formatZarWholeInclVat(4999) },
    ],
    inclusions: UNRESOLVED_BUSINESS_FACTS.troughInclusions,
    exclusions: TROUGH_EXCLUSIONS,
    publicAvailability: SHARED_AVAILABILITY,
    warranty: SHARED_WARRANTY,
    deliveryExplanation:
      "This livestock water trough is supply only. Delivery only throughout South Africa. Delivery and installation are excluded from the listed price. DamTech will confirm the delivery charge on the formal invoice. Pipework, float valves and installation are not included unless quoted separately.",
    sitePreparation:
      "Stand the cattle water trough on a level, compacted patch so it does not tilt and spill. Pipework, a float valve and automatic filling equipment are not included. Damtech can quote those items with transport after the RFQ.",
    applications: [
      "Cattle drinking trough in camps and kraals",
      "Sheep and goat paddock watering",
      "Selected game-farming water points",
      "Farm water trough beside a tank or borehole line",
    ],
    images: livestockTroughImageManifest(),
    faqs: [
      {
        question: "What is the price of the livestock water trough?",
        answer:
          "The round livestock water trough is R4 999 incl. VAT. Delivery and installation are excluded.",
      },
      {
        question: "Is this suitable as a cattle water trough?",
        answer:
          "Yes. It is sold as a round cattle water trough and livestock water trough for camps, paddocks and kraals. Suitability still depends on herd size, water supply and how the trough is plumbed. Damtech does not promise compatibility with every animal or farming system.",
      },
      {
        question: "What are the waterkrip dimensions?",
        answer:
          "The waterkrip is 1.5 m in diameter and 0.381 m (381 mm) high.",
      },
      {
        question: "Approximately how much water does it hold?",
        answer:
          "Gross theoretical geometric capacity is approximately 670 litres before freeboard. That is not a guaranteed working volume. Working volume depends on freeboard and how full the trough is kept.",
      },
      {
        question: "Is a float valve included?",
        answer:
          "No. A float valve, pipework and automatic filling equipment are not included unless Damtech quotes them separately.",
      },
      {
        question: "Are transport and installation included?",
        answer:
          "No. Transport and installation are excluded from the R4 999 incl. VAT price.",
      },
      {
        question: "Can it be used for sheep, goats or game?",
        answer:
          "The low wall height is intended for practical access by cattle and can suit sheep, goats and some game-farming applications where the animals can reach a 381 mm rim. Confirm species and camp layout with Damtech on the RFQ. This page does not claim suitability for every animal.",
      },
    ],
    relatedSkus: ["DMT-WT-10000", "DMT-WT-20000"],
    relatedHeading: "Related farm water kits",
    secondaryCta: {
      href: "/calculators/#annual-water-requirement",
      label: "Estimate livestock water demand",
    },
    relatedPageLinks: [
      {
        href: "/steel-water-storage-tanks/#livestock-watering",
        label: "Livestock watering kits",
      },
      {
        href: "/agricultural-water-storage/",
        label: "Agricultural water storage for farms",
      },
      {
        href: "/calculators/#annual-water-requirement",
        label: "Annual water requirement calculator",
      },
      {
        href: "/steel-water-storage-tanks/10000-litre-water-tank/",
        label: "10 000L steel water tank for camp backup",
      },
    ],
  },
];
