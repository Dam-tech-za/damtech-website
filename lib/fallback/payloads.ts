import type { CatalogueLineSnapshot } from "../catalogue/types.ts";
import type { PublicOrderFormInput } from "../orders/schema.ts";
import type { PublicMultiRfqInput } from "../rfq/public-schema.ts";
import type { PublicRfqSubmission } from "../rfq/schema.ts";
import type { OrderPriceSnapshot } from "../orders/pricing.ts";
import type { DatabaseFallbackInput, FallbackEmailSection } from "./types.ts";

function contactSection(data: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  province?: string;
}): FallbackEmailSection {
  return {
    title: "Contact",
    rows: [
      { label: "Name", value: data.name },
      { label: "Company", value: data.company ?? "" },
      { label: "Email", value: data.email ?? "" },
      { label: "Phone", value: data.phone ?? "" },
      { label: "Province", value: data.province ?? "" },
    ],
  };
}

export function buildSimpleQuoteFallbackInput(input: {
  incidentId: string;
  submissionId: string;
  data: PublicRfqSubmission;
  catalogueLine?: CatalogueLineSnapshot | null;
  sourcePage: string;
}): DatabaseFallbackInput {
  const sections: FallbackEmailSection[] = [
    contactSection(input.data),
    {
      title: "Enquiry",
      rows: [
        { label: "Service required", value: input.data.serviceRequired },
        { label: "Project size", value: input.data.projectSize ?? "" },
        { label: "Town", value: input.data.town ?? "" },
        { label: "Project location", value: input.data.projectLocation ?? "" },
        { label: "Delivery address", value: input.data.deliveryAddress ?? "" },
        { label: "Material preference", value: input.data.materialPreference ?? "" },
        { label: "Preferred timeframe", value: input.data.preferredTimeframe ?? "" },
        { label: "Message", value: input.data.message },
      ],
    },
  ];

  if (input.catalogueLine) {
    const line = input.catalogueLine;
    sections.push({
      title: "Catalogue line",
      rows: [
        { label: "SKU", value: line.sku },
        { label: "Product", value: line.productName },
        { label: "Quantity", value: String(line.quantity) },
        {
          label: "Unit price incl. VAT",
          value: `R ${line.unitPriceInclVatZar.toFixed(2)}`,
        },
        {
          label: "Line total incl. VAT",
          value: `R ${line.lineTotalInclVatZar.toFixed(2)}`,
        },
      ],
    });
  }

  return {
    formType: "simple_quote",
    submissionId: input.submissionId,
    incidentId: input.incidentId,
    sourcePage: input.sourcePage,
    attachmentsNote:
      "No files were uploaded because the database was unavailable. Request photos or drawings from the customer.",
    sections,
  };
}

export function buildCalculatorRfqFallbackInput(input: {
  incidentId: string;
  submissionId: string;
  data: PublicMultiRfqInput;
}): DatabaseFallbackInput {
  const location = [
    input.data.farmProjectName,
    input.data.town,
    input.data.province,
  ]
    .filter(Boolean)
    .join(", ");

  const assetRows = input.data.assets.flatMap((asset, index) => [
    { label: `Asset ${index + 1} name`, value: asset.assetName },
    { label: `Asset ${index + 1} type`, value: asset.assetType },
    { label: `Asset ${index + 1} quantity`, value: String(asset.quantity) },
    {
      label: `Asset ${index + 1} measurement`,
      value: asset.measurementMethod,
    },
    { label: `Asset ${index + 1} notes`, value: asset.siteNotes ?? "" },
  ]);

  return {
    formType: "calculator_rfq",
    submissionId: input.submissionId,
    incidentId: input.incidentId,
    sourcePage: input.data.sourcePage,
    attachmentsNote:
      "No files were uploaded because the database was unavailable. Request drawings from the customer if needed.",
    sections: [
      contactSection(input.data),
      {
        title: "Location",
        rows: [
          { label: "Farm / project", value: input.data.farmProjectName ?? "" },
          { label: "Address", value: input.data.addressLine ?? "" },
          { label: "Town", value: input.data.town ?? "" },
          { label: "Province", value: input.data.province ?? "" },
          { label: "Postal code", value: input.data.postalCode ?? "" },
          { label: "Combined location", value: location },
          { label: "Access notes", value: input.data.accessNotes ?? "" },
        ],
      },
      {
        title: "Services",
        rows: [
          {
            label: "Services requested",
            value: input.data.servicesRequested.join(", "),
          },
          { label: "Message", value: input.data.message ?? "" },
        ],
      },
      { title: "Assets", rows: assetRows },
    ],
  };
}

export function buildContactFallbackInput(input: {
  incidentId: string;
  submissionId: string;
  data: PublicRfqSubmission;
  sourcePage: string;
}): DatabaseFallbackInput {
  return {
    formType: "contact",
    submissionId: input.submissionId,
    incidentId: input.incidentId,
    sourcePage: input.sourcePage,
    sections: [
      contactSection(input.data),
      {
        title: "Enquiry",
        rows: [
          { label: "Service required", value: input.data.serviceRequired },
          { label: "Project size", value: input.data.projectSize ?? "" },
          { label: "Project location", value: input.data.projectLocation ?? "" },
          { label: "Message", value: input.data.message },
        ],
      },
    ],
  };
}

export function buildCatalogueOrderFallbackInput(input: {
  incidentId: string;
  submissionId: string;
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
}): DatabaseFallbackInput {
  return {
    formType: "catalogue_order",
    submissionId: input.submissionId,
    incidentId: input.incidentId,
    sourcePage: "/order",
    sections: [
      {
        title: "Customer",
        rows: [
          { label: "Customer type", value: input.data.customerType },
          { label: "Name", value: input.data.customerName },
          { label: "Business", value: input.data.businessName ?? "" },
          { label: "Email", value: input.data.email },
          { label: "Phone", value: input.data.phone },
          { label: "VAT number", value: input.data.vatNumber ?? "" },
          { label: "PO number", value: input.data.customerPoNumber ?? "" },
        ],
      },
      {
        title: "Billing address",
        rows: [
          { label: "Line 1", value: input.data.billingLine1 },
          { label: "Line 2", value: input.data.billingLine2 ?? "" },
          { label: "Suburb", value: input.data.suburb },
          { label: "City", value: input.data.city },
          { label: "Province", value: input.data.province },
          { label: "Postal code", value: input.data.postalCode },
        ],
      },
      {
        title: "Order",
        rows: [
          { label: "SKU", value: input.snapshot.sku },
          { label: "Product", value: input.snapshot.productName },
          { label: "Quantity", value: String(input.snapshot.quantity) },
          {
            label: "Unit price incl. VAT",
            value: `R ${input.snapshot.unitPriceInclVatZar.toFixed(2)}`,
          },
          {
            label: "Total incl. VAT",
            value: `R ${input.snapshot.totalInclVatZar.toFixed(2)}`,
          },
          { label: "Notes", value: input.data.notes ?? "" },
        ],
      },
    ],
  };
}
