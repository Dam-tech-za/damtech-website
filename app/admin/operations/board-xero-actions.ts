"use server";

import { loadXeroStart } from "@/lib/operations/queries";
import type { XeroStartItem } from "@/lib/operations/xero-start";

export async function loadBoardXeroQuotesAction(): Promise<{ items: XeroStartItem[]; error: string | null }> {
  try {
    const load = await loadXeroStart({ quotesOnly: true, quoteDays: 30 });
    if (!load.ok) return { items: [], error: "Xero quotes could not be loaded." };
    return { items: load.data.items, error: load.data.xeroError };
  } catch {
    return { items: [], error: "Xero could not be reached just now." };
  }
}
