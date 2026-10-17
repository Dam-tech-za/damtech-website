import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Information request | Damtech" },
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicInfoSuccessPage({ params }: PageProps) {
  await params;
  return (
    <div className="section section--narrow">
      <h1>Thank you</h1>
      <p>
        Your information has been received. A Damtech estimator will continue
        the review.
      </p>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </div>
  );
}
