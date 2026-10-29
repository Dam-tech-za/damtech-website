/**
 * Read-only client for Damtech's Xero bridge (Supabase Edge Function
 * `xero-bridge`). The bridge is the only thing allowed to hold Xero tokens:
 * a second OAuth client would rotate the refresh token and sign every agent
 * out. The website therefore never talks to Xero directly.
 *
 * The bridge key can also write (WRITE_MODE=full), so this client refuses any
 * tool that is not on the read list below. Server-only.
 */

export const XERO_BRIDGE_READ_TOOLS = [
  "get_organisation",
  // Typed searches only (exact name or email). Never used to resolve a document's customer.
  "get_contacts",
  // Document → its ContactID → that contact (bridge v7+). The only customer lookup for documents.
  "get_document_with_contact",
  "get_contact",
  "get_quotes",
  "get_quote",
  "get_invoices",
  "get_invoice",
  "get_profit_and_loss",
  "get_balance_sheet",
  "get_bank_summary",
  "get_receivables_summary",
] as const;
export type XeroBridgeReadTool = (typeof XERO_BRIDGE_READ_TOOLS)[number];

/**
 * The only writes the website may ask the bridge for. Each one is a narrow
 * bridge tool that refuses to change existing Xero records (it matches or
 * creates, never edits or deletes). Owner-approved 29 Oct 2026.
 */
export const XERO_BRIDGE_WEBSITE_WRITE_TOOLS = ["create_contact_from_website"] as const;
export type XeroBridgeWebsiteWriteTool = (typeof XERO_BRIDGE_WEBSITE_WRITE_TOOLS)[number];

export type XeroQuoteSummary = {
  id: string;
  number: string;
  status: string;
  contact: string | null;
  contact_id: string | null;
  date: string | null;
  expiry_date: string | null;
  title: string | null;
  currency: string | null;
  total: number | null;
};

export type XeroQuoteDetail = XeroQuoteSummary & {
  summary: string | null;
  terms: string | null;
  reference: string | null;
  subtotal: number | null;
  tax: number | null;
  lines: { description: string | null; quantity: number | null; item_code: string | null; line_amount: number | null }[];
};

export type XeroInvoiceSummary = {
  id: string;
  number: string | null;
  type: string;
  contact: string | null;
  contact_id?: string | null;
  date: string | null;
  due_date: string | null;
  status: string;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number;
  amount_due: number;
  amount_paid: number;
  reference: string | null;
};

export type XeroBridgeStatus = { connected: boolean; [key: string]: unknown };

export class XeroBridgeError extends Error {
  readonly status: number | null;
  /** Xero's own HTTP status when the bridge answers 502 (e.g. 429 rate limit). */
  readonly upstreamStatus: number | null;
  readonly retryAfterSeconds: number | null;
  constructor(message: string, status: number | null, extra: { upstreamStatus?: number | null; retryAfterSeconds?: number | null } = {}) {
    super(message);
    this.name = "XeroBridgeError";
    this.status = status;
    this.upstreamStatus = extra.upstreamStatus ?? null;
    this.retryAfterSeconds = extra.retryAfterSeconds ?? null;
  }
}

export type XeroBridgeConfig = {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/** Bridge URL from XERO_BRIDGE_URL, else derived from the Supabase project URL. */
export function xeroBridgeConfigFromEnv(env: Record<string, string | undefined> = process.env): XeroBridgeConfig | null {
  const apiKey = env.XERO_BRIDGE_API_KEY?.trim();
  const explicit = env.XERO_BRIDGE_URL?.trim();
  const supabase = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const baseUrl = explicit || (supabase ? `${supabase.replace(/\/$/, "")}/functions/v1/xero-bridge` : "");
  if (!apiKey || !baseUrl) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

export type XeroBridgeClient = {
  status(): Promise<XeroBridgeStatus>;
  call<T>(tool: XeroBridgeReadTool, args?: Record<string, unknown>): Promise<T>;
  /** One of the narrow website write tools above; anything else is refused here. */
  write<T>(tool: XeroBridgeWebsiteWriteTool, args: Record<string, unknown>): Promise<T>;
};

export function createXeroBridgeClient(config: XeroBridgeConfig): XeroBridgeClient {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? 20_000;

  async function request(path: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${config.baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `HTTP ${res.status}`;
        const upstream = body && typeof body === "object" && "status" in body ? Number((body as { status: unknown }).status) : null;
        const retry = Number(res.headers.get("retry-after") ?? "");
        throw new XeroBridgeError(`Xero bridge: ${message}`, res.status, {
          upstreamStatus: Number.isFinite(upstream) ? upstream : null,
          retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? Math.min(retry, 30) : null,
        });
      }
      return body;
    } catch (error) {
      if (error instanceof XeroBridgeError) throw error;
      const aborted = error instanceof Error && error.name === "AbortError";
      throw new XeroBridgeError(aborted ? "Xero bridge timed out" : "Xero bridge could not be reached", null);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async status() {
      return (await request("/api/status", { method: "GET" })) as XeroBridgeStatus;
    },
    async call<T>(tool: XeroBridgeReadTool, args: Record<string, unknown> = {}) {
      if (!(XERO_BRIDGE_READ_TOOLS as readonly string[]).includes(tool)) {
        throw new XeroBridgeError(`Tool ${tool} is not allowed from the website`, null);
      }
      return (await request(`/api/${tool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      })) as T;
    },
    async write<T>(tool: XeroBridgeWebsiteWriteTool, args: Record<string, unknown>) {
      if (!(XERO_BRIDGE_WEBSITE_WRITE_TOOLS as readonly string[]).includes(tool)) {
        throw new XeroBridgeError(`Tool ${tool} is not allowed from the website`, null);
      }
      return (await request(`/api/${tool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      })) as T;
    },
  };
}

/** Reads every page of a 100-per-page bridge list (bounded, to protect the daily Xero call budget). */
export async function readAllPages<T>(
  fetchPage: (page: number) => Promise<T[]>,
  maxPages = 5,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchPage(page);
    rows.push(...batch);
    if (batch.length < 100) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}
