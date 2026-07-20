import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/admin/quotes/QuoteBuilder";
import { canEditQuote, canSendQuote, canViewCostMargin } from "@/lib/quotes/workflow";
import { canPerform } from "@/lib/auth/permissions";
import type { QuoteLineType, QuoteStatus } from "@/lib/quotes/types";
import {
  fetchRfqImportPreviewAction,
  saveQuoteDraftAction,
  searchRfqsForImportAction,
  sendQuoteFromBuilderAction,
} from "../../actions";
import { quoteDefaultsFromMetadata } from "@/lib/quotes/quote-validation";
import type { SendQuotePayload } from "@/components/admin/quotes/SendQuoteDialog";
import { assessQuoteLinePriceFreshness } from "@/lib/pricing/stale-prices";
import { getPricingItemById } from "@/lib/pricing/get-pricing-items";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuoteEditPage({ params }: PageProps) {
  const admin = await requireAdmin({ permission: "manageQuotes" });
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();
  if (!canEditQuote(quote.status, admin.profile.role)) {
    redirect(`/admin/quotes/${id}/`);
  }

  const { data: lines } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order");

  const { data: customers } = await supabase
    .from("customers")
    .select(
      "id, customer_type, name, company_name, email, phone, vat_number, registration_number, billing_address, site_address, province, notes, created_at, updated_at",
    )
    .order("company_name")
    .limit(500);

  const metaDefaults = quoteDefaultsFromMetadata(quote as Record<string, unknown>);
  const calcSnapshot = quote.calculation_snapshot as {
    estimatorConfirmedSuggestions?: boolean;
  } | null;

  const { data: rfq } = quote.rfq_id
    ? await supabase.from("rfqs").select("rfq_number").eq("id", quote.rfq_id).maybeSingle()
    : { data: null };

  const { data: tankRows } = await supabase
    .from("tank_models")
    .select(
      "id, model_code, model_name, nominal_capacity_kl, usable_capacity_kl, internal_diameter_m, shell_height_m, base_price, installation_price, valid_to, is_active, supplier_id, suppliers(name)",
    )
    .eq("is_active", true)
    .order("nominal_capacity_kl")
    .limit(100);

  const tankModels = (tankRows ?? []).map((row) => ({
    id: row.id,
    modelCode: row.model_code,
    modelName: row.model_name,
    supplierName:
      typeof row.suppliers === "object" && row.suppliers && "name" in row.suppliers
        ? ((row.suppliers as { name?: string | null }).name ?? null)
        : null,
    nominalCapacityKl:
      row.nominal_capacity_kl != null ? Number(row.nominal_capacity_kl) : null,
    usableCapacityKl:
      row.usable_capacity_kl != null ? Number(row.usable_capacity_kl) : null,
    diameterM:
      row.internal_diameter_m != null ? Number(row.internal_diameter_m) : null,
    heightM: row.shell_height_m != null ? Number(row.shell_height_m) : null,
    basePrice: row.base_price != null ? Number(row.base_price) : null,
    installationPrice:
      row.installation_price != null ? Number(row.installation_price) : null,
    validTo: row.valid_to,
    isActive: Boolean(row.is_active),
  }));

  const mappedLines = (lines ?? []).map((line) => ({
    id: line.id,
    sortOrder: line.sort_order,
    lineType: line.line_type as QuoteLineType,
    itemCode: line.item_code ?? "",
    category: line.category ?? "",
    description: line.description,
    quantity: Number(line.quantity),
    unit: line.unit,
    costUnitPrice:
      line.cost_unit_price == null ? null : Number(line.cost_unit_price),
    sellUnitPrice: Number(line.sell_unit_price),
    discountPercent: Number(line.discount_percent ?? 0),
    taxCategory: (line.tax_category as "standard" | "exempt" | "zero") || "standard",
    sourceMaterialItemId: line.source_material_item_id ?? null,
    sourceLabourItemId: line.source_labour_item_id ?? null,
    sourceSupplierPriceId: line.source_supplier_price_id ?? null,
    sourcePricingItemId: line.source_pricing_item_id ?? null,
    metadata: (line.metadata as Record<string, unknown>) ?? null,
  }));

  const staleAssessments: ReturnType<typeof assessQuoteLinePriceFreshness>[] = [];
  if (quote.status === "draft" || quote.status === "internal_review") {
    for (const line of mappedLines) {
      const pricingItemId = line.sourcePricingItemId;
      let catalogueItem = null;
      if (pricingItemId) {
        const loaded = await getPricingItemById(pricingItemId);
        if (loaded.ok) catalogueItem = loaded.item;
      }
      staleAssessments.push(
        assessQuoteLinePriceFreshness({
          lineId: line.id,
          sortOrder: line.sortOrder,
          description: line.description,
          sellUnitPrice: line.sellUnitPrice,
          metadata: line.metadata,
          catalogueItem,
        }),
      );
    }
  }

  async function handleSave(formData: FormData) {
    "use server";
    return saveQuoteDraftAction(id, formData);
  }

  async function handleSend(_quoteId: string, payload: SendQuotePayload) {
    "use server";
    const formData = new FormData();
    formData.set("to", payload.to);
    formData.set("cc", payload.cc);
    formData.set("bcc", payload.bcc);
    formData.set("subject", payload.subject);
    formData.set("message", payload.message);
    formData.set("ownerOverride", payload.ownerOverride ? "true" : "false");
    formData.set("testOnly", payload.testOnly ? "true" : "false");
    formData.set("ccAdmin", payload.ccAdmin ? "true" : "false");
    formData.set("attachPdf", payload.attachPdf ? "true" : "false");
    formData.set("includeSecureLink", payload.includeSecureLink ? "true" : "false");
    return sendQuoteFromBuilderAction(id, formData);
  }

  return (
    <QuoteBuilder
      mode="edit"
      showCost={canViewCostMargin(admin.profile.role)}
      canCreateCustomer={canPerform(admin.profile.role, "manageCustomers")}
      canSend={canSendQuote(quote.status, admin.profile.role, {
        ownerOverrideUnapproved: admin.profile.role === "owner",
      })}
      customers={customers ?? []}
      onSave={handleSave}
      onSend={handleSend}
      onSearchRfqs={searchRfqsForImportAction}
      onLoadRfqPreview={fetchRfqImportPreviewAction}
      cancelHref={`/admin/quotes/${id}/`}
      tankModels={tankModels}
      staleAssessments={staleAssessments}
      defaults={{
        quoteId: quote.id,
        quoteNumber: quote.quote_number,
        revisionNumber: quote.revision_number ?? 0,
        status: quote.status as QuoteStatus,
        title: quote.title ?? "",
        customerId: quote.customer_id ?? "",
        rfqId: quote.rfq_id ?? "",
        rfqReference: rfq?.rfq_number ?? "",
        projectReference: quote.project_reference ?? "",
        projectLocation: quote.project_location ?? "",
        serviceRequired: quote.service_required ?? "",
        scopeSummary: quote.scope_summary ?? "",
        projectDescription: quote.project_description ?? "",
        assumptions: quote.assumptions ?? "",
        exclusions: quote.exclusions ?? "",
        paymentTerms: quote.payment_terms ?? "",
        programmeNotes: quote.programme_notes ?? "",
        warrantyWording: quote.warranty_wording ?? "",
        customerMessage: quote.customer_message ?? "",
        internalNotes: quote.internal_notes ?? "",
        issueDate: quote.issue_date,
        validUntil: quote.valid_until,
        discountAmount: Number(quote.discount_amount ?? 0),
        discountType: metaDefaults.discountType,
        discountPercent: metaDefaults.discountPercent,
        discountReason: metaDefaults.discountReason,
        vatRate: Number(quote.vat_rate ?? 15),
        vatPricingMode: metaDefaults.vatPricingMode,
        depositPercent: Number(quote.deposit_percent ?? 0),
        contactName: quote.contact_name ?? "",
        companyName: quote.company_name ?? "",
        email: quote.email ?? "",
        phone: quote.phone ?? "",
        province: quote.province ?? "",
        estimatorConfirmedSuggestions: Boolean(
          calcSnapshot?.estimatorConfirmedSuggestions,
        ),
        hasCalculatorSuggestions: Boolean(quote.rfq_id),
        lines: mappedLines,
      }}
    />
  );
}
