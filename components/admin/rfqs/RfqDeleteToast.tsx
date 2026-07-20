"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function RfqDeleteToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(
    () => searchParams.get("deleted") === "1",
  );

  useEffect(() => {
    if (!visible) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("deleted");
    const next = params.toString();
    router.replace(next ? `/admin/rfqs/?${next}` : "/admin/rfqs/", {
      scroll: false,
    });

    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, [visible, searchParams, router]);

  if (!visible) return null;

  return (
    <div className="rfq-delete-toast" role="status" aria-live="polite">
      RFQ deleted successfully.
    </div>
  );
}
