import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { writeQuoteEvent } from "./events";
import { buildCompanySnapshot, getCompanySettings, getQuoteSettings } from "./settings";
import { canCreateRevision, canDuplicateQuote, canTransition } from "./workflow";
import type { QuoteStatus } from "./types";

export async function transitionQuoteStatus(
  quoteId: string,
  toStatus: QuoteStatus,
  options: { reason?: string; overrideSend?: boolean } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const permission =
      toStatus === "approved"
        ? "approveQuotes"
        : toStatus === "sent"
          ? "sendQuotes"
          : "manageQuotes";
    const admin = await assertAdmin({ permission });
    const supabase = await createClient();

    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (error || !quote) return { ok: false, error: "Quote not found." };

    if (toStatus === "sent" && options.overrideSend) {
      if (admin.profile.role !== "owner") {
        return { ok: false, error: "Only the owner may override send rules." };
      }
    } else if (!canTransition(quote.status, toStatus)) {
      return {
        ok: false,
        error: `Cannot move from ${quote.status} to ${toStatus}.`,
      };
    }

    const patch: Record<string, unknown> = { status: toStatus };
    if (toStatus === "approved") {
      const { data: lines } = await supabase
        .from("quote_line_items")
        .select("description, sell_unit_price, metadata")
        .eq("quote_id", quoteId);
      const unresolved = (lines ?? []).filter((line) => {
        const meta = (line.metadata ?? {}) as { priceRequired?: boolean };
        const flagged =
          meta.priceRequired === true ||
          String(line.description || "").includes("PRICE REQUIRED");
        return flagged && !(Number(line.sell_unit_price) > 0);
      });
      if (unresolved.length) {
        return {
          ok: false,
          error: `${unresolved.length} line(s) still flagged PRICE REQUIRED. Resolve from the pricing library or enter an authorised manual price before approval.`,
        };
      }

      patch.approved_by = admin.user.id;
      patch.approved_at = new Date().toISOString();
      const company = await getCompanySettings();
      const quoteSettings = await getQuoteSettings();
      if (company) {
        patch.company_snapshot = buildCompanySnapshot(company);
      }
      patch.terms_snapshot = {
        paymentTerms: quote.payment_terms,
        assumptions: quote.assumptions,
        exclusions: quote.exclusions,
        defaultTerms: quoteSettings?.default_terms ?? null,
        companyTerms: company?.terms_and_conditions ?? null,
        capturedAt: new Date().toISOString(),
      };
      patch.customer_snapshot = {
        companyName: quote.company_name,
        contactName: quote.contact_name,
        email: quote.email,
        phone: quote.phone,
        province: quote.province,
      };
    }
    if (toStatus === "cancelled" && options.reason) {
      patch.metadata = {
        ...(typeof quote.metadata === "object" && quote.metadata
          ? quote.metadata
          : {}),
        cancelReason: options.reason,
      };
    }

    const { error: updateError } = await supabase
      .from("quotes")
      .update(patch)
      .eq("id", quoteId);

    if (updateError) return { ok: false, error: "Unable to update status." };

    await writeQuoteEvent(supabase, {
      quoteId,
      eventType: `status_${toStatus}`,
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { from: quote.status, to: toStatus, reason: options.reason },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_status_changed",
      entityType: "quote",
      entityId: quoteId,
      beforeData: { status: quote.status },
      afterData: { status: toStatus },
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to change quote status." };
  }
}

export async function createQuoteRevision(
  quoteId: string,
  reason: string,
): Promise<
  | { ok: true; quoteId: string; quoteNumber: string; revisionNumber: number }
  | { ok: false; error: string }
> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    const supabase = await createClient();

    const { data: source, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (error || !source) return { ok: false, error: "Quote not found." };
    if (!canCreateRevision(source.status, admin.profile.role)) {
      return { ok: false, error: "Revision is not allowed for this status." };
    }

    const { data: lines } = await supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("sort_order");

    const nextRevision = Number(source.revision_number ?? 0) + 1;

    const { data: created, error: insertError } = await supabase
      .from("quotes")
      .insert({
        quote_number: source.quote_number,
        revision_number: nextRevision,
        parent_quote_id: source.id,
        rfq_id: source.rfq_id,
        customer_id: source.customer_id,
        status: "draft",
        title: source.title,
        project_reference: source.project_reference,
        project_location: source.project_location,
        service_required: source.service_required,
        scope_summary: source.scope_summary,
        project_description: source.project_description,
        assumptions: source.assumptions,
        exclusions: source.exclusions,
        payment_terms: source.payment_terms,
        programme_notes: source.programme_notes,
        warranty_wording: source.warranty_wording,
        customer_message: source.customer_message,
        internal_notes: source.internal_notes,
        contact_name: source.contact_name,
        company_name: source.company_name,
        email: source.email,
        phone: source.phone,
        province: source.province,
        currency: source.currency,
        issue_date: source.issue_date,
        valid_until: source.valid_until,
        validity_days: source.validity_days,
        expires_at: source.expires_at,
        subtotal_ex_vat: source.subtotal_ex_vat,
        discount_amount: source.discount_amount,
        net_ex_vat: source.net_ex_vat,
        vat_rate: source.vat_rate,
        vat_amount: source.vat_amount,
        total_inc_vat: source.total_inc_vat,
        direct_cost: source.direct_cost,
        gross_profit: source.gross_profit,
        gross_margin_percent: source.gross_margin_percent,
        deposit_percent: source.deposit_percent,
        terms_snapshot: source.terms_snapshot,
        company_snapshot: source.company_snapshot,
        customer_snapshot: source.customer_snapshot,
        calculation_snapshot: source.calculation_snapshot,
        calculator_type: source.calculator_type,
        calculator_input: source.calculator_input,
        calculator_result: source.calculator_result,
        line_items: [],
        created_by: admin.user.id,
        assigned_to: source.assigned_to ?? admin.user.id,
        is_latest_revision: true,
        revision_reason: reason,
        public_token_hash: null,
        public_token_expires_at: null,
        public_token_revoked_at: null,
        sent_at: null,
        first_viewed_at: null,
        accepted_at: null,
        rejected_at: null,
        rejection_reason: null,
        acceptance_metadata: null,
        pdf_storage_path: null,
        pdf_generated_at: null,
      })
      .select("id, quote_number, revision_number")
      .single();

    if (insertError || !created) {
      console.error("[quotes] revision insert:", insertError?.message);
      return { ok: false, error: "Unable to create revision." };
    }

    if (lines?.length) {
      await supabase.from("quote_line_items").insert(
        lines.map((line) => ({
          quote_id: created.id,
          sort_order: line.sort_order,
          line_type: line.line_type,
          item_code: line.item_code,
          category: line.category,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          cost_unit_price: line.cost_unit_price,
          sell_unit_price: line.sell_unit_price,
          discount_percent: line.discount_percent,
          tax_category: line.tax_category,
          line_total_ex_vat: line.line_total_ex_vat,
          metadata: line.metadata,
          source_material_item_id: line.source_material_item_id,
          source_labour_item_id: line.source_labour_item_id,
          source_supplier_price_id: line.source_supplier_price_id,
        })),
      );
    }

    await supabase
      .from("quotes")
      .update({ status: "superseded", is_latest_revision: false })
      .eq("id", source.id);

    await writeQuoteEvent(supabase, {
      quoteId: source.id,
      eventType: "superseded",
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { revision_id: created.id, reason },
    });
    await writeQuoteEvent(supabase, {
      quoteId: created.id,
      eventType: "revision_created",
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { from_quote_id: source.id, reason },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_revision_created",
      entityType: "quote",
      entityId: created.id,
      beforeData: { quote_id: source.id, status: source.status },
      afterData: {
        quote_number: created.quote_number,
        revision_number: created.revision_number,
      },
    });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_superseded",
      entityType: "quote",
      entityId: source.id,
      afterData: { superseded_by: created.id },
    });

    return {
      ok: true,
      quoteId: created.id,
      quoteNumber: created.quote_number,
      revisionNumber: created.revision_number,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to create revision." };
  }
}

