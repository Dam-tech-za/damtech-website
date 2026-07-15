import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { loadPublicQuote } from "@/lib/quotes/public";
import { formatZar } from "@/lib/estimating/money";
import { formatQuoteNumber } from "@/lib/quotes/types";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { PublicQuoteActions } from "@/components/public/PublicQuoteActions";

type PageProps = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
  title: "Damtech Quotation",
};

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  const limited = await rateLimit({
    key: `public-quote:${ip}`,
    ...RATE_LIMITS.publicQuoteView,
  });
  if (!limited.success) {
    return (
      <main className="public-quote">
        <p>Too many requests. Please try again shortly.</p>
      </main>
    );
  }

  const loaded = await loadPublicQuote(token, { recordView: true });
  if (!loaded.ok) notFound();

  const view = loaded.view;
  const display = formatQuoteNumber(view.quoteNumber, view.revisionNumber);

  return (
    <main className="public-quote">
      <header className="public-quote__header">
        <p className="public-quote__brand">{view.companyName}</p>
        <h1>Quotation</h1>
        <p>{display.label}</p>
      </header>

      <section>
        <p>
          <strong>Customer:</strong> {view.customerName}
        </p>
        <p>
          <strong>Project:</strong> {view.title}
        </p>
        {view.projectLocation ? (
          <p>
            <strong>Location:</strong> {view.projectLocation}
          </p>
        ) : null}
        <p>
          Issue {view.issueDate} · Valid until {view.validUntil}
          {view.expired ? " · Expired" : ` · ${view.daysRemaining} day(s) remaining`}
        </p>
      </section>

      {view.scopeSummary ? (
        <section>
          <h2>Scope</h2>
          <p>{view.scopeSummary}</p>
        </section>
      ) : null}

      <section>
        <h2>Pricing</h2>
        <div className="admin-table-wrap">
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
              {view.lines.map((line, i) => (
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
        </div>
        <p>Subtotal: {formatZar(view.subtotalExVat)}</p>
        {view.discountAmount > 0 ? (
          <p>Discount: -{formatZar(view.discountAmount)}</p>
        ) : null}
        <p>
          VAT ({view.vatRate}%): {formatZar(view.vatAmount)}
        </p>
        <p>
          <strong>Total inc VAT: {formatZar(view.totalIncVat)}</strong>
        </p>
      </section>

      {view.assumptions ? (
        <section>
          <h2>Assumptions</h2>
          <p>{view.assumptions}</p>
        </section>
      ) : null}
      {view.exclusions ? (
        <section>
          <h2>Exclusions</h2>
          <p>{view.exclusions}</p>
        </section>
      ) : null}
      {view.paymentTerms ? (
        <section>
          <h2>Payment terms</h2>
          <p>{view.paymentTerms}</p>
        </section>
      ) : null}
      {view.terms ? (
        <section>
          <h2>Terms</h2>
          <p>{view.terms}</p>
        </section>
      ) : null}

      <section className="public-quote__actions">
        {view.hasPdf ? (
          <Link className="btn btn--md btn--secondary" href={`/q/${token}/pdf/`}>
            Download PDF
          </Link>
        ) : null}
        {view.companyEmail || view.companyPhone ? (
          <a
            className="btn btn--md btn--secondary"
            href={
              view.companyEmail
                ? `mailto:${view.companyEmail}`
                : `tel:${view.companyPhone}`
            }
          >
            Contact Damtech
          </a>
        ) : null}
        {view.canRespond ? <PublicQuoteActions token={token} /> : null}
        {!view.canRespond ? (
          <p>
            This quotation is {view.status}
            {view.expired ? " / expired" : ""}.
          </p>
        ) : null}
      </section>
    </main>
  );
}
