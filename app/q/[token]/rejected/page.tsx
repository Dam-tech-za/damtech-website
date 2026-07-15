import type { Metadata } from "next";
import Link from "next/link";

type PageProps = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Quotation rejected",
};

export default async function PublicQuoteRejectedPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <main className="public-quote">
      <h1>Quotation declined</h1>
      <p>
        We have notified Damtech. If you asked for a revision, the team will
        follow up.
      </p>
      <p>
        <Link href={`/q/${token}/`}>Return to quotation</Link>
      </p>
    </main>
  );
}
