"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDraftQuote, updateDraftQuote } from "@/lib/quotes/save";
import {
  createQuoteRevision,
  duplicateQuote,
  transitionQuoteStatus,
} from "@/lib/quotes/lifecycle";
import { sendQuoteToCustomer } from "@/lib/quotes/send";
import { generateAndStoreQuotePdf, getAdminPdfSignedUrl } from "@/lib/quotes/pdf-service";
import {
  buildRfqImportPreview,
  searchRfqsForImport,
} from "@/lib/quotes/import-rfq";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/quotes/types";
import type { QuoteLineType } from "@/lib/quotes/types";

function formLines(formData: FormData) {
  const raw = formData.get("linesJson");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((line, index) => ({
      id: typeof line.id === "string" ? line.id : undefined,
      sortOrder: Number(line.sortOrder ?? index),
      lineType: (line.lineType as QuoteLineType) || "custom",
      itemCode: (line.itemCode as string) || null,
      category: (line.category as string) || null,
      description: String(line.description ?? ""),
      quantity: Number(line.quantity ?? 1),
      unit: String(line.unit ?? "ea"),
      costUnitPrice:
        line.costUnitPrice === null || line.costUnitPrice === ""
          ? null
          : Number(line.costUnitPrice),
      sellUnitPrice: Number(line.sellUnitPrice ?? 0),
      discountPercent: Number(line.discountPercent ?? 0),
      taxCategory: (line.taxCategory as "standard" | "exempt" | "zero") || "standard",
      sourceMaterialItemId: (line.sourceMaterialItemId as string) || null,
      sourceLabourItemId: (line.sourceLabourItemId as string) || null,
      sourceSupplierPriceId: (line.sourceSupplierPriceId as string) || null,
      sourcePricingItemId: (line.sourcePricingItemId as string) || null,
      metadata: (line.metadata as Record<string, unknown>) || null,
    }));
  } catch {
    return [];
  }
}

function quotePayloadFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") || ""),
    customerId: String(formData.get("customerId") || ""),
    rfqId: String(formData.get("rfqId") || "") || null,
    projectReference: String(formData.get("projectReference") || "") || null,
    projectLocation: String(formData.get("projectLocation") || "") || null,
    serviceRequired: String(formData.get("serviceRequired") || "") || null,
    scopeSummary: String(formData.get("scopeSummary") || "") || null,
    projectDescription: String(formData.get("projectDescription") || "") || null,
    assumptions: String(formData.get("assumptions") || "") || null,
    exclusions: String(formData.get("exclusions") || "") || null,
    paymentTerms: String(formData.get("paymentTerms") || "") || null,
    programmeNotes: String(formData.get("programmeNotes") || "") || null,
    warrantyWording: String(formData.get("warrantyWording") || "") || null,
    customerMessage: String(formData.get("customerMessage") || "") || null,
    internalNotes: String(formData.get("internalNotes") || "") || null,
    issueDate: String(formData.get("issueDate") || ""),
    validUntil: String(formData.get("validUntil") || ""),
    discountAmount: Number(formData.get("discountAmount") || 0),
    discountType: String(formData.get("discountType") || "amount"),
    discountPercent: Number(formData.get("discountPercent") || 0),
    discountReason: String(formData.get("discountReason") || "") || null,
    vatRate: Number(formData.get("vatRate") || 15),
    vatPricingMode: String(formData.get("vatPricingMode") || "exclusive"),
    depositPercent: Number(formData.get("depositPercent") || 0),
    contactName: String(formData.get("contactName") || "") || null,
    companyName: String(formData.get("companyName") || "") || null,
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    province: String(formData.get("province") || "") || null,
    estimatorConfirmedSuggestions:
      formData.get("estimatorConfirmedSuggestions") === "on" ||
      formData.get("estimatorConfirmedSuggestions") === "true",
    projectTemplateId: String(formData.get("projectTemplateId") || "") || null,
    projectTemplateVersionId:
      String(formData.get("projectTemplateVersionId") || "") || null,
    projectTemplateSnapshot: parseJsonRecord(formData.get("projectTemplateSnapshot")),
    manualRfqReference: String(formData.get("manualRfqReference") || "") || null,
    rfqReferenceSnapshot: String(formData.get("rfqReferenceSnapshot") || "") || null,
    projectFieldValues: parseStringRecord(formData.get("projectFieldValues")),
    contentReviewed:
      formData.get("contentReviewed") === "on" ||
      formData.get("contentReviewed") === "true",
    lines: formLines(formData),
  };
}

