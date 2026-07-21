import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { writeQuoteEvent } from "./events";
import { quoteSaveSchema, type QuoteSaveInput } from "./schema";
import { getQuoteSettings } from "./settings";
import { calculateQuote } from "./calculate-quote";
import { addDaysToIsoDate, todayIsoDateJohannesburg } from "./totals";
import { canEditQuote } from "./workflow";
import type { QuoteLineInput } from "./types";

export type QuoteMutationResult =
  | { ok: true; quoteId: string; quoteNumber: string }
  | { ok: false; error: string };

function mapLines(input: QuoteSaveInput["lines"]): QuoteLineInput[] {
  return input.map((line, index) => ({
    id: line.id,
    sortOrder: line.sortOrder ?? index,
    lineType: line.lineType,
    itemCode: line.itemCode ?? null,
    category: line.category ?? null,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    costUnitPrice: line.costUnitPrice ?? null,
    sellUnitPrice: line.sellUnitPrice,
    discountPercent: line.discountPercent ?? 0,
    taxCategory: line.taxCategory ?? "standard",
    sourceMaterialItemId: line.sourceMaterialItemId ?? null,
    sourceLabourItemId: line.sourceLabourItemId ?? null,
    sourceSupplierPriceId: line.sourceSupplierPriceId ?? null,
    sourcePricingItemId: line.sourcePricingItemId ?? null,
    metadata: line.metadata ?? null,
  }));
}

function lineRows(quoteId: string, lines: ReturnType<typeof calculateQuote>["lines"]) {
  return lines.map((line) => ({
    quote_id: quoteId,
    sort_order: line.sortOrder,
    line_type: line.lineType,
    item_code: line.itemCode ?? null,
    category: line.category ?? null,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    cost_unit_price: line.costUnitPrice ?? null,
    sell_unit_price: line.sellUnitPrice,
    discount_percent: line.discountPercent,
    tax_category: line.taxCategory,
    line_total_ex_vat: line.lineTotalExVat,
    metadata: line.metadata ?? null,
    source_material_item_id: line.sourceMaterialItemId ?? null,
    source_labour_item_id: line.sourceLabourItemId ?? null,
    source_supplier_price_id: line.sourceSupplierPriceId ?? null,
    source_pricing_item_id: line.sourcePricingItemId ?? null,
  }));
}

export async function createDraftQuote(
  raw: unknown,
): Promise<QuoteMutationResult> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    const parsed = quoteSaveSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote." };
    }

    const settings = await getQuoteSettings();
    const issueDate = parsed.data.issueDate || todayIsoDateJohannesburg();
    const validityDays = settings?.default_validity_days ?? 30;
    const validUntil =
      parsed.data.validUntil || addDaysToIsoDate(issueDate, validityDays);
    const vatRate = parsed.data.vatRate || Number(settings?.default_vat_rate ?? 15);

    const totals = calculateQuote(mapLines(parsed.data.lines), {
      discountAmount: parsed.data.discountAmount,
      discountType: parsed.data.discountType,
      discountPercent: parsed.data.discountPercent,
      vatRatePercent: vatRate,
      vatPricingMode: parsed.data.vatPricingMode,
    });

    const service = createServiceRoleClient();
    const { data: quoteNumber, error: numberError } = await service.rpc(
      "next_quote_number",
    );
    if (numberError || typeof quoteNumber !== "string") {
      return { ok: false, error: "Unable to allocate quote number." };
    }

    const supabase = await createClient();
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        revision_number: 0,
        status: "draft",
        customer_id: parsed.data.customerId,
        rfq_id: parsed.data.rfqId ?? null,
        title: parsed.data.title,
        project_reference: parsed.data.projectReference ?? null,
        project_location: parsed.data.projectLocation ?? null,
        service_required: parsed.data.serviceRequired ?? null,
        scope_summary: parsed.data.scopeSummary ?? null,
        project_description: parsed.data.projectDescription ?? null,
        assumptions:
          parsed.data.assumptions ?? settings?.default_assumptions ?? null,
        exclusions:
          parsed.data.exclusions ?? settings?.default_exclusions ?? null,
        payment_terms:
          parsed.data.paymentTerms ?? settings?.default_payment_terms ?? null,
        programme_notes: parsed.data.programmeNotes ?? null,
        warranty_wording: parsed.data.warrantyWording ?? null,
        customer_message: parsed.data.customerMessage ?? null,
        internal_notes: parsed.data.internalNotes ?? null,
        contact_name: parsed.data.contactName ?? null,
        company_name: parsed.data.companyName ?? null,
        email: parsed.data.email || null,
        phone: parsed.data.phone ?? null,
        province: parsed.data.province ?? null,
        currency: "ZAR",
        issue_date: issueDate,
        valid_until: validUntil,
        validity_days: validityDays,
        expires_at: `${validUntil}T23:59:59+02:00`,
        discount_amount: totals.discountAmount,
        subtotal_ex_vat: totals.subtotalExVat,
        net_ex_vat: totals.subtotalExVat - totals.discountAmount,
        vat_rate: totals.vatRate,
        vat_amount: totals.vatAmount,
        total_inc_vat: totals.totalIncVat,
        direct_cost: totals.directCost,
        gross_profit: totals.grossProfit,
        gross_margin_percent: totals.grossMarginPercent,
        deposit_percent:
          parsed.data.depositPercent ?? settings?.default_deposit_percent ?? 0,
        project_template_id: parsed.data.projectTemplateId ?? null,
        project_template_version_id: parsed.data.projectTemplateVersionId ?? null,
        project_template_snapshot: parsed.data.projectTemplateSnapshot ?? null,
        line_items: [],
        created_by: admin.user.id,
        assigned_to: admin.user.id,
        is_latest_revision: true,
        calculation_snapshot: {
          serverRecalculated: true,
          at: new Date().toISOString(),
          estimatorConfirmedSuggestions:
            parsed.data.estimatorConfirmedSuggestions ?? false,
        },
        metadata: {
          discountType: parsed.data.discountType,
          discountPercent: parsed.data.discountPercent,
          discountReason: parsed.data.discountReason ?? null,
          vatPricingMode: parsed.data.vatPricingMode,
        },
      })
      .select("id, quote_number")
      .single();

    if (error || !quote) {
      console.error("[quotes] create failed:", error?.message);
      return { ok: false, error: "Unable to create quote." };
    }

    const { error: linesError } = await supabase
      .from("quote_line_items")
      .insert(lineRows(quote.id, totals.lines));

    if (linesError) {
      console.error("[quotes] lines insert failed:", linesError.message);
      return { ok: false, error: "Quote created but line items failed to save." };
    }

    await writeQuoteEvent(supabase, {
      quoteId: quote.id,
      eventType: "created",
      actorType: "admin",
      actorUserId: admin.user.id,
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_created",
      entityType: "quote",
      entityId: quote.id,
      afterData: { quote_number: quote.quote_number },
    });

    return { ok: true, quoteId: quote.id, quoteNumber: quote.quote_number };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    console.error("[quotes] create unexpected:", error);
    return { ok: false, error: "Unable to create quote." };
  }
}

