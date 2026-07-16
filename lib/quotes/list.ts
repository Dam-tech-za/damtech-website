import { createClient } from "@/lib/supabase/server";
import { normaliseQuoteStatus, type QuoteStatus } from "./types";

export type QuoteListFilters = {
  q?: string;
  status?: string;
  customerId?: string;
  assigned?: string;
  from?: string;
  to?: string;
  expiring?: string;
  page?: string;
  pageSize?: string;
};

export type QuoteListRow = {
  id: string;
  quote_number: string;
  revision_number: number;
  status: string;
  title: string | null;
  issue_date: string;
  valid_until: string;
  total_inc_vat: number;
  gross_margin_percent: number | null;
  customer_id: string | null;
  assigned_to: string | null;
  updated_at: string;
  company_name: string | null;
  contact_name: string | null;
  customers?: { company_name: string | null; contact_name: string | null } | null;
};

const DEFAULT_PAGE_SIZE = 25;

export async function listQuotes(filters: QuoteListFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(filters.pageSize) || DEFAULT_PAGE_SIZE),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("quotes")
    .select(
      "id, quote_number, revision_number, status, title, issue_date, valid_until, total_inc_vat, gross_margin_percent, customer_id, assigned_to, updated_at, company_name, contact_name, customers(company_name, contact_name)",
      { count: "exact" },
    )
    .eq("is_latest_revision", true)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (filters.q?.trim()) {
    const q = filters.q.trim().replaceAll(",", " ");
    query = query.or(
      `quote_number.ilike.%${q}%,title.ilike.%${q}%,company_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  if (filters.status?.trim()) {
    const status = normaliseQuoteStatus(filters.status.trim());
    if (status === "rejected") {
      query = query.in("status", ["rejected", "declined"]);
    } else {
      query = query.eq("status", status);
    }
  }

  if (filters.customerId?.trim()) {
    query = query.eq("customer_id", filters.customerId.trim());
  }

  if (filters.assigned === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (filters.assigned?.trim()) {
    query = query.eq("assigned_to", filters.assigned.trim());
  }

  if (filters.from?.trim()) {
    query = query.gte("issue_date", filters.from.trim());
  }
  if (filters.to?.trim()) {
    query = query.lte("issue_date", filters.to.trim());
  }

  if (filters.expiring === "1" || filters.expiring === "true") {
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    query = query
      .in("status", ["sent", "viewed"])
      .lte("valid_until", in7.toISOString().slice(0, 10));
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[quotes] list failed:", error.message);
    return { rows: [] as QuoteListRow[], total: 0, page, pageSize };
  }

  return {
    rows: (data ?? []) as unknown as QuoteListRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function sumPipelineValue(
  statuses: QuoteStatus[],
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("total_inc_vat")
    .eq("is_latest_revision", true)
    .in("status", statuses);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + Number(row.total_inc_vat || 0), 0);
}

export type QuoteStatusCounts = Record<string, number>;

const QUOTE_METRIC_STATUSES = [
  "draft",
  "internal_review",
  "approved",
  "sent",
  "viewed",
  "accepted",
] as const;

/** Parallel status counts for latest quote revisions (compact list metrics). */
export async function getQuoteStatusCounts(): Promise<QuoteStatusCounts> {
  const supabase = await createClient();
  const counts: QuoteStatusCounts = Object.fromEntries(
    QUOTE_METRIC_STATUSES.map((status) => [status, 0]),
  );
  counts.expiring_soon = 0;

  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const expiringUntil = in7.toISOString().slice(0, 10);

  const results = await Promise.all([
    ...QUOTE_METRIC_STATUSES.map(async (status) => {
      const { count } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("is_latest_revision", true)
        .eq("status", status);
      return [status, count ?? 0] as const;
    }),
    (async () => {
      const { count } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("is_latest_revision", true)
        .in("status", ["sent", "viewed"])
        .lte("valid_until", expiringUntil);
      return ["expiring_soon", count ?? 0] as const;
    })(),
  ]);

  for (const [key, value] of results) {
    counts[key] = value;
  }
  return counts;
}
