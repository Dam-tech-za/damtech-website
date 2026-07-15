import { createClient } from "@/lib/supabase/server";
import { summariseCalculatorSize } from "@/lib/rfq/calculator";
import type { RfqStatus } from "@/lib/rfq/schema";

export type RfqListFilters = {
  q?: string;
  status?: string;
  service?: string;
  province?: string;
  assigned?: string;
  from?: string;
  to?: string;
  hasCalculator?: string;
  hasAttachments?: string;
  sourcePage?: string;
  sort?: string;
  page?: string;
};

export type RfqListRow = {
  id: string;
  rfq_number: string;
  status: RfqStatus;
  submitted_at: string;
  updated_at: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  service_required: string | null;
  province: string | null;
  project_location: string | null;
  approximate_project_size: string | null;
  calculator_type: string | null;
  calculator_result: Record<string, unknown> | null;
  assigned_to: string | null;
  source_page: string | null;
  assignee_email?: string | null;
  attachment_count?: number;
};

const PAGE_SIZE = 20;

export async function listRfqs(filters: RfqListFilters) {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page || 1) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("rfqs")
    .select(
      "id, rfq_number, status, submitted_at, updated_at, contact_name, company_name, email, phone, service_required, province, project_location, approximate_project_size, calculator_type, calculator_result, assigned_to, source_page",
      { count: "exact" },
    );

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.service) query = query.eq("service_required", filters.service);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.assigned === "unassigned") query = query.is("assigned_to", null);
  else if (filters.assigned) query = query.eq("assigned_to", filters.assigned);
  if (filters.from) query = query.gte("submitted_at", filters.from);
  if (filters.to) query = query.lte("submitted_at", `${filters.to}T23:59:59.999Z`);
  if (filters.hasCalculator === "1") query = query.not("calculator_type", "is", null);
  if (filters.hasCalculator === "0") query = query.is("calculator_type", null);
  if (filters.sourcePage) query = query.ilike("source_page", `%${filters.sourcePage}%`);

  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_]/g, "");
    query = query.or(
      [
        `rfq_number.ilike.%${q}%`,
        `contact_name.ilike.%${q}%`,
        `company_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
        `project_location.ilike.%${q}%`,
        `service_required.ilike.%${q}%`,
      ].join(","),
    );
  }

  const sort = filters.sort || "submitted_at_desc";
  if (sort === "submitted_at_asc") query = query.order("submitted_at", { ascending: true });
  else if (sort === "updated_at_desc") query = query.order("updated_at", { ascending: false });
  else if (sort === "rfq_number_asc") query = query.order("rfq_number", { ascending: true });
  else query = query.order("submitted_at", { ascending: false });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return {
      rows: [] as RfqListRow[],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      error: error.message,
    };
  }

  const rows = (data ?? []) as RfqListRow[];
  const assigneeIds = [...new Set(rows.map((r) => r.assigned_to).filter(Boolean))] as string[];
  let emailById: Record<string, string> = {};
  if (assigneeIds.length) {
    const { data: profiles } = await supabase
      .from("admin_profiles")
      .select("id, email")
      .in("id", assigneeIds);
    emailById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]));
  }

  let attachmentCounts: Record<string, number> = {};
  if (rows.length) {
    const { data: attachments } = await supabase
      .from("rfq_attachments")
      .select("rfq_id")
      .in(
        "rfq_id",
        rows.map((r) => r.id),
      );
    for (const row of attachments ?? []) {
      attachmentCounts[row.rfq_id] = (attachmentCounts[row.rfq_id] ?? 0) + 1;
    }
  }

  if (filters.hasAttachments === "1") {
    const filtered = rows.filter((r) => (attachmentCounts[r.id] ?? 0) > 0);
    return {
      rows: filtered.map((r) => ({
        ...r,
        assignee_email: r.assigned_to ? emailById[r.assigned_to] ?? null : null,
        attachment_count: attachmentCounts[r.id] ?? 0,
      })),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      error: null as string | null,
    };
  }
  if (filters.hasAttachments === "0") {
    const filtered = rows.filter((r) => (attachmentCounts[r.id] ?? 0) === 0);
    return {
      rows: filtered.map((r) => ({
        ...r,
        assignee_email: r.assigned_to ? emailById[r.assigned_to] ?? null : null,
        attachment_count: 0,
      })),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      error: null as string | null,
    };
  }

  return {
    rows: rows.map((r) => ({
      ...r,
      assignee_email: r.assigned_to ? emailById[r.assigned_to] ?? null : null,
      attachment_count: attachmentCounts[r.id] ?? 0,
    })),
    total: count ?? rows.length,
    page,
    pageSize: PAGE_SIZE,
    error: null as string | null,
  };
}

export function rfqSizeLabel(row: RfqListRow): string {
  return summariseCalculatorSize(
    row.calculator_type,
    row.calculator_result,
    row.approximate_project_size,
  );
}
