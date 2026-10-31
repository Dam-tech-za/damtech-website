"use server";

import { adminOpsDb } from "@/lib/operations/admin-db";
import { loadXeroStart } from "@/lib/operations/queries";
import type { XeroStartItem } from "@/lib/operations/xero-start";

type QuoteCache = {
  at: number;
  items: XeroStartItem[];
  error: string | null;
};

const CACHE_MS = 60_000;
let quoteCache: QuoteCache | null = null;
let refreshInFlight: Promise<QuoteCache> | null = null;

async function fetchBoardQuotes(): Promise<QuoteCache> {
  try {
    const load = await loadXeroStart({ quotesOnly: true, quoteDays: 30 });
    if (!load.ok) {
      return { at: Date.now(), items: [], error: "Xero quotes could not be loaded." };
    }
    return { at: Date.now(), items: load.data.items, error: load.data.xeroError };
  } catch {
    return { at: Date.now(), items: [], error: "Xero could not be reached just now." };
  }
}

function kickBackgroundRefresh() {
  if (refreshInFlight) return;
  refreshInFlight = fetchBoardQuotes()
    .then((next) => {
      quoteCache = next;
      return next;
    })
    .finally(() => {
      refreshInFlight = null;
    });
}

/** Accepted quotes from the last 30 days. Serves a 60s cache, then refreshes in the background. */
export async function loadBoardXeroQuotesAction(): Promise<{ items: XeroStartItem[]; error: string | null }> {
  // Check the caller before touching the cache: the cache is shared by every
  // request on this server, so serving it first would hand cached Xero quotes
  // to anyone who calls this action without signing in.
  try {
    await adminOpsDb();
  } catch {
    return { items: [], error: "Sign in to load Xero quotes." };
  }
  const now = Date.now();
  if (quoteCache && now - quoteCache.at < CACHE_MS) {
    kickBackgroundRefresh();
    return { items: quoteCache.items, error: quoteCache.error };
  }
  const next = await (refreshInFlight ?? fetchBoardQuotes());
  quoteCache = next;
  return { items: next.items, error: next.error };
}

export async function invalidateBoardXeroQuotesCache(): Promise<void> {
  await adminOpsDb();
  quoteCache = null;
}
