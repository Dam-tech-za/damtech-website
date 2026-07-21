"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import {
  projectTemplateSaveSchema,
  type ProjectTemplateSaveInput,
} from "@/lib/project-templates/schema";
import { buildTemplateApplyContent } from "@/lib/project-templates/apply";
import { getProjectTemplate } from "@/lib/project-templates/queries";

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function createVersionSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  templateId: string,
  changeSummary: string | null,
  createdBy: string | null,
): Promise<void> {
  const [{ data: template }, { data: items }, { data: sections }, { data: fields }] =
    await Promise.all([
      supabase.from("project_templates").select("*").eq("id", templateId).maybeSingle(),
      supabase
        .from("project_template_items")
        .select("*")
        .eq("project_template_id", templateId)
        .order("sort_order"),
      supabase
        .from("project_template_sections")
        .select("*")
        .eq("project_template_id", templateId)
        .order("sort_order"),
      supabase
        .from("project_template_fields")
        .select("*")
        .eq("project_template_id", templateId)
        .order("sort_order"),
    ]);

  const { data: latest } = await supabase
    .from("project_template_versions")
    .select("version_number")
    .eq("project_template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = latest ? Number(latest.version_number) + 1 : 1;

  await supabase.from("project_template_versions").insert({
    project_template_id: templateId,
    version_number: nextVersion,
    snapshot: {
      template: template ?? null,
      items: items ?? [],
      sections: sections ?? [],
      fields: fields ?? [],
    },
    change_summary: changeSummary,
    created_by: createdBy,
  });
}

function unresolvedFromItems(items: ProjectTemplateSaveInput["items"]): string[] {
  const codes = items
    .filter((i) => !i.pricingItemId && i.requestedItemCode)
    .map((i) => i.requestedItemCode as string);
  return Array.from(new Set(codes));
}

export async function saveProjectTemplateAction(
  input: ProjectTemplateSaveInput,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertAdmin({ permission: "managePricing" });
  } catch {
    return { ok: false, error: "You do not have permission to manage templates." };
  }

  const parsed = projectTemplateSaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid template data.",
    };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const templateRow = {
    code: data.code,
    name: data.name,
    short_description: data.shortDescription ?? null,
    project_category: data.projectCategory ?? null,
    default_material_type: data.defaultMaterialType ?? null,
    default_service_type: data.defaultServiceType ?? null,
    default_quote_title: data.defaultQuoteTitle ?? null,
    default_project_description: data.defaultProjectDescription ?? null,
    default_scope: data.defaultScope ?? null,
    default_assumptions: data.defaultAssumptions ?? null,
    default_exclusions: data.defaultExclusions ?? null,
    default_customer_message: data.defaultCustomerMessage ?? null,
    default_internal_notes: data.defaultInternalNotes ?? null,
    default_warranty_text: data.defaultWarrantyText ?? null,
    default_validity_days: data.defaultValidityDays ?? null,
    default_lead_time_text: data.defaultLeadTimeText ?? null,
    default_duration_text: data.defaultDurationText ?? null,
    technical_guidance: data.technicalGuidance ?? null,
    required_information: data.requiredInformation ?? null,
    recommended_information: data.recommendedInformation ?? null,
    is_active: data.isActive,
    sort_order: data.sortOrder,
    unresolved_item_codes: unresolvedFromItems(data.items),
    updated_by: admin.profile.id,
  };

  let templateId = data.id;

  if (templateId) {
    const { error } = await supabase
      .from("project_templates")
      .update(templateRow)
      .eq("id", templateId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: created, error } = await supabase
      .from("project_templates")
      .insert({ ...templateRow, created_by: admin.profile.id })
      .select("id")
      .single();
    if (error || !created) {
      return { ok: false, error: error?.message ?? "Failed to create template." };
    }
    templateId = String(created.id);
  }

  // Replace child collections.
  await Promise.all([
    supabase.from("project_template_items").delete().eq("project_template_id", templateId),
    supabase
      .from("project_template_sections")
      .delete()
      .eq("project_template_id", templateId),
    supabase.from("project_template_fields").delete().eq("project_template_id", templateId),
  ]);

  if (data.items.length) {
    const { error } = await supabase.from("project_template_items").insert(
      data.items.map((item, index) => ({
        project_template_id: templateId,
        pricing_item_id: item.pricingItemId ?? null,
        requested_item_code: item.requestedItemCode ?? null,
        line_role: item.lineRole,
        default_quantity_source: item.defaultQuantitySource,
        default_quantity: item.defaultQuantity ?? null,
        default_unit: item.defaultUnit ?? null,
        description_override: item.descriptionOverride ?? null,
        is_optional: item.isOptional,
        is_selected_by_default: item.isSelectedByDefault,
        sort_order: item.sortOrder ?? index,
        notes: item.notes ?? null,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  if (data.sections.length) {
    const { error } = await supabase.from("project_template_sections").insert(
      data.sections.map((section, index) => ({
        project_template_id: templateId,
        section_type: section.sectionType,
        heading: section.heading ?? null,
        content: section.content,
        sort_order: section.sortOrder ?? index,
        is_default: section.isDefault,
        is_required: section.isRequired,
        is_customer_visible: section.isCustomerVisible,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  if (data.fields.length) {
    const { error } = await supabase.from("project_template_fields").insert(
      data.fields.map((field, index) => ({
        project_template_id: templateId,
        field_key: field.fieldKey,
        label: field.label,
        field_type: field.fieldType,
        is_required: field.isRequired,
        is_recommended: field.isRecommended,
        options: field.options,
        unit: field.unit ?? null,
        help_text: field.helpText ?? null,
        quantity_target: field.quantityTarget ?? null,
        sort_order: field.sortOrder ?? index,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  await createVersionSnapshot(
    supabase,
    templateId,
    data.changeSummary ?? (data.id ? "Template updated" : "Template created"),
    admin.profile.id,
  );

  await writeAuditLog({
    actorUserId: admin.profile.id,
    actorEmail: admin.profile.email,
    action: data.id ? "project_template.update" : "project_template.create",
    entityType: "project_template",
    entityId: templateId,
    afterData: { code: data.code, name: data.name },
  });

  revalidatePath("/admin/pricing/project-templates/");
  revalidatePath(`/admin/pricing/project-templates/${templateId}/`);
  return { ok: true, id: templateId };
}

export async function duplicateProjectTemplateAction(
  id: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertAdmin({ permission: "managePricing" });
  } catch {
    return { ok: false, error: "You do not have permission to manage templates." };
  }

  const template = await getProjectTemplate(id);
  if (!template) return { ok: false, error: "Template not found." };

  const result = await saveProjectTemplateAction({
    code: `${template.code}-COPY`,
    name: `${template.name} (copy)`,
    shortDescription: template.shortDescription,
    projectCategory: template.projectCategory,
    defaultMaterialType: template.defaultMaterialType,
    defaultServiceType: template.defaultServiceType,
    defaultQuoteTitle: template.defaultQuoteTitle,
    defaultProjectDescription: template.defaultProjectDescription,
    defaultScope: template.defaultScope,
    defaultAssumptions: template.defaultAssumptions,
    defaultExclusions: template.defaultExclusions,
    defaultCustomerMessage: template.defaultCustomerMessage,
    defaultInternalNotes: template.defaultInternalNotes,
    defaultWarrantyText: template.defaultWarrantyText,
    defaultValidityDays: template.defaultValidityDays,
    defaultLeadTimeText: template.defaultLeadTimeText,
    defaultDurationText: template.defaultDurationText,
    technicalGuidance: template.technicalGuidance,
    requiredInformation: template.requiredInformation,
    recommendedInformation: template.recommendedInformation,
    isActive: false,
    sortOrder: template.sortOrder + 1,
    changeSummary: `Duplicated from ${template.code}`,
    items: template.items.map((i) => ({
      pricingItemId: i.pricingItemId,
      requestedItemCode: i.requestedItemCode,
      lineRole: i.lineRole,
      defaultQuantitySource: i.defaultQuantitySource,
      defaultQuantity: i.defaultQuantity,
      defaultUnit: i.defaultUnit,
      descriptionOverride: i.descriptionOverride,
      isOptional: i.isOptional,
      isSelectedByDefault: i.isSelectedByDefault,
      sortOrder: i.sortOrder,
      notes: i.notes,
    })),
    sections: template.sections.map((s) => ({
      sectionType: s.sectionType,
      heading: s.heading,
      content: s.content,
      sortOrder: s.sortOrder,
      isDefault: s.isDefault,
      isRequired: s.isRequired,
      isCustomerVisible: s.isCustomerVisible,
    })),
    fields: template.fields.map((f) => ({
      fieldKey: f.fieldKey,
      label: f.label,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
      isRecommended: f.isRecommended,
      options: f.options,
      unit: f.unit,
      helpText: f.helpText,
      quantityTarget: f.quantityTarget,
      sortOrder: f.sortOrder,
    })),
  });

  return result;
}

export async function setProjectTemplateActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertAdmin({ permission: "managePricing" });
  } catch {
    return { ok: false, error: "You do not have permission to manage templates." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_templates")
    .update({ is_active: isActive, updated_by: admin.profile.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await writeAuditLog({
    actorUserId: admin.profile.id,
    actorEmail: admin.profile.email,
    action: isActive ? "project_template.activate" : "project_template.archive",
    entityType: "project_template",
    entityId: id,
  });

  revalidatePath("/admin/pricing/project-templates/");
  return { ok: true, id };
}

/** Quote-builder: build the content that applying a template contributes. */
export async function getTemplateApplyContentAction(templateId: string) {
  let admin;
  try {
    admin = await assertAdmin({ permission: "manageQuotes" });
  } catch {
    return { ok: false as const, error: "Not authorised." };
  }

  const content = await buildTemplateApplyContent(templateId, admin.profile.role);
  if (!content) return { ok: false as const, error: "Template not found." };
  return { ok: true as const, content };
}
