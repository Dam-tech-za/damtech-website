import Link from "next/link";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicInfoSuccessPage({ params }: PageProps) {
  await params;
  return (
    <main className="section section--narrow">
      <h1>Thank you</h1>
      <p>
        Your information has been received. A Damtech estimator will continue
        the review.
      </p>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </main>
  );
}
