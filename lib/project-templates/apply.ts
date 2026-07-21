import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/auth/types";
import {
  PRICING_COST_COLUMNS,
  PRICING_SELL_COLUMNS,
  canViewInternalCosts,
} from "@/lib/pricing/security";
import { normaliseUnitCode } from "@/lib/pricing/units";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import type { QuoteLineType } from "@/lib/quotes/types";
import {
  mapCategoryToService,
  type TemplateProjectFieldDef,
} from "@/lib/quotes/project-autofill";
import { countClauses } from "./clauses";
import { getProjectTemplate } from "./queries";
import type { ProjectTemplateItem, ProjectTemplateLineRole } from "./types";

type Row = Record<string, unknown>;

function taxCategoryFor(value: unknown): EditableLine["taxCategory"] {
  const v = String(value ?? "standard");
  if (v === "zero_rated" || v === "zero") return "zero";
  if (v === "exempt" || v === "no_vat") return "exempt";
  return "standard";
}

function lineTypeForRole(role: ProjectTemplateLineRole | string): QuoteLineType {
  switch (role) {
    case "primary_material":
    case "underlay":
    case "surface_preparation":
    case "accessory":
      return "material";
    case "installation":
    case "repair":
    case "testing":
      return "labour";
    case "travel":
      return "travel";
    case "delivery":
      return "delivery";
    case "site_establishment":
    case "equipment":
    case "provisional_sum":
    default:
      return "custom";
  }
}

function groupForRole(role: ProjectTemplateLineRole | string): string {
  switch (role) {
    case "primary_material":
    case "underlay":
    case "accessory":
      return "Materials";
    case "installation":
      return "Installation";
    case "surface_preparation":
      return "Preparation";
    case "testing":
      return "Testing and quality control";
    case "repair":
      return "Repairs";
    case "travel":
    case "delivery":
      return "Travel and delivery";
    case "site_establishment":
    case "equipment":
      return "Site costs";
    case "provisional_sum":
      return "Provisional allowances";
    default:
      return "Other items";
  }
}

export type TemplateApplyContent = {
  templateId: string;
  templateCode: string;
  templateName: string;
  projectCategory: string | null;
  title: string;
  projectDescription: string;
  serviceRequired: string;
  scope: string;
  assumptions: string;
  exclusions: string;
  customerMessage: string;
  internalNotes: string;
  warrantyWording: string;
  validityDays: number | null;
  lines: EditableLine[];
  fields: TemplateProjectFieldDef[];
  counts: {
    items: number;
    scopeClauses: number;
    assumptions: number;
    exclusions: number;
    fields: number;
  };
  snapshot: Record<string, unknown>;
  versionId: string | null;
  unresolvedItemCodes: string[];
};

