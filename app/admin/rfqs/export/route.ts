import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { listRfqs, rfqSizeLabel, type RfqListFilters } from "@/lib/rfq/list";

export async function GET(request: Request) {
  try {
    await assertAdmin({ permission: "exportRfqs" });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: RfqListFilters = Object.fromEntries(url.searchParams.entries());
  // Export up to first 500 matching by paging
  const pages = [];
  for (let page = 1; page <= 25; page += 1) {
    const result = await listRfqs({ ...filters, page: String(page) });
    pages.push(...result.rows);
    if (result.rows.length < result.pageSize) break;
  }

  const header = [
    "rfq_number",
    "submitted_at",
    "status",
    "customer",
    "company",
    "email",
    "phone",
    "service",
    "province",
    "project_location",
    "size",
    "assigned",
    "source_page",
  ];

  const lines = [
    header.join(","),
    ...pages.map((row) =>
      [
        row.rfq_number,
        row.submitted_at,
        row.status,
        row.contact_name,
        row.company_name ?? "",
        row.email ?? "",
        row.phone ?? "",
        row.service_required ?? "",
        row.province ?? "",
        row.project_location ?? "",
        rfqSizeLabel(row),
        row.assignee_email ?? "",
        row.source_page ?? "",
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="damtech-rfqs.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
