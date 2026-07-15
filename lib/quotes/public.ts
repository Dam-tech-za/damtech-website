import { createHash } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { hashPublicQuoteToken } from "./token";
import { writeQuoteEvent } from "./events";
import { daysRemaining, isQuoteExpiredByDate, normaliseQuoteStatus } from "./types";
import { sendCustomerQuoteEmail, sendInternalQuoteNotification } from "./email";
import { hashIpForAcceptance, summariseUserAgent } from "./token";
import { acceptQuoteSchema, rejectQuoteSchema } from "./schema";
import { formatZar } from "@/lib/estimating/money";
import { formatQuoteNumber } from "./types";

export type PublicQuoteView = {
  quoteNumber: string;
  revisionNumber: number;
  title: string;
  customerName: string;
  projectLocation: string | null;
  issueDate: string;
  validUntil: string;
  daysRemaining: number;
  expired: boolean;
  status: string;
  scopeSummary: string | null;
  assumptions: string | null;
  exclusions: string | null;
  paymentTerms: string | null;
  terms: string | null;
  lines: Array<{
    itemCode: string | null;
    description: string;
    quantity: number;
    unit: string;
    sellUnitPrice: number;
    lineTotalExVat: number;
    lineType: string;
  }>;
  subtotalExVat: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalIncVat: number;
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  hasPdf: boolean;
  canRespond: boolean;
};

async function resolveQuoteByToken(token: string) {
  const hash = hashPublicQuoteToken(token);
  const service = createServiceRoleClient();
  const { data: quoteId } = await service.rpc("get_quote_id_by_token_hash", {
    p_token_hash: hash,
  });

  if (!quoteId) {
    // Fallback direct lookup (covers statuses / RPC gaps during rollout)
    const { data } = await service
      .from("quotes")
      .select("*")
      .eq("public_token_hash", hash)
      .is("public_token_revoked_at", null)
      .maybeSingle();
    if (!data) return null;
    if (
      data.public_token_expires_at &&
      new Date(data.public_token_expires_at) < new Date()
    ) {
      return null;
    }
    return { service, quote: data };
  }

  const { data: quote } = await service
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();

  if (!quote) return null;
  return { service, quote };
}

function toPublicView(
  quote: Record<string, unknown>,
  lines: Array<Record<string, unknown>>,
): PublicQuoteView {
  const status = normaliseQuoteStatus(String(quote.status));
  const validUntil = String(quote.valid_until);
  const expired = isQuoteExpiredByDate(validUntil, status);
  const companySnapshot = (quote.company_snapshot ?? {}) as Record<
    string,
    unknown
  >;
  const termsSnapshot = (quote.terms_snapshot ?? {}) as Record<string, unknown>;

  return {
    quoteNumber: String(quote.quote_number),
    revisionNumber: Number(quote.revision_number ?? 0),
    title: String(quote.title),
    customerName: String(
      quote.company_name || quote.contact_name || "Customer",
    ),
    projectLocation: (quote.project_location as string | null) ?? null,
    issueDate: String(quote.issue_date),
    validUntil,
    daysRemaining: daysRemaining(validUntil),
    expired,
    status,
    scopeSummary: (quote.scope_summary as string | null) ?? null,
    assumptions: (quote.assumptions as string | null) ?? null,
    exclusions: (quote.exclusions as string | null) ?? null,
    paymentTerms: (quote.payment_terms as string | null) ?? null,
    terms:
      (termsSnapshot.companyTerms as string | null) ||
      (termsSnapshot.defaultTerms as string | null) ||
      null,
    lines: lines
      .filter((line) => line.line_type !== "heading" && line.line_type !== "note")
      .map((line) => ({
        itemCode: (line.item_code as string | null) ?? null,
        description: String(line.description),
        quantity: Number(line.quantity),
        unit: String(line.unit),
        sellUnitPrice: Number(line.sell_unit_price),
        lineTotalExVat: Number(line.line_total_ex_vat),
        lineType: String(line.line_type),
      })),
    subtotalExVat: Number(quote.subtotal_ex_vat),
    discountAmount: Number(quote.discount_amount),
    vatRate: Number(quote.vat_rate ?? 15),
    vatAmount: Number(quote.vat_amount),
    totalIncVat: Number(quote.total_inc_vat),
    companyName: String(
      companySnapshot.tradingName ||
        companySnapshot.legalBusinessName ||
        "Damtech",
    ),
    companyPhone: (companySnapshot.phone as string | null) ?? null,
    companyEmail: (companySnapshot.email as string | null) ?? null,
    hasPdf: Boolean(quote.pdf_storage_path),
    canRespond:
      !expired && (status === "sent" || status === "viewed"),
  };
}

