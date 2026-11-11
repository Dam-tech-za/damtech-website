import { redirect } from "next/navigation";

type PageProps = { searchParams: Promise<{ status?: string; q?: string }> };

/** The old orders list; orders now live on the Online Purchases board. */
export default async function AdminOrdersRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.status === "pending_invoice" || sp.status === "invoice_sent" || sp.status === "awaiting_payment") {
    params.set("stage", "awaiting_payment");
  }
  if (sp.q?.trim()) params.set("q", sp.q.trim().slice(0, 100));
  const query = params.toString();
  redirect(`/admin/operations/online-purchases/${query ? `?${query}` : ""}`);
}
