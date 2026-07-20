"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminButton } from "@/components/admin/ui";

export function RfqRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AdminButton
      variant="secondary"
      disabled={pending}
      aria-label="Refresh RFQ list"
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing…" : "Refresh"}
    </AdminButton>
  );
}
