import type { Metadata } from "next";
import Link from "next/link";

type PageProps = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Quotation accepted",
};

export default async function PublicQuoteAcceptedPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <main className="public-quote">
      <h1>Thank you</h1>
      <p>
        Your electronic quotation acceptance has been recorded. Damtech will
        contact you shortly.
      </p>
      <p>
        <Link href={`/q/${token}/`}>Return to quotation</Link>
      </p>
    </main>
  );
}