/** Build the content that applying a template contributes to a quote. */
export async function buildTemplateApplyContent(
  templateId: string,
  role: AdminRole,
): Promise<TemplateApplyContent | null> {
  const template = await getProjectTemplate(templateId);
  if (!template) return null;

  const supabase = await createClient();

  // Latest immutable version (for snapshot linkage).
  const { data: versionRow } = await supabase
    .from("project_template_versions")
    .select("id, version_number, snapshot")
    .eq("project_template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Resolve pricing for suggested items (role-masked column projection).
  const resolvedIds = template.items
    .filter((i) => i.pricingItemId && i.isSelectedByDefault)
    .map((i) => i.pricingItemId as string);

  const priceById = new Map<string, Row>();
  if (resolvedIds.length) {
    const columns = canViewInternalCosts(role)
      ? PRICING_COST_COLUMNS
      : PRICING_SELL_COLUMNS;
    const { data: priced } = await supabase
      .from("pricing_items")
      .select(columns as "*")
      .in("id", resolvedIds);
    for (const row of priced ?? []) {
      priceById.set(String((row as Row).id), row as Row);
    }
  }

  const selected = template.items
    .filter((i) => i.isSelectedByDefault)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const lines: EditableLine[] = [];
  let sortOrder = 0;
  let currentGroup = "";
  const unresolved: string[] = [];

  const pushHeadingIfNeeded = (item: ProjectTemplateItem) => {
    const group = groupForRole(item.lineRole);
    if (group !== currentGroup) {
      currentGroup = group;
      lines.push({
        sortOrder: sortOrder++,
        lineType: "heading",
        itemCode: "",
        category: "",
        description: group,
        quantity: 1,
        unit: "ea",
        costUnitPrice: null,
        sellUnitPrice: 0,
        discountPercent: 0,
        taxCategory: "standard",
      });
    }
  };

  for (const item of selected) {
    pushHeadingIfNeeded(item);
    const priced = item.pricingItemId ? priceById.get(item.pricingItemId) : null;

    if (priced) {
      const sell =
        priced.default_sell_price != null ? Number(priced.default_sell_price) : 0;
      const cost =
        canViewInternalCosts(role) && priced.default_cost != null
          ? Number(priced.default_cost)
          : null;
      lines.push({
        sortOrder: sortOrder++,
        lineType: lineTypeForRole(item.lineRole),
        itemCode: String(priced.item_code ?? item.requestedItemCode ?? ""),
        category: String(priced.category ?? ""),
        description:
          item.descriptionOverride ??
          (priced.quote_description as string | null) ??
          String(priced.name ?? ""),
        quantity: item.defaultQuantity ?? 1,
        unit: normaliseUnitCode(
          item.defaultUnit ?? String(priced.quote_unit ?? "ea"),
        ),
        costUnitPrice: cost,
        sellUnitPrice: sell,
        discountPercent: 0,
        taxCategory: taxCategoryFor(priced.tax_category),
        sourcePricingItemId: String(priced.id),
        metadata: {
          templateLineRole: item.lineRole,
          quantitySource: item.defaultQuantitySource,
          quantitySuggested: item.defaultQuantitySource !== "manual",
        },
      });
    } else {
      // Unresolved suggested item — add a placeholder custom line for review.
      if (item.requestedItemCode) unresolved.push(item.requestedItemCode);
      lines.push({
        sortOrder: sortOrder++,
        lineType: "custom",
        itemCode: item.requestedItemCode ?? "",
        category: "",
        description:
          item.descriptionOverride ??
          `${item.requestedItemCode ?? "Item"} (to be linked)`,
        quantity: item.defaultQuantity ?? 1,
        unit: normaliseUnitCode(item.defaultUnit ?? "ea"),
        costUnitPrice: null,
        sellUnitPrice: 0,
        discountPercent: 0,
        taxCategory: "standard",
        metadata: {
          templateLineRole: item.lineRole,
          quantitySource: item.defaultQuantitySource,
          unresolvedItemCode: item.requestedItemCode,
        },
      });
    }
  }

  const fields: TemplateProjectFieldDef[] = template.fields.map((field) => ({
    fieldKey: field.fieldKey,
    label: field.label,
    fieldType: String(field.fieldType),
    isRequired: field.isRequired,
    isRecommended: field.isRecommended,
    options: field.options,
    unit: field.unit,
    helpText: field.helpText,
  }));

  const title = template.defaultQuoteTitle ?? template.name;
  const projectDescription =
    template.defaultProjectDescription ?? template.shortDescription ?? "";
  const serviceRequired =
    template.defaultServiceType ??
    mapCategoryToService(template.projectCategory) ??
    "";

  const snapshot: Record<string, unknown> = {
    templateId: template.id,
    templateCode: template.code,
    templateName: template.name,
    versionId: versionRow ? String((versionRow as Row).id) : null,
    versionNumber: versionRow ? Number((versionRow as Row).version_number) : null,
    appliedAt: new Date().toISOString(),
    defaultQuoteTitle: title,
    defaultProjectDescription: projectDescription,
    service: serviceRequired,
    scope: template.defaultScope ?? "",
    assumptions: template.defaultAssumptions ?? "",
    exclusions: template.defaultExclusions ?? "",
    customerMessage: template.defaultCustomerMessage ?? "",
    internalNotes: template.defaultInternalNotes ?? "",
    warranty: template.defaultWarrantyText ?? "",
    suggestedItems: template.items.map((item) => ({
      lineRole: item.lineRole,
      pricingItemId: item.pricingItemId,
      requestedItemCode: item.requestedItemCode,
      defaultQuantity: item.defaultQuantity,
      defaultUnit: item.defaultUnit,
    })),
    fieldDefinitions: fields,
  };

  return {
    templateId: template.id,
    templateCode: template.code,
    templateName: template.name,
    projectCategory: template.projectCategory,
    title,
    projectDescription,
    serviceRequired,
    scope: template.defaultScope ?? "",
    assumptions: template.defaultAssumptions ?? "",
    exclusions: template.defaultExclusions ?? "",
    customerMessage: template.defaultCustomerMessage ?? "",
    internalNotes: template.defaultInternalNotes ?? "",
    warrantyWording: template.defaultWarrantyText ?? "",
    validityDays: template.defaultValidityDays,
    lines,
    fields,
    counts: {
      items: lines.filter((l) => l.lineType !== "heading").length,
      scopeClauses: countClauses(template.defaultScope),
      assumptions: countClauses(template.defaultAssumptions),
      exclusions: countClauses(template.defaultExclusions),
      fields: fields.length,
    },
    snapshot,
    versionId: versionRow ? String((versionRow as Row).id) : null,
    unresolvedItemCodes: Array.from(new Set(unresolved)),
  };
}