export async function duplicateQuote(
  quoteId: string,
): Promise<
  | { ok: true; quoteId: string; quoteNumber: string }
  | { ok: false; error: string }
> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    if (!canDuplicateQuote(admin.profile.role)) {
      return { ok: false, error: "Not allowed." };
    }

    const supabase = await createClient();
    const { data: source } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .maybeSingle();

    if (!source) return { ok: false, error: "Quote not found." };

    const { data: lines } = await supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("sort_order");

    const service = createServiceRoleClient();
    const { data: quoteNumber, error: numberError } = await service.rpc(
      "next_quote_number",
    );
    if (numberError || typeof quoteNumber !== "string") {
      return { ok: false, error: "Unable to allocate quote number." };
    }

    const { data: created, error } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        revision_number: 0,
        rfq_id: source.rfq_id,
        customer_id: source.customer_id,
        status: "draft",
        title: `${source.title} (copy)`,
        project_reference: source.project_reference,
        project_location: source.project_location,
        service_required: source.service_required,
        scope_summary: source.scope_summary,
        project_description: source.project_description,
        assumptions: source.assumptions,
        exclusions: source.exclusions,
        payment_terms: source.payment_terms,
        programme_notes: source.programme_notes,
        warranty_wording: source.warranty_wording,
        customer_message: source.customer_message,
        internal_notes: source.internal_notes,
        contact_name: source.contact_name,
        company_name: source.company_name,
        email: source.email,
        phone: source.phone,
        province: source.province,
        currency: source.currency ?? "ZAR",
        issue_date: source.issue_date,
        valid_until: source.valid_until,
        validity_days: source.validity_days,
        expires_at: source.expires_at,
        subtotal_ex_vat: source.subtotal_ex_vat,
        discount_amount: source.discount_amount,
        net_ex_vat: source.net_ex_vat,
        vat_rate: source.vat_rate,
        vat_amount: source.vat_amount,
        total_inc_vat: source.total_inc_vat,
        direct_cost: source.direct_cost,
        gross_profit: source.gross_profit,
        gross_margin_percent: source.gross_margin_percent,
        deposit_percent: source.deposit_percent,
        line_items: [],
        created_by: admin.user.id,
        assigned_to: admin.user.id,
        is_latest_revision: true,
        duplicated_from_quote_id: source.id,
        metadata: { duplicatedFrom: source.id },
      })
      .select("id, quote_number")
      .single();

    if (error || !created) {
      return { ok: false, error: "Unable to duplicate quote." };
    }

    if (lines?.length) {
      await supabase.from("quote_line_items").insert(
        lines.map((line) => ({
          quote_id: created.id,
          sort_order: line.sort_order,
          line_type: line.line_type,
          item_code: line.item_code,
          category: line.category,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          cost_unit_price: line.cost_unit_price,
          sell_unit_price: line.sell_unit_price,
          discount_percent: line.discount_percent,
          tax_category: line.tax_category,
          line_total_ex_vat: line.line_total_ex_vat,
          metadata: line.metadata,
          source_material_item_id: line.source_material_item_id,
          source_labour_item_id: line.source_labour_item_id,
          source_supplier_price_id: line.source_supplier_price_id,
        })),
      );
    }

    await writeQuoteEvent(supabase, {
      quoteId: created.id,
      eventType: "duplicated",
      actorType: "admin",
      actorUserId: admin.user.id,
      metadata: { from_quote_id: source.id },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "quote_duplicated",
      entityType: "quote",
      entityId: created.id,
      afterData: {
        quote_number: created.quote_number,
        from: source.id,
      },
    });

    return { ok: true, quoteId: created.id, quoteNumber: created.quote_number };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to duplicate quote." };
  }
}
