import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { compareQuoteLines } from "@/lib/quotes/compare";
import { formatQuoteNumber, normaliseQuoteStatus } from "@/lib/quotes/types";
import { formatZar } from "@/lib/estimating/money";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ compare?: string }>;
};

export default async function AdminQuoteRevisionsPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { compare } = await searchParams;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, quote_number, revision_number, status, total_inc_vat, valid_until, payment_terms",
    )
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const { data: revisions } = await supabase
    .from("quotes")
    .select(
      "id, revision_number, status, total_inc_vat, valid_until, payment_terms, created_at, revision_reason",
    )
    .eq("quote_number", quote.quote_number)
    .order("revision_number", { ascending: false });

  const compareId =
    compare || (revisions ?? []).find((r) => r.id !== id)?.id || null;

  let diff: ReturnType<typeof compareQuoteLines> | null = null;
  let compareRevision:
    | {
        revision_number: number;
        total_inc_vat: number;
        valid_until: string;
        payment_terms: string | null;
      }
    | null = null;

  if (compareId) {
    compareRevision =
      (revisions ?? []).find((r) => r.id === compareId) ?? null;
    const [{ data: currentLines }, { data: otherLines }] = await Promise.all([
      supabase
        .from("quote_line_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order"),
      supabase
        .from("quote_line_items")
        .select("*")
        .eq("quote_id", compareId)
        .order("sort_order"),
    ]);
    diff = compareQuoteLines(otherLines ?? [], currentLines ?? []);
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__header admin-panel__header--row">
        <div>
          <h2>
            Revisions —{" "}
            {formatQuoteNumber(quote.quote_number, quote.revision_number).label}
          </h2>
        </div>
        <Link className="btn btn--md btn--secondary" href={`/admin/quotes/${id}/`}>
          Back
        </Link>
      </header>

      <ul className="admin-list">
        {(revisions ?? []).map((rev) => (
          <li key={rev.id}>
            <Link href={`/admin/quotes/${rev.id}/`}>Rev {rev.revision_number}</Link>
            {" · "}
            {normaliseQuoteStatus(rev.status)}
            {" · "}
            {formatZar(Number(rev.total_inc_vat))}
            {rev.revision_reason ? ` · ${rev.revision_reason}` : ""}
            {rev.id !== id ? (
              <>
                {" · "}
                <Link href={`/admin/quotes/${id}/revisions/?compare=${rev.id}`}>
                  Compare with current
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>

      {diff && compareRevision ? (
        <section style={{ marginTop: "1.5rem" }}>
          <h3>Comparison vs Rev {compareRevision.revision_number}</h3>
          <p>
            Total: {formatZar(Number(compareRevision.total_inc_vat))} →{" "}
            {formatZar(Number(quote.total_inc_vat))}
          </p>
          <p>
            Validity: {compareRevision.valid_until} → {quote.valid_until}
          </p>
          <p>
            Payment terms changed:{" "}
            {String(compareRevision.payment_terms || "") ===
            String(quote.payment_terms || "")
              ? "No"
              : "Yes"}
          </p>
          <h4>Added lines</h4>
          <ul>
            {diff.added.length === 0 ? (
              <li>None</li>
            ) : (
              diff.added.map((line, i) => (
                <li key={i}>{String(line.description)}</li>
              ))
            )}
          </ul>
          <h4>Removed lines</h4>
          <ul>
            {diff.removed.length === 0 ? (
              <li>None</li>
            ) : (
              diff.removed.map((line, i) => (
                <li key={i}>{String(line.description)}</li>
              ))
            )}
          </ul>
          <h4>Quantity / price changes</h4>
          <ul>
            {diff.changed.length === 0 ? (
              <li>None</li>
            ) : (
              diff.changed.map((change, i) =>
                change ? (
                  <li key={i}>
                    {String(change.after.description)}: qty{" "}
                    {String(change.before.quantity)} →{" "}
                    {String(change.after.quantity)}; sell{" "}
                    {String(change.before.sell_unit_price)} →{" "}
                    {String(change.after.sell_unit_price)}
                  </li>
                ) : null,
              )
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