export async function updateDraftQuote(
  quoteId: string,
  raw: unknown,
): Promise<QuoteMutationResult> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    const parsed = quoteSaveSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote." };
    }

    const supabase = await createClient();
    const { data: existing, error: loadError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (loadError || !existing) {
      return { ok: false, error: "Quote not found." };
    }

    if (!canEditQuote(existing.status, admin.profile.role)) {
      return {
        ok: false,
        error: "This quote is locked. Create a revision to change it.",
      };
    }

    const vatRate = parsed.data.vatRate;
    const totals = calculateQuote(mapLines(parsed.data.lines), {
      discountAmount: parsed.data.discountAmount,
      discountType: parsed.data.discountType,
      discountPercent: parsed.data.discountPercent,
      vatRatePercent: vatRate,
      vatPricingMode: parsed.data.vatPricingMode,
    });

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        customer_id: parsed.data.customerId,
        rfq_id: parsed.data.rfqId ?? null,
        title: parsed.data.title,
        project_reference: parsed.data.projectReference ?? null,
        project_location: parsed.data.projectLocation ?? null,
        service_required: parsed.data.serviceRequired ?? null,
        scope_summary: parsed.data.scopeSummary ?? null,
        project_description: parsed.data.projectDescription ?? null,
        assumptions: parsed.data.assumptions ?? null,
        exclusions: parsed.data.exclusions ?? null,
        payment_terms: parsed.data.paymentTerms ?? null,
        programme_notes: parsed.data.programmeNotes ?? null,
        warranty_wording: parsed.data.warrantyWording ?? null,
        customer_message: parsed.data.customerMessage ?? null,
        internal_notes: parsed.data.internalNotes ?? null,
        contact_name: parsed.data.contactName ?? null,
        company_name: parsed.data.companyName ?? null,
        email: parsed.data.email || null,
        phone: parsed.data.phone ?? null,
        province: parsed.data.province ?? null,
        issue_date: parsed.data.issueDate,
        valid_until: parsed.data.validUntil,
        expires_at: `${parsed.data.validUntil}T23:59:59+02:00`,
        discount_amount: totals.discountAmount,
        subtotal_ex_vat: totals.subtotalExVat,
        net_ex_vat: totals.subtotalExVat - totals.discountAmount,
        vat_rate: totals.vatRate,
        vat_amount: totals.vatAmount,
        total_inc_vat: totals.totalIncVat,
        direct_cost: totals.directCost,
        gross_profit: totals.grossProfit,
        gross_margin_percent: totals.grossMarginPercent,
        deposit_percent: parsed.data.depositPercent ?? existing.deposit_percent,
        project_template_id:
          parsed.data.projectTemplateId ?? existing.project_template_id ?? null,
        project_template_version_id:
          parsed.data.projectTemplateVersionId ??
          existing.project_template_version_id ??
          null,
        project_template_snapshot:
          parsed.data.projectTemplateSnapshot ??
          existing.project_template_snapshot ??
          null,
        calculation_snapshot: {
          serverRecalculated: true,
          at: new Date().toISOString(),
          estimatorConfirmedSuggestions:
            parsed.data.estimatorConfirmedSuggestions ?? false,
        },
        metadata: {
          discountType: parsed.data.discountType,
          discountPercent: parsed.data.discountPercent,
          discountReason: parsed.data.discountReason ?? null,
          vatPricingMode: parsed.data.vatPricingMode,
        },
      })
      .eq("id", quoteId);

    if (updateError) {
      return { ok: false, error: "Unable to update quote." };
    }

    await supabase.from("quote_line_items").delete().eq("quote_id", quoteId);
    const { error: linesError } = await supabase
      .from("quote_line_items")
      .insert(lineRows(quoteId, totals.lines));

    if (linesError) {
      return { ok: false, error: "Unable to save line items." };
    }

    await writeQuoteEvent(supabase, {
      quoteId,
      eventType: "updated",
      actorType: "admin",
      actorUserId: admin.user.id,
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_updated",
      entityType: "quote",
      entityId: quoteId,
      afterData: { total_inc_vat: totals.totalIncVat },
    });

    return {
      ok: true,
      quoteId,
      quoteNumber: existing.quote_number as string,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to update quote." };
  }
}
