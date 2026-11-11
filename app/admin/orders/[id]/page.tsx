import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

/** Links in older emails point here; open the order's quick view on the board instead. */
export default async function AdminOrderRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/operations/online-purchases/?order=${encodeURIComponent(id)}`);
}