export async function loadPublicQuote(
  token: string,
  options: { recordView?: boolean } = {},
): Promise<{ ok: true; view: PublicQuoteView; quoteId: string } | { ok: false; error: string }> {
  const resolved = await resolveQuoteByToken(token);
  if (!resolved) return { ok: false, error: "Quotation not found or link expired." };

  const { service, quote } = resolved;
  const { data: lines } = await service
    .from("quote_line_items")
    .select(
      "item_code, description, quantity, unit, sell_unit_price, line_total_ex_vat, line_type, sort_order",
    )
    .eq("quote_id", quote.id)
    .order("sort_order");

  if (options.recordView) {
    const status = normaliseQuoteStatus(String(quote.status));
    if (status === "sent" || (status === "viewed" && !quote.first_viewed_at)) {
      const patch: Record<string, unknown> = {};
      if (!quote.first_viewed_at) {
        patch.first_viewed_at = new Date().toISOString();
      }
      if (status === "sent") {
        patch.status = "viewed";
      }
      if (Object.keys(patch).length) {
        await service.from("quotes").update(patch).eq("id", quote.id);
        await writeQuoteEvent(service, {
          quoteId: quote.id,
          eventType: "viewed",
          actorType: "customer",
          metadata: { via: "public_token" },
        });
      }
    }
  }

  return {
    ok: true,
    quoteId: quote.id,
    view: toPublicView(quote, lines ?? []),
  };
}

export async function getPublicQuotePdf(
  token: string,
): Promise<
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false; error: string }
> {
  const resolved = await resolveQuoteByToken(token);
  if (!resolved) return { ok: false, error: "Quotation not found or link expired." };
  if (!resolved.quote.pdf_storage_path) {
    return { ok: false, error: "PDF is not available." };
  }

  const { data, error } = await resolved.service.storage
    .from("quote-pdfs")
    .download(String(resolved.quote.pdf_storage_path));

  if (error || !data) return { ok: false, error: "Unable to download PDF." };

  const buffer = Buffer.from(await data.arrayBuffer());
  const fileName = formatQuoteNumber(
    String(resolved.quote.quote_number),
    Number(resolved.quote.revision_number ?? 0),
  ).fileSlug;
  return { ok: true, buffer, fileName };
}