function parseStringRecord(
  raw: FormDataEntryValue | null,
): Record<string, string> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
      else if (value != null) out[key] = String(value);
    }
    return out;
  } catch {
    return null;
  }
}

function parseJsonRecord(raw: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function createQuoteAction(formData: FormData) {
  const result = await createDraftQuote(quotePayloadFromForm(formData));
  if (!result.ok) {
    return result;
  }
  revalidatePath("/admin/quotes/");
  redirect(`/admin/quotes/${result.quoteId}/`);
}

export async function saveNewQuoteDraftAction(formData: FormData) {
  const result = await createDraftQuote(quotePayloadFromForm(formData));
  if (!result.ok) return result;
  revalidatePath("/admin/quotes/");
  return { ok: true as const, quoteId: result.quoteId, quoteNumber: result.quoteNumber };
}

export async function saveQuoteDraftAction(quoteId: string, formData: FormData) {
  const result = await updateDraftQuote(quoteId, quotePayloadFromForm(formData));
  if (!result.ok) return result;
  revalidatePath("/admin/quotes/");
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath(`/admin/quotes/${quoteId}/edit/`);
  return { ok: true as const, quoteId: result.quoteId, quoteNumber: result.quoteNumber };
}

export async function sendQuoteFromBuilderAction(
  quoteId: string,
  formData: FormData,
) {
  const recipientEmail = String(formData.get("to") || "") || undefined;
  const cc = String(formData.get("cc") || "") || undefined;
  const bcc = String(formData.get("bcc") || "") || undefined;
  const subject = String(formData.get("subject") || "") || undefined;
  const message = String(formData.get("message") || "") || undefined;
  const ownerOverride = formData.get("ownerOverride") === "true";
  const testOnly = formData.get("testOnly") === "true";
  const ccAdmin = formData.get("ccAdmin") !== "false";
  const attachPdf = formData.get("attachPdf") !== "false";
  const includeSecureLink = formData.get("includeSecureLink") !== "false";

  const result = await sendQuoteToCustomer(quoteId, {
    recipientEmail,
    cc,
    bcc,
    subject,
    message,
    ownerOverride,
    testOnly,
    ccAdmin,
    attachPdf,
    includeSecureLink,
  });
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath("/admin/quotes/");
  return result;
}

export async function updateQuoteAction(quoteId: string, formData: FormData) {
  const result = await updateDraftQuote(quoteId, quotePayloadFromForm(formData));
  if (!result.ok) return result;
  revalidatePath("/admin/quotes/");
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath(`/admin/quotes/${quoteId}/edit/`);
  redirect(`/admin/quotes/${quoteId}/`);
}

export async function transitionQuoteAction(
  quoteId: string,
  toStatus: QuoteStatus,
  reason?: string,
) {
  const result = await transitionQuoteStatus(quoteId, toStatus, { reason });
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath("/admin/quotes/");
  return result;
}

export async function reviseQuoteAction(quoteId: string, formData: FormData) {
  const reason = String(formData.get("reason") || "Revision requested");
  const result = await createQuoteRevision(quoteId, reason);
  if (!result.ok) return result;
  revalidatePath("/admin/quotes/");
  redirect(`/admin/quotes/${result.quoteId}/edit/`);
}

export async function duplicateQuoteAction(quoteId: string) {
  const result = await duplicateQuote(quoteId);
  if (!result.ok) return result;
  revalidatePath("/admin/quotes/");
  redirect(`/admin/quotes/${result.quoteId}/edit/`);
}

export async function sendQuoteAction(quoteId: string, formData: FormData) {
  const recipientEmail = String(formData.get("recipientEmail") || "") || undefined;
  const ownerOverride = formData.get("ownerOverride") === "on";
  const resend = formData.get("resend") === "on";
  const result = await sendQuoteToCustomer(quoteId, {
    recipientEmail,
    ownerOverride,
    resend,
  });
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath("/admin/quotes/");
  return result;
}

export async function generatePdfAction(quoteId: string) {
  const result = await generateAndStoreQuotePdf(quoteId);
  revalidatePath(`/admin/quotes/${quoteId}/`);
  revalidatePath(`/admin/quotes/${quoteId}/preview/`);
  return result.ok
    ? { ok: true as const, fileName: result.fileName }
    : result;
}

export async function getPdfUrlAction(quoteId: string) {
  return getAdminPdfSignedUrl(quoteId);
}

export async function revokePublicTokenAction(quoteId: string) {
  try {
    const admin = await assertAdmin({ permission: "sendQuotes" });
    const supabase = await createClient();
    await supabase
      .from("quotes")
      .update({ public_token_revoked_at: new Date().toISOString() })
      .eq("id", quoteId);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_token_revoked",
      entityType: "quote",
      entityId: quoteId,
    });
    revalidatePath(`/admin/quotes/${quoteId}/`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to revoke token.",
    };
  }
}

