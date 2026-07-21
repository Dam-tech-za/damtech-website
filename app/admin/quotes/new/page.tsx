import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/admin/quotes/QuoteBuilder";
import { getQuoteSettings } from "@/lib/quotes/settings";
import {
  addDaysToIsoDate,
  todayIsoDateJohannesburg,
} from "@/lib/quotes/totals";
import { canViewCostMargin, canSendQuote } from "@/lib/quotes/workflow";
import { canPerform } from "@/lib/auth/permissions";
import { buildRfqImportPreview } from "@/lib/quotes/import-rfq";
import {
  fetchRfqImportPreviewAction,
  saveNewQuoteDraftAction,
  searchRfqsForImportAction,
  sendQuoteFromBuilderAction,
} from "../actions";
import type { SendQuotePayload } from "@/components/admin/quotes/SendQuoteDialog";
import type { QuoteBuilderDefaults } from "@/lib/quotes/quote-builder-types";
import { listActiveTemplatesForSelector } from "@/lib/project-templates/queries";

type PageProps = {
  searchParams: Promise<{ rfqId?: string; customerId?: string }>;
};

export default async function AdminNewQuotePage({ searchParams }: PageProps) {
  const admin = await requireAdmin({ permission: "manageQuotes" });
  const params = await searchParams;
  const supabase = await createClient();
  const settings = await getQuoteSettings();
  const issueDate = todayIsoDateJohannesburg();
  const validity = settings?.default_validity_days ?? 30;

  const { data: customers } = await supabase
    .from("customers")
    .select(
      "id, customer_type, name, company_name, email, phone, vat_number, registration_number, billing_address, site_address, province, notes, created_at, updated_at",
    )
    .order("company_name")
    .limit(500);

  const templates = await listActiveTemplatesForSelector();

  let rfqDefaults: Partial<QuoteBuilderDefaults> = {};
  if (params.rfqId) {
    const preview = await buildRfqImportPreview(params.rfqId);
    if (preview.ok) {
      const p = preview.preview;
      rfqDefaults = {
        customerId: p.customerId,
        rfqId: p.rfqId,
        rfqReference: p.rfqNumber,
        title: p.title,
        projectReference: p.projectReference,
        projectLocation: p.projectLocation,
        serviceRequired: p.serviceRequired,
        projectDescription: p.projectDescription,
        contactName: p.contactName,
        companyName: p.companyName,
        email: p.email,
        phone: p.phone,
        province: p.province,
        lines: p.suggestedLines,
        hasCalculatorSuggestions: p.hasCalculatorSuggestions,
        estimatorConfirmedSuggestions: false,
      };
    }
  } else if (params.customerId) {
    const customer = (customers ?? []).find((row) => row.id === params.customerId);
    if (customer) {
      rfqDefaults = {
        customerId: customer.id,
        contactName: customer.name || "",
        companyName: customer.company_name || customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        province: customer.province || "",
      };
    }
  }

  async function handleSend(quoteId: string, payload: SendQuotePayload) {
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
    return sendQuoteFromBuilderAction(quoteId, formData);
  }

  return (
    <QuoteBuilder
      mode="create"
      showCost={canViewCostMargin(admin.profile.role)}
      canCreateCustomer={canPerform(admin.profile.role, "manageCustomers")}
      canSend={canSendQuote("draft", admin.profile.role, {
        ownerOverrideUnapproved: admin.profile.role === "owner",
      })}
      customers={customers ?? []}
      templates={templates}
      onSave={saveNewQuoteDraftAction}
      onSend={handleSend}
      onSearchRfqs={searchRfqsForImportAction}
      onLoadRfqPreview={fetchRfqImportPreviewAction}
      defaults={{
        title: "",
        customerId: "",
        rfqId: "",
        rfqReference: "",
        projectReference: "",
        projectLocation: "",
        serviceRequired: "",
        scopeSummary: "",
        projectDescription: "",
        assumptions: settings?.default_assumptions ?? "",
        exclusions: settings?.default_exclusions ?? "",
        paymentTerms: settings?.default_payment_terms ?? "",
        programmeNotes: "",
        warrantyWording: "",
        customerMessage: "",
        internalNotes: "",
        issueDate,
        validUntil: addDaysToIsoDate(issueDate, validity),
        discountAmount: 0,
        discountType: "none",
        discountPercent: 0,
        discountReason: "",
        vatRate: Number(settings?.default_vat_rate ?? 15),
        vatPricingMode: "exclusive",
        depositPercent: Number(settings?.default_deposit_percent ?? 0),
        contactName: "",
        companyName: "",
        email: "",
        phone: "",
        province: "",
        lines: [],
        estimatorConfirmedSuggestions: false,
        hasCalculatorSuggestions: false,
        ...rfqDefaults,
      }}
    />
  );
}
