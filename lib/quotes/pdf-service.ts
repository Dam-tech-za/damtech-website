import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  buildCompanySnapshot,
  getCompanySettings,
  getQuotePdfSettings,
} from "./settings";
import {
  quotePdfFileName,
  renderQuotePdfBuffer,
  type QuotePdfPayload,
} from "./pdf";
import { pickCustomerContent } from "./content-sections";

export async function buildQuotePdfPayload(
  quoteId: string,
): Promise<{ ok: true; payload: QuotePdfPayload; quote: Record<string, unknown> } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();

  if (error || !quote) return { ok: false, error: "Quote not found." };

  const { data: lines } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");

  const companyRow = await getCompanySettings();
  const pdfSettings = await getQuotePdfSettings();
  const snapshot =
    (quote.company_snapshot as ReturnType<typeof buildCompanySnapshot> | null) ??
    (companyRow ? buildCompanySnapshot(companyRow) : null);

  if (!snapshot) {
    return { ok: false, error: "Company settings are required before PDF generation." };
  }

  const customerName =
    quote.company_name ||
    quote.contact_name ||
    "Customer";

  // Enforced mapping — customer-facing sections only, never internal_notes.
  const content = pickCustomerContent(quote);

  const payload: QuotePdfPayload = {
    quoteNumber: quote.quote_number,
    revisionNumber: quote.revision_number ?? 0,
    title: quote.title,
    issueDate: quote.issue_date,
    validUntil: quote.valid_until,
    customerName,
    projectLocation: quote.project_location,
    scopeSummary: content.scopeSummary,
    assumptions: content.assumptions,
    exclusions: content.exclusions,
    customerMessage: content.customerMessage,
    paymentTerms: quote.payment_terms,
    programmeNotes: quote.programme_notes,
    warrantyWording: content.warrantyWording,
    lines: (lines ?? []).map((line) => ({
      itemCode: line.item_code,
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      sellUnitPrice: Number(line.sell_unit_price),
      lineTotalExVat: Number(line.line_total_ex_vat),
      lineType: line.line_type,
    })),
    subtotalExVat: Number(quote.subtotal_ex_vat),
    discountAmount: Number(quote.discount_amount),
    vatRate: Number(quote.vat_rate ?? 15),
    vatAmount: Number(quote.vat_amount),
    totalIncVat: Number(quote.total_inc_vat),
    company: snapshot,
    showBankingDetails: pdfSettings?.show_banking_details ?? true,
    brandPrimaryHex: pdfSettings?.brand_primary_hex,
  };

  return { ok: true, payload, quote };
}

export async function generateAndStoreQuotePdf(
  quoteId: string,
): Promise<
  | { ok: true; storagePath: string; buffer: Buffer; fileName: string }
  | { ok: false; error: string }
> {
  try {
    await assertAdmin({ permission: "manageQuotes" });
    const built = await buildQuotePdfPayload(quoteId);
    if (!built.ok) return built;

    const buffer = await renderQuotePdfBuffer(built.payload);
    const fileName = quotePdfFileName(
      built.payload.quoteNumber,
      built.payload.revisionNumber,
    );
    const storagePath = `${quoteId}/${fileName}`;

    const service = createServiceRoleClient();
    const { error: uploadError } = await service.storage
      .from("quote-pdfs")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[pdf] upload failed:", uploadError.message);
      return { ok: false, error: "PDF generated but storage upload failed." };
    }

    const supabase = await createClient();
    await supabase
      .from("quotes")
      .update({
        pdf_storage_path: storagePath,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    return { ok: true, storagePath, buffer, fileName };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    console.error("[pdf] unexpected:", error);
    return { ok: false, error: "Unable to generate PDF." };
  }
}

export async function getAdminPdfSignedUrl(
  quoteId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const supabase = await createClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("pdf_storage_path")
      .eq("id", quoteId)
      .maybeSingle();

    if (!quote?.pdf_storage_path) {
      return { ok: false, error: "No PDF stored for this quote." };
    }

    const service = createServiceRoleClient();
    const { data, error } = await service.storage
      .from("quote-pdfs")
      .createSignedUrl(quote.pdf_storage_path, 60 * 15);

    if (error || !data?.signedUrl) {
      return { ok: false, error: "Unable to create download URL." };
    }
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to create download URL." };
  }
}
