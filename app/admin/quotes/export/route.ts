import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/require-admin";
import { listQuotes, type QuoteListFilters } from "@/lib/quotes/list";
import { formatQuoteNumber, normaliseQuoteStatus } from "@/lib/quotes/types";

export async function GET(request: Request) {
  try {
    await assertAdmin({ permission: "exportQuotes" });
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const filters: QuoteListFilters = {
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    customerId: url.searchParams.get("customerId") ?? undefined,
    assigned: url.searchParams.get("assigned") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    expiring: url.searchParams.get("expiring") ?? undefined,
    page: "1",
    pageSize: "500",
  };

  const result = await listQuotes(filters);
  const header = [
    "quote_number",
    "revision",
    "status",
    "customer",
    "title",
    "issue_date",
    "valid_until",
    "total_inc_vat",
    "margin_percent",
  ];
  const lines = result.rows.map((row) => {
    const display = formatQuoteNumber(row.quote_number, row.revision_number ?? 0);
    const customer =
      row.customers?.company_name ||
      row.company_name ||
      row.contact_name ||
      "";
    return [
      display.quoteNumber,
      String(display.revisionNumber),
      normaliseQuoteStatus(row.status),
      csv(customer),
      csv(row.title ?? ""),
      row.issue_date,
      row.valid_until,
      String(row.total_inc_vat),
      row.gross_margin_percent == null ? "" : String(row.gross_margin_percent),
    ].join(",");
  });

  const body = [header.join(","), ...lines].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="damtech-quotes.csv"',
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