export async function searchRfqsForImportAction(query: string) {
  return searchRfqsForImport(query);
}

export async function fetchRfqImportPreviewAction(
  rfqId: string,
  currentCustomerId?: string,
) {
  return buildRfqImportPreview(rfqId, { currentCustomerId });
}

export async function updateCompanySettingsAction(formData: FormData) {
  const admin = await assertAdmin({ permission: "manageSettings" });
  const supabase = await createClient();
  const bankingAllowed =
    admin.profile.role === "owner" || admin.profile.role === "admin";

  const patch: Record<string, unknown> = {
    legal_business_name: String(formData.get("legalBusinessName") || ""),
    trading_name: String(formData.get("tradingName") || "") || null,
    registration_number: String(formData.get("registrationNumber") || "") || null,
    vat_number: String(formData.get("vatNumber") || "") || null,
    address_line1: String(formData.get("addressLine1") || "") || null,
    address_line2: String(formData.get("addressLine2") || "") || null,
    city: String(formData.get("city") || "") || null,
    province: String(formData.get("province") || "") || null,
    postal_code: String(formData.get("postalCode") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    website: String(formData.get("website") || "") || null,
    quote_footer: String(formData.get("quoteFooter") || "") || null,
    terms_and_conditions: String(formData.get("termsAndConditions") || "") || null,
    updated_by: admin.user.id,
  };

  if (bankingAllowed) {
    patch.bank_name = String(formData.get("bankName") || "") || null;
    patch.bank_account_name = String(formData.get("bankAccountName") || "") || null;
    patch.bank_account_number = String(formData.get("bankAccountNumber") || "") || null;
    patch.bank_branch_code = String(formData.get("bankBranchCode") || "") || null;
    patch.bank_swift = String(formData.get("bankSwift") || "") || null;
  }

  const { error } = await supabase
    .from("company_settings")
    .update(patch)
    .eq("id", 1);

  if (error) return { ok: false as const, error: error.message };
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "company_settings_updated",
    entityType: "company_settings",
    entityId: "1",
  });
  revalidatePath("/admin/settings/company/");
  return { ok: true as const };
}

export async function updateQuoteSettingsAction(formData: FormData) {
  const admin = await assertAdmin({ permission: "manageQuoteNumbering" });
  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_settings")
    .update({
      number_prefix: String(formData.get("numberPrefix") || "DT-Q"),
      yearly_reset: formData.get("yearlyReset") === "on",
      default_validity_days: Number(formData.get("defaultValidityDays") || 30),
      default_vat_rate: Number(formData.get("defaultVatRate") || 15),
      default_payment_terms: String(formData.get("defaultPaymentTerms") || "") || null,
      default_deposit_percent: Number(formData.get("defaultDepositPercent") || 0),
      default_terms: String(formData.get("defaultTerms") || "") || null,
      default_exclusions: String(formData.get("defaultExclusions") || "") || null,
      default_assumptions: String(formData.get("defaultAssumptions") || "") || null,
      minimum_gross_margin_percent: Number(
        formData.get("minimumGrossMarginPercent") || 15,
      ),
      approval_threshold_total:
        String(formData.get("approvalThresholdTotal") || "") === ""
          ? null
          : Number(formData.get("approvalThresholdTotal")),
      public_token_ttl_days: Number(formData.get("publicTokenTtlDays") || 60),
      updated_by: admin.user.id,
    })
    .eq("id", 1);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/settings/quotes/");
  return { ok: true as const };
}

export async function updatePdfSettingsAction(formData: FormData) {
  const admin = await assertAdmin({ permission: "manageSettings" });
  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_pdf_settings")
    .update({
      brand_primary_hex: String(formData.get("brandPrimaryHex") || "#1B4D3E"),
      brand_accent_hex: String(formData.get("brandAccentHex") || "#C4A35A"),
      header_style: String(formData.get("headerStyle") || "classic"),
      footer_style: String(formData.get("footerStyle") || "classic"),
      show_signature_block: formData.get("showSignatureBlock") === "on",
      show_page_numbers: formData.get("showPageNumbers") === "on",
      terms_location: String(formData.get("termsLocation") || "end"),
      show_banking_details: formData.get("showBankingDetails") === "on",
      updated_by: admin.user.id,
    })
    .eq("id", 1);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/settings/pdf/");
  return { ok: true as const };
}
