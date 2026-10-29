/**
 * The one way the website reads a Xero document and its customer:
 * document number → the ContactID on that document → that contact.
 *
 * It calls only the bridge's `get_document_with_contact` (xero-bridge v7+),
 * which looks the document up by number, reads the ContactID on it, fetches
 * Contacts/{id} and checks the ids match. Nothing here searches contacts by
 * name, takes the first contact of a list, or falls back to anything else:
 * that is how K&S49 Trading landed on every project. Server-only.
 */

import { XeroBridgeError, type XeroBridgeClient } from "./xero-bridge.ts";
import { BLOCKED_XERO_CONTACT_IDS, mapXeroContact, type XeroContactExtras } from "./xero-contact.ts";

export type XeroDocumentKind = "quote" | "invoice";

export type XeroDocument = {
  id: string;
  number: string;
  status: string | null;
  date: string | null;
  dueOrExpiry: string | null;
  title: string | null;
  reference: string | null;
  total: number | null;
};

export type XeroDocumentWithContact = {
  kind: XeroDocumentKind;
  document: XeroDocument;
  /** The ContactID printed on the document. */
  contactId: string;
  contact: XeroContactExtras;
};

export class XeroDocumentError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "XeroDocumentError";
    this.status = status;
  }
}

/** "qu-0348" / "QU 0348" → "QU0348". */
export function normaliseDocumentNumber(raw: string): string {
  return raw.replace(/[-\s]/g, "").toUpperCase();
}

export function documentKindOf(number: string): XeroDocumentKind | null {
  const n = normaliseDocumentNumber(number);
  if (/^INV\d+$/.test(n)) return "invoice";
  if (/^QU\d+$/.test(n)) return "quote";
  return null;
}

type RawResponse = {
  kind?: string;
  number?: string;
  document?: Record<string, unknown> | null;
  contact_id?: string | null;
  contact?: unknown;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);

const DEFAULT_BUDGET_MS = 8_000;

function friendly(error: unknown, number: string): XeroDocumentError {
  if (error instanceof XeroDocumentError) return error;
  if (error instanceof XeroBridgeError) {
    const text = error.message.replace(/^Xero bridge:\s*/, "");
    if (error.status === 404 || /not allowed|unknown tool|no such tool/i.test(text)) {
      return new XeroDocumentError(
        "The site is connected to the old Xero bridge, which can't look up a document's contact. Nothing was changed.",
        error.status,
      );
    }
    if (error.status === 400) return new XeroDocumentError(`${text}. Nothing was changed.`, 400);
    if (error.status === 503) return new XeroDocumentError("Xero isn't connected right now. Nothing was changed.", 503);
    if (error.status === 502) return new XeroDocumentError(`Xero didn't answer for ${number}. Nothing was changed.`, 502);
    if (error.status === null && /timed out/i.test(text)) return new XeroDocumentError(`Xero took too long to answer for ${number}. Nothing was changed.`);
    return new XeroDocumentError(`Xero couldn't be reached for ${number}. Nothing was changed.`, error.status);
  }
  return new XeroDocumentError(`Xero couldn't be reached for ${number}. Nothing was changed.`);
}

/**
 * Read one Xero quote or invoice and its contact. Throws XeroDocumentError
 * (with the bridge's own wording) on any problem; never returns a guess.
 * The whole call is time-boxed; a Xero 429 is retried once after Retry-After.
 */
export async function getXeroDocumentWithContact(
  bridge: XeroBridgeClient,
  kind: XeroDocumentKind,
  rawNumber: string,
  context: { projectId?: string | null; storedContactId?: string | null; budgetMs?: number } = {},
): Promise<XeroDocumentWithContact> {
  const number = normaliseDocumentNumber(rawNumber);
  if (documentKindOf(number) !== kind) throw new XeroDocumentError(`“${rawNumber}” isn't a Xero ${kind} number.`);

  const deadline = Date.now() + (context.budgetMs ?? DEFAULT_BUDGET_MS);
  let raw: RawResponse;
  try {
    try {
      raw = await bridge.call<RawResponse>("get_document_with_contact", { kind, number });
    } catch (error) {
      const retryAfter = error instanceof XeroBridgeError ? error.retryAfterSeconds : null;
      const rateLimited = error instanceof XeroBridgeError && error.status === 502 && error.upstreamStatus === 429;
      const waitMs = (retryAfter ?? 2) * 1000;
      if (!rateLimited || Date.now() + waitMs > deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      raw = await bridge.call<RawResponse>("get_document_with_contact", { kind, number });
    }
  } catch (error) {
    const failure = friendly(error, number);
    console.error("[xero-document] lookup failed", { projectId: context.projectId ?? null, document: number, status: failure.status, message: failure.message });
    throw failure;
  }

  const doc = raw?.document ?? null;
  const documentContactId = str(raw?.contact_id);
  const contact = mapXeroContact(raw?.contact);
  const log = {
    projectId: context.projectId ?? null,
    document: number,
    documentContactId,
    returnedContactId: contact.id,
    storedContactId: context.storedContactId ?? null,
  };

  if (!doc || !documentContactId) {
    console.error("[xero-document] no contact on document", log);
    throw new XeroDocumentError(`${number} has no contact in Xero. Nothing was changed.`);
  }
  if (!contact.id || contact.id !== documentContactId) {
    console.error("[xero-document] contact id differs from document", log);
    throw new XeroDocumentError(
      `Xero returned a different contact (document ${number} has ${documentContactId}, the contact lookup gave ${contact.id ?? "none"}). Nothing was changed.`,
    );
  }
  // Safety net against a future regression: the two known wrong contacts are
  // only acceptable when the document itself really belongs to them.
  if (BLOCKED_XERO_CONTACT_IDS.has(contact.id) && !BLOCKED_XERO_CONTACT_IDS.has(documentContactId)) {
    console.error("[xero-document] blocked contact rejected", log);
    throw new XeroDocumentError("Blocked a known wrong Xero contact. Nothing was changed.");
  }
  if (context.storedContactId && context.storedContactId !== documentContactId) {
    // Not an error: the review card shows it as a normal correction row.
    console.info("[xero-document] stored contact differs from the document", log);
  }

  return {
    kind,
    contactId: documentContactId,
    contact,
    document: {
      id: str(doc.id) ?? "",
      number: str(raw.number) ?? number,
      status: str(doc.status),
      date: str(doc.date),
      dueOrExpiry: str(doc.expiry_or_due_date),
      title: str(doc.title),
      reference: str(doc.reference),
      total: num(doc.total),
    },
  };
}

/** Bulk runs: one document call per number, and contacts cached by ContactID. */
export function createDocumentLookup(bridge: XeroBridgeClient) {
  const byNumber = new Map<string, Promise<XeroDocumentWithContact>>();
  return (kind: XeroDocumentKind, number: string, context: { projectId?: string | null; storedContactId?: string | null } = {}) => {
    const key = `${kind}:${normaliseDocumentNumber(number)}`;
    let hit = byNumber.get(key);
    if (!hit) {
      hit = getXeroDocumentWithContact(bridge, kind, number, context);
      byNumber.set(key, hit);
    }
    return hit;
  };
}
