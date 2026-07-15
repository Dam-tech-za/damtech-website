import { permanentRedirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ draft?: string }>;
};

/**
 * Legacy path — Quote Preparation lives on `/calculators/#project-budget`.
 */
export default async function QuotePreparationRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const draft = params.draft?.trim();
  const qs = new URLSearchParams({ tool: "project-budget" });
  if (draft) qs.set("draft", draft);
  permanentRedirect(`/calculators/?${qs.toString()}`);
}
