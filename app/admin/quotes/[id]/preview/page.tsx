import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { buildQuotePdfPayload } from "@/lib/quotes/pdf-service";
import { formatQuoteNumber } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";
import { GeneratePdfButton } from "@/components/admin/GeneratePdfButton";
import { AdminButton, AdminPanel } from "@/components/admin/ui";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuotePreviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const built = await buildQuotePdfPayload(id);
  if (!built.ok) notFound();

  const { payload } = built;
  const display = formatQuoteNumber(payload.quoteNumber, payload.revisionNumber);

  return (
    <AdminPanel
      title={`PDF preview — ${display.label}`}
      description="Preview uses the same snapshot fields as the generated PDF. Cost and margin are never included."
      actions={
        <>
          <GeneratePdfButton quoteId={id} />
          <AdminButton href={`/admin/quotes/${id}/`} variant="secondary">
            Back to quote
          </AdminButton>
        </>
      }
    >
      <article className="admin-quote-preview">
        <h3>{payload.company.tradingName || payload.company.legalBusinessName}</h3>
        <p>QUOTATION · {display.label}</p>
        <p>
          Issue {payload.issueDate} · Valid until {payload.validUntil}
        </p>
        <p>
          <strong>Customer:</strong> {payload.customerName}
        </p>
        <p>
          <strong>Project:</strong> {payload.title}
        </p>
        {payload.scopeSummary ? <p>{payload.scopeSummary}</p> : null}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payload.lines
              .filter((l) => l.lineType !== "heading" && l.lineType !== "note")
              .map((line, i) => (
                <tr key={`${line.description}-${i}`}>
                  <td>{line.itemCode || "—"}</td>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>{formatZar(line.sellUnitPrice)}</td>
                  <td>{formatZar(line.lineTotalExVat)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <p>Subtotal: {formatZar(payload.subtotalExVat)}</p>
        <p>VAT ({payload.vatRate}%): {formatZar(payload.vatAmount)}</p>
        <p>
          <strong>Total inc VAT: {formatZar(payload.totalIncVat)}</strong>
        </p>
      </article>
    </AdminPanel>
  );
}
