import { createClient } from "@/lib/supabase/server";
import type {
  ProjectTemplate,
  ProjectTemplateField,
  ProjectTemplateItem,
  ProjectTemplateSection,
  ProjectTemplateSummary,
  ProjectTemplateVersion,
  ProjectTemplateWithRelations,
} from "./types";

type Row = Record<string, unknown>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

export function mapTemplate(row: Row): ProjectTemplate {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    shortDescription: (row.short_description as string | null) ?? null,
    projectCategory: (row.project_category as string | null) ?? null,
    defaultMaterialType: (row.default_material_type as string | null) ?? null,
    defaultServiceType: (row.default_service_type as string | null) ?? null,
    defaultQuoteTitle: (row.default_quote_title as string | null) ?? null,
    defaultProjectDescription:
      (row.default_project_description as string | null) ?? null,
    defaultScope: (row.default_scope as string | null) ?? null,
    defaultAssumptions: (row.default_assumptions as string | null) ?? null,
    defaultExclusions: (row.default_exclusions as string | null) ?? null,
    defaultCustomerMessage: (row.default_customer_message as string | null) ?? null,
    defaultInternalNotes: (row.default_internal_notes as string | null) ?? null,
    recommendedMaterialItemId:
      (row.recommended_material_item_id as string | null) ?? null,
    recommendedInstallationItemId:
      (row.recommended_installation_item_id as string | null) ?? null,
    recommendedGeotextileItemId:
      (row.recommended_geotextile_item_id as string | null) ?? null,
    recommendedSiteEstablishmentItemId:
      (row.recommended_site_establishment_item_id as string | null) ?? null,
    defaultWarrantyText: (row.default_warranty_text as string | null) ?? null,
    defaultValidityDays:
      row.default_validity_days != null ? Number(row.default_validity_days) : null,
    defaultLeadTimeText: (row.default_lead_time_text as string | null) ?? null,
    defaultDurationText: (row.default_duration_text as string | null) ?? null,
    technicalGuidance: (row.technical_guidance as string | null) ?? null,
    requiredInformation: (row.required_information as string | null) ?? null,
    recommendedInformation: (row.recommended_information as string | null) ?? null,
    riskFlags: toStringArray(row.risk_flags),
    unresolvedItemCodes: toStringArray(row.unresolved_item_codes),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapItem(row: Row): ProjectTemplateItem {
  const pricing = (row.pricing_items as Row | null) ?? null;
  return {
    id: String(row.id),
    projectTemplateId: String(row.project_template_id),
    pricingItemId: (row.pricing_item_id as string | null) ?? null,
    requestedItemCode: (row.requested_item_code as string | null) ?? null,
    lineRole: String(row.line_role ?? "other"),
    defaultQuantitySource: String(row.default_quantity_source ?? "manual"),
    defaultQuantity:
      row.default_quantity != null ? Number(row.default_quantity) : null,
    defaultUnit: (row.default_unit as string | null) ?? null,
    descriptionOverride: (row.description_override as string | null) ?? null,
    isOptional: Boolean(row.is_optional),
    isSelectedByDefault: row.is_selected_by_default !== false,
    sortOrder: Number(row.sort_order ?? 0),
    notes: (row.notes as string | null) ?? null,
    resolvedItemCode: pricing ? (pricing.item_code as string) : null,
    resolvedName: pricing ? (pricing.name as string) : null,
    resolvedUnit: pricing ? (pricing.quote_unit as string) : null,
    resolvedSellPrice:
      pricing && pricing.default_sell_price != null
        ? Number(pricing.default_sell_price)
        : null,
  };
}

export function mapSection(row: Row): ProjectTemplateSection {
  return {
    id: String(row.id),
    projectTemplateId: String(row.project_template_id),
    sectionType: String(row.section_type),
    heading: (row.heading as string | null) ?? null,
    content: String(row.content ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    isDefault: row.is_default !== false,
    isRequired: Boolean(row.is_required),
    isCustomerVisible: row.is_customer_visible !== false,
  };
}

export function mapField(row: Row): ProjectTemplateField {
  return {
    id: String(row.id),
    projectTemplateId: String(row.project_template_id),
    fieldKey: String(row.field_key),
    label: String(row.label),
    fieldType: String(row.field_type ?? "text"),
    isRequired: Boolean(row.is_required),
    isRecommended: Boolean(row.is_recommended),
    options: toStringArray(row.options),
    unit: (row.unit as string | null) ?? null,
    helpText: (row.help_text as string | null) ?? null,
    quantityTarget: (row.quantity_target as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listProjectTemplates(filters?: {
  q?: string;
  category?: string;
  materialType?: string;
  active?: boolean;
}): Promise<ProjectTemplateSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("project_templates")
    .select(
      "id, code, name, short_description, project_category, default_material_type, is_active, unresolved_item_codes, updated_at, project_template_items(count)",
    )
    .order("sort_order")
    .order("name");

  if (filters?.active != null) query = query.eq("is_active", filters.active);
  if (filters?.category) query = query.eq("project_category", filters.category);
  if (filters?.materialType)
    query = query.eq("default_material_type", filters.materialType);
  if (filters?.q?.trim()) {
    const term = filters.q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `name.ilike.%${term}%,code.ilike.%${term}%,short_description.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map((row) => {
    const r = row as Row;
    const countRel = r.project_template_items as { count: number }[] | undefined;
    return {
      id: String(r.id),
      code: String(r.code),
      name: String(r.name),
      shortDescription: (r.short_description as string | null) ?? null,
      projectCategory: (r.project_category as string | null) ?? null,
      defaultMaterialType: (r.default_material_type as string | null) ?? null,
      isActive: r.is_active !== false,
      itemCount: countRel?.[0]?.count ?? 0,
      unresolvedCount: toStringArray(r.unresolved_item_codes).length,
      updatedAt: String(r.updated_at ?? ""),
    };
  });
}

export async function getProjectTemplate(
  id: string,
): Promise<ProjectTemplateWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const [{ data: items }, { data: sections }, { data: fields }] =
    await Promise.all([
      supabase
        .from("project_template_items")
        .select(
          "*, pricing_items(item_code, name, quote_unit, default_sell_price)",
        )
        .eq("project_template_id", id)
        .order("sort_order"),
      supabase
        .from("project_template_sections")
        .select("*")
        .eq("project_template_id", id)
        .order("sort_order"),
      supabase
        .from("project_template_fields")
        .select("*")
        .eq("project_template_id", id)
        .order("sort_order"),
    ]);

  return {
    ...mapTemplate(data as Row),
    items: (items ?? []).map((r) => mapItem(r as Row)),
    sections: (sections ?? []).map((r) => mapSection(r as Row)),
    fields: (fields ?? []).map((r) => mapField(r as Row)),
  };
}

export async function getProjectTemplateVersions(
  id: string,
): Promise<ProjectTemplateVersion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_template_versions")
    .select("*")
    .eq("project_template_id", id)
    .order("version_number", { ascending: false });
  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: String(r.id),
      projectTemplateId: String(r.project_template_id),
      versionNumber: Number(r.version_number),
      snapshot: (r.snapshot as Record<string, unknown>) ?? {},
      changeSummary: (r.change_summary as string | null) ?? null,
      createdAt: String(r.created_at ?? ""),
    };
  });
}

/** Lightweight list for the quote-builder template selector. */
export async function listActiveTemplatesForSelector(): Promise<
  Pick<
    ProjectTemplateSummary,
    "id" | "code" | "name" | "shortDescription" | "projectCategory"
  >[]
> {
  const templates = await listProjectTemplates({ active: true });
  return templates.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    shortDescription: t.shortDescription,
    projectCategory: t.projectCategory,
  }));
}
