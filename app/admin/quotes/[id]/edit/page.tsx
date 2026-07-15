import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { updateQuoteAction } from "../../actions";
import { canEditQuote, canViewCostMargin } from "@/lib/quotes/workflow";
import { canPerform } from "@/lib/auth/permissions";
import type { QuoteLineType } from "@/lib/quotes/types";

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

  const boundUpdate = updateQuoteAction.bind(null, id);

  return (
    <QuoteBuilder
      mode="edit"
      action={boundUpdate}
      customers={customers ?? []}
      canCreateCustomer={canPerform(admin.profile.role, "manageCustomers")}
      showCost={canViewCostMargin(admin.profile.role)}
      defaults={{
        title: quote.title ?? "",
        customerId: quote.customer_id ?? "",
        rfqId: quote.rfq_id ?? "",
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
        vatRate: Number(quote.vat_rate ?? 15),
        depositPercent: Number(quote.deposit_percent ?? 0),
        contactName: quote.contact_name ?? "",
        companyName: quote.company_name ?? "",
        email: quote.email ?? "",
        phone: quote.phone ?? "",
        province: quote.province ?? "",
        estimatorConfirmedSuggestions: Boolean(
          (quote.calculation_snapshot as { estimatorConfirmedSuggestions?: boolean } | null)
            ?.estimatorConfirmedSuggestions,
        ),
        lines: (lines ?? []).map((line) => ({
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
        })),
      }}
    />
  );
}
