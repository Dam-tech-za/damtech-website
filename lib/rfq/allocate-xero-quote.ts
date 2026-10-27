/**
 * Link a sent Xero quote to an RFQ enquiry so the inbox shows it as attended.
 * Quoting happens in Xero; the website only stores the link and updates status.
 */

import type {
  XeroBridgeClient,
  XeroQuoteDetail,
  XeroQuoteSummary,
} from "../operations/xero-bridge.ts";
import { readAllPages } from "../operations/xero-bridge.ts";
import type { RfqStatus } from "./statuses.ts";

const LOOKUP_STATUSES = ["SENT", "ACCEPTED", "INVOICED", "DRAFT"] as const;
const TERMINAL_RFQ_STATUSES: RfqStatus[] = ["closed", "spam", "archived"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normaliseXeroQuoteNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function nextRfqStatusAfterXeroAllocation(
  current: RfqStatus | string,
): RfqStatus | null {
  if ((TERMINAL_RFQ_STATUSES as string[]).includes(current)) return null;
  if (current === "converted") return "converted";
  return "quote_sent";
}

export function pickQuoteByNumber(
  quotes: XeroQuoteSummary[],
  quoteNumber: string,
): XeroQuoteSummary | null {
  const want = normaliseXeroQuoteNumber(quoteNumber);
  const matches = quotes.filter(
    (q) => normaliseXeroQuoteNumber(q.number) === want,
  );
  if (matches.length === 0) return null;
  // Prefer SENT, then ACCEPTED / INVOICED over DRAFT when duplicates appear.
  const rank = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SENT") return 0;
    if (s === "ACCEPTED") return 1;
    if (s === "INVOICED") return 2;
    return 3;
  };
  return [...matches].sort((a, b) => rank(a.status) - rank(b.status))[0] ?? null;
}

function daysAgoIso(days: number, today = new Date()): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export type ResolvedXeroQuote = {
  id: string;
  number: string;
  status: string;
  contact: string | null;
  total: number | null;
  date: string | null;
};

export async function resolveXeroQuote(
  bridge: XeroBridgeClient,
  rawInput: string,
  options: { lookbackDays?: number; today?: Date } = {},
): Promise<
  | { ok: true; quote: ResolvedXeroQuote }
  | { ok: false; error: string }
> {
  const input = rawInput.trim();
  if (!input) return { ok: false, error: "Enter a Xero quote number (for example QU0288)." };

  if (UUID_RE.test(input)) {
    try {
      const detail = await bridge.call<XeroQuoteDetail>("get_quote", {
        quote_id: input,
      });
      return {
        ok: true,
        quote: {
          id: detail.id,
          number: detail.number,
          status: detail.status,
          contact: detail.contact,
          total: detail.total,
          date: detail.date,
        },
      };
    } catch {
      return { ok: false, error: "That Xero quote id was not found." };
    }
  }

  const want = normaliseXeroQuoteNumber(input);
  if (!/^QU?\d{2,}$/i.test(want) && !/^\d{3,}$/.test(want)) {
    // Allow free-form Xero numbers; still require something quote-like.
    if (want.length < 3) {
      return { ok: false, error: "Enter a Xero quote number (for example QU0288)." };
    }
  }

  const lookbackDays = options.lookbackDays ?? 400;
  const dateFrom = daysAgoIso(lookbackDays, options.today);
  const collected: XeroQuoteSummary[] = [];

  for (const status of LOOKUP_STATUSES) {
    const { rows } = await readAllPages((page) =>
      bridge.call<XeroQuoteSummary[]>("get_quotes", {
        status,
        date_from: dateFrom,
        page,
      }),
    );
    collected.push(...rows);
    const hit = pickQuoteByNumber(collected, want);
    if (hit) {
      return {
        ok: true,
        quote: {
          id: hit.id,
          number: hit.number,
          status: hit.status,
          contact: hit.contact,
          total: hit.total,
          date: hit.date,
        },
      };
    }
  }

  return {
    ok: false,
    error: `No Xero quote matching ${want} was found in the last ${lookbackDays} days (draft, sent, accepted or invoiced).`,
  };
}

export type AllocateXeroQuotePatch = {
  xero_quote_id: string;
  xero_quote_number: string;
  xero_quote_status: string;
  xero_quote_allocated_at: string;
  status: RfqStatus;
  reviewed_at: string;
};

export function buildAllocateXeroQuotePatch(input: {
  quote: ResolvedXeroQuote;
  currentStatus: RfqStatus | string;
  allocatedAt?: string;
}):
  | { ok: true; patch: AllocateXeroQuotePatch; previousStatusKept: boolean }
  | { ok: false; error: string } {
  const next = nextRfqStatusAfterXeroAllocation(input.currentStatus);
  if (!next) {
    return {
      ok: false,
      error: "Reopen this enquiry (change status away from closed, spam or archived) before allocating a quote.",
    };
  }
  const at = input.allocatedAt ?? new Date().toISOString();
  return {
    ok: true,
    previousStatusKept: next === input.currentStatus,
    patch: {
      xero_quote_id: input.quote.id,
      xero_quote_number: input.quote.number,
      xero_quote_status: input.quote.status,
      xero_quote_allocated_at: at,
      status: next,
      reviewed_at: at,
    },
  };
}
