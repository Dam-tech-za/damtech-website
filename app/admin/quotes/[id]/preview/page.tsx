import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { buildQuotePdfPayload } from "@/lib/quotes/pdf-service";
import { formatQuoteNumber } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";
import { GeneratePdfButton } from "@/components/admin/GeneratePdfButton";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuotePreviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const built = await buildQuotePdfPayload(id);
  if (!built.ok) notFound();

  const { payload } = built;
  const display = formatQuoteNumber(payload.quoteNumber, payload.revisionNumber);

  return (
    <div className="admin-panel">
      <header className="admin-panel__header admin-panel__header--row">
        <div>
          <h2>PDF preview — {display.label}</h2>
          <p className="admin-empty__hint">
            Preview uses the same snapshot fields as the generated PDF. Cost and
            margin are never included.
          </p>
        </div>
        <div className="admin-panel__actions">
          <GeneratePdfButton quoteId={id} />
          <Link className="btn btn--md btn--secondary" href={`/admin/quotes/${id}/`}>
            Back to quote
          </Link>
        </div>
      </header>

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
    </div>
  );
}