export async function acceptPublicQuote(
  token: string,
  raw: unknown,
  requestMeta: { ip?: string | null; userAgent?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = acceptQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid acceptance." };
  }

  const resolved = await resolveQuoteByToken(token);
  if (!resolved) return { ok: false, error: "Quotation not found or link expired." };

  const status = normaliseQuoteStatus(String(resolved.quote.status));
  if (status !== "sent" && status !== "viewed") {
    return { ok: false, error: "This quotation can no longer be accepted." };
  }
  if (isQuoteExpiredByDate(String(resolved.quote.valid_until), status)) {
    return { ok: false, error: "This quotation has expired." };
  }

  const snapshotHash = createHash("sha256")
    .update(
      JSON.stringify({
        id: resolved.quote.id,
        total: resolved.quote.total_inc_vat,
        revision: resolved.quote.revision_number,
        validUntil: resolved.quote.valid_until,
      }),
    )
    .digest("hex");

  const acceptanceMetadata = {
    acceptorName: parsed.data.acceptorName,
    jobTitle: parsed.data.jobTitle ?? null,
    purchaseOrder: parsed.data.purchaseOrder ?? null,
    note: parsed.data.note ?? null,
    ipHash: hashIpForAcceptance(requestMeta.ip),
    userAgentSummary: summariseUserAgent(requestMeta.userAgent),
    quoteSnapshotHash: snapshotHash,
    wording: "Electronic quotation acceptance",
  };

  const { error } = await resolved.service
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      acceptance_metadata: acceptanceMetadata,
    })
    .eq("id", resolved.quote.id);

  if (error) return { ok: false, error: "Unable to record acceptance." };

  await writeQuoteEvent(resolved.service, {
    quoteId: resolved.quote.id,
    eventType: "accepted",
    actorType: "customer",
    metadata: {
      acceptorName: parsed.data.acceptorName,
      quoteSnapshotHash: snapshotHash,
    },
  });

  const display = formatQuoteNumber(
    String(resolved.quote.quote_number),
    Number(resolved.quote.revision_number ?? 0),
  );

  await sendInternalQuoteNotification({
    subject: `Quote accepted: ${display.label}`,
    body: [
      `Quote ${display.label} was accepted.`,
      `Acceptor: ${parsed.data.acceptorName}`,
      `Total: ${formatZar(Number(resolved.quote.total_inc_vat))}`,
    ].join("\n"),
  });

  if (resolved.quote.email) {
    await sendCustomerQuoteEmail({
      to: String(resolved.quote.email),
      customerName: parsed.data.acceptorName,
      quoteNumber: String(resolved.quote.quote_number),
      revisionNumber: Number(resolved.quote.revision_number ?? 0),
      projectTitle: String(resolved.quote.title),
      totalIncVat: Number(resolved.quote.total_inc_vat),
      validUntil: String(resolved.quote.valid_until),
      message:
        "Thank you. We have recorded your electronic quotation acceptance and the Damtech team will be in touch.",
      secureUrl: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.dam-tech.co.za"}/q/${token}/accepted/`,
      pdf: null,
    });
  }

  return { ok: true };
}

export async function rejectPublicQuote(
  token: string,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = rejectQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rejection." };
  }

  const resolved = await resolveQuoteByToken(token);
  if (!resolved) return { ok: false, error: "Quotation not found or link expired." };

  const status = normaliseQuoteStatus(String(resolved.quote.status));
  if (status !== "sent" && status !== "viewed") {
    return { ok: false, error: "This quotation can no longer be rejected." };
  }

  const { error } = await resolved.service
    .from("quotes")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: parsed.data.reason ?? null,
      metadata: {
        ...(typeof resolved.quote.metadata === "object" && resolved.quote.metadata
          ? (resolved.quote.metadata as object)
          : {}),
        requestRevision: Boolean(parsed.data.requestRevision),
      },
    })
    .eq("id", resolved.quote.id);

  if (error) return { ok: false, error: "Unable to record rejection." };

  await writeQuoteEvent(resolved.service, {
    quoteId: resolved.quote.id,
    eventType: "rejected",
    actorType: "customer",
    metadata: {
      requestRevision: Boolean(parsed.data.requestRevision),
      // Reason kept internal — not returned on public pages
      hasReason: Boolean(parsed.data.reason?.trim()),
    },
  });

  const display = formatQuoteNumber(
    String(resolved.quote.quote_number),
    Number(resolved.quote.revision_number ?? 0),
  );

  await sendInternalQuoteNotification({
    subject: `Quote rejected: ${display.label}`,
    body: [
      `Quote ${display.label} was rejected.`,
      parsed.data.requestRevision ? "Customer requested a revision." : "",
      parsed.data.reason ? `Reason: ${parsed.data.reason}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return { ok: true };
}
