import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import {
  buildCompanySnapshot,
  getCompanySettings,
  getQuoteSettings,
} from "./settings";
import { generateAndStoreQuotePdf } from "./pdf-service";
import { sendCustomerQuoteEmail } from "./email";
import { getQuoteAdminCcEmail } from "@/lib/email/config";
import { generatePublicQuoteToken, hashPublicQuoteToken } from "./token";
import { writeQuoteEvent } from "./events";
import { canSendQuote } from "./workflow";
import { formatQuoteNumber } from "./types";

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za"
  );
}

export async function sendQuoteToCustomer(
  quoteId: string,
  options: {
    recipientEmail?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    message?: string;
    ownerOverride?: boolean;
    resend?: boolean;
    testOnly?: boolean;
    ccAdmin?: boolean;
    attachPdf?: boolean;
    includeSecureLink?: boolean;
  } = {},
): Promise<{ ok: true; secureUrl: string } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin({ permission: "sendQuotes" });
    const supabase = await createClient();

    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (error || !quote) return { ok: false, error: "Quote not found." };

    if (
      !canSendQuote(quote.status, admin.profile.role, {
        ownerOverrideUnapproved: options.ownerOverride,
      })
    ) {
      return {
        ok: false,
        error:
          "Quote must be approved before sending (owner override required otherwise).",
      };
    }

    const recipient =
      options.recipientEmail?.trim() ||
      (typeof quote.email === "string" ? quote.email.trim() : "");
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return { ok: false, error: "A valid recipient email is required." };
    }

    const testOnly = Boolean(options.testOnly);
    const deliveryEmail = testOnly ? admin.user.email ?? recipient : recipient;
    const ccList = [
      ...(options.cc
        ? options.cc.split(",").map((value) => value.trim()).filter(Boolean)
        : []),
      ...(options.ccAdmin !== false ? [getQuoteAdminCcEmail()] : []),
    ];

    const company = await getCompanySettings();
    const quoteSettings = await getQuoteSettings();
    if (!company) {
      return { ok: false, error: "Company settings must be configured first." };
    }

    const companySnapshot = buildCompanySnapshot(company);
    const customerSnapshot = {
      companyName: quote.company_name,
      contactName: quote.contact_name,
      email: recipient,
      phone: quote.phone,
      province: quote.province,
      vatNumber: null,
    };
    const termsSnapshot = {
      paymentTerms: quote.payment_terms,
      assumptions: quote.assumptions,
      exclusions: quote.exclusions,
      defaultTerms: quoteSettings?.default_terms ?? null,
      companyTerms: company.terms_and_conditions,
      capturedAt: new Date().toISOString(),
    };

    const pdf = await generateAndStoreQuotePdf(quoteId);
    if (!pdf.ok) return pdf;

    const token = generatePublicQuoteToken();
    const tokenHash = hashPublicQuoteToken(token);
    const ttlDays = quoteSettings?.public_token_ttl_days ?? 60;
    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + ttlDays);

    // Persist token + snapshots BEFORE email so failures don't leave a sent quote.
    const { error: tokenError } = await supabase
      .from("quotes")
      .update({
        public_token_hash: tokenHash,
        public_token_expires_at: tokenExpires.toISOString(),
        public_token_revoked_at: null,
        company_snapshot: companySnapshot,
        customer_snapshot: customerSnapshot,
        terms_snapshot: termsSnapshot,
        status: quote.status === "approved" || options.ownerOverride
          ? quote.status
          : quote.status,
      })
      .eq("id", quoteId);

    if (tokenError) {
      return { ok: false, error: "Unable to prepare secure quote token." };
    }

    const secureUrl = `${siteOrigin()}/q/${token}/`;
    const display = formatQuoteNumber(
      quote.quote_number,
      quote.revision_number ?? 0,
    );

    const emailResult = await sendCustomerQuoteEmail({
      to: deliveryEmail,
      cc: ccList,
      bcc: options.bcc
        ? options.bcc.split(",").map((value) => value.trim()).filter(Boolean)
        : undefined,
      customerName: quote.contact_name || quote.company_name || "Customer",
      quoteNumber: quote.quote_number,
      revisionNumber: quote.revision_number ?? 0,
      projectTitle: quote.title,
      totalIncVat: Number(quote.total_inc_vat),
      validUntil: quote.valid_until,
      message: options.message ?? quote.customer_message,
      subject: options.subject,
      secureUrl,
      pdf: { fileName: pdf.fileName, content: pdf.buffer },
      attachPdf: options.attachPdf,
      includeSecureLink: options.includeSecureLink,
    });

    if (!emailResult.ok) {
      if (!testOnly) {
        await supabase
          .from("quotes")
          .update({
            public_token_revoked_at: new Date().toISOString(),
          })
          .eq("id", quoteId);
      }

      await writeQuoteEvent(supabase, {
        quoteId,
        eventType: testOnly ? "email_test_failed" : "send_failed",
        actorType: "admin",
        actorUserId: admin.user.id,
        metadata: { error: emailResult.error },
      });

      return { ok: false, error: emailResult.error };
    }

    if (testOnly) {
      await writeQuoteEvent(supabase, {
        quoteId,
        eventType: "email_test_sent",
        actorType: "admin",
        actorUserId: admin.user.id,
        metadata: { recipient: deliveryEmail, messageId: emailResult.messageId },
      });
      return { ok: true, secureUrl };
    }

    const { error: sentError } = await supabase
      .from("quotes")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (sentError) {
      return {
        ok: false,
        error: "Email sent but status update failed — check quote manually.",
      };
    }

    await supabase.from("quote_communications").insert({
      quote_id: quoteId,
      communication_type: options.resend ? "quote_email_resend" : "quote_email",
      recipient_email: recipient,
      subject:
        options.subject ??
        `Damtech Quotation ${quote.quote_number} — ${quote.title}`,
      provider_message_id: emailResult.messageId,
      status: "sent",
      sent_by: admin.user.id,
      metadata: { secureUrlHost: siteOrigin(), display: display.label },
    });

    await writeQuoteEvent(supabase, {
      quoteId,
      eventType: options.resend ? "email_resent" : "email_sent",
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { recipient, messageId: emailResult.messageId },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: options.resend ? "quote_email_resent" : "quote_email_sent",
      entityType: "quote",
      entityId: quoteId,
      afterData: { recipient, status: "sent" },
    });

    return { ok: true, secureUrl };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    console.error("[quotes] send unexpected:", error);
    return { ok: false, error: "Unable to send quote." };
  }
}
