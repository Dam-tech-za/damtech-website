import type { ServiceSection } from "../service-pages-content.ts";

/**
 * Copy for /pvc-tank-liners/. Facts only: sizes, gsm options, colours, lead
 * time and exclusions come from lib/shop and the owner (2026-11-10). No
 * lifespan, warranty or potable-water claims until the owner supplies them.
 */
export const PVC_LINER_SECTIONS: ServiceSection[] = [
  {
    id: "what-is-a-pvc-tank-liner",
    heading: "What a PVC tank liner does",
    paragraphs: [
      "A corrugated steel tank is a steel shell that carries the load of the water. The PVC liner is the part that actually holds the water. It sits inside the shell, covers the floor and the wall, and folds over the top rim where it is clipped in place.",
      "When a tank leaks, the steel is usually still sound and the liner is what needs replacing. A new made-up liner in the right size goes into the existing shell, so you keep the tank you already have.",
    ],
  },
  {
    id: "how-to-measure",
    heading: "How to measure your tank",
    paragraphs: [
      "You need two numbers: the inside diameter and the number of rows of corrugated sheet. Measure straight across the inside of the tank, wall to wall, through the centre. Then count the rows of sheet from the ground to the rim. Each row is 762 mm high, so two rows is about 1.5 m, three rows about 2.3 m and four rows about 3.0 m.",
      "Damtech liners are made up for round tanks from 3 m to 17 m in diameter. If your tank is a different size or shape, or was not built with 762 mm sheets, request a quote and we will make the liner to your measurements.",
    ],
  },
  {
    id: "550-or-800-gsm",
    heading: "550 gsm or 800 gsm",
    paragraphs: [
      "The gsm figure is the weight of the PVC material in grams per square metre. 550 gsm is the liner Damtech supplies as standard in its steel reservoir kits. 800 gsm is a heavier material for buyers who want a thicker liner.",
      "Both are available in blue or black at the same price. Choose the colour when you order.",
    ],
  },
  {
    id: "ordering-and-delivery",
    heading: "Ordering, lead time and delivery",
    paragraphs: [
      "Every liner is made to order for the tank size you choose, which takes 3 to 5 business days after payment. You pay online by card or Instant EFT through PayFast, and manufacture starts once the payment is confirmed.",
      "Delivery is charged as a fixed fee per province and is shown at checkout before you pay. Installation is not included in the online price. If you would like Damtech to fit the liner, request a quote.",
    ],
  },
];

export const PVC_LINER_FAQS = [
  {
    question: "What sizes of PVC tank liner can I order online?",
    answer:
      "Liners for round corrugated steel tanks from 3 m to 17 m in diameter: two rows high (about 1.5 m) up to 15 m diameter, three rows (about 2.3 m) up to 17 m, and four rows (about 3.0 m) up to 12 m. Each size is available in 550 gsm and 800 gsm.",
  },
  {
    question: "How do I know which liner fits my tank?",
    answer:
      "Measure the inside diameter of the tank and count the rows of corrugated sheet. Each row is 762 mm high. Select the same diameter and number of rows in the size selector and it shows the matching liner and its price.",
  },
  {
    question: "What colours are available?",
    answer: "Blue and black. The price is the same for both colours.",
  },
  {
    question: "How long does a liner take to arrive?",
    answer:
      "Liners are made to order in 3 to 5 business days after payment is confirmed, and are then delivered. Damtech contacts you to arrange the delivery.",
  },
  {
    question: "Is delivery included in the price?",
    answer:
      "No. The liner price includes VAT but not delivery. Delivery is a fixed fee per province and is added at checkout, so you see the full total before you pay.",
  },
  {
    question: "Is installation included?",
    answer:
      "No. The online price is for the supply of the liner only. Damtech can quote separately to install it.",
  },
  {
    question: "Can I order a liner for a tank that is not on the list?",
    answer:
      "Yes, by quotation. Send the tank's diameter, height and shape through the quote form and Damtech will price a liner made to those measurements.",
  },
] as const;
