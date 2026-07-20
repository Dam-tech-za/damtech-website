"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RfqRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn--md btn--secondary"
      disabled={pending}
      aria-label="Refresh RFQ list"
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
