"use client";

import { useTransition } from "react";
import { generatePdfAction, getPdfUrlAction } from "@/app/admin/quotes/actions";
import { AdminButton } from "@/components/admin/ui";

export function GeneratePdfButton({ quoteId }: { quoteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AdminButton
      variant="primary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const generated = await generatePdfAction(quoteId);
          if (!generated.ok) {
            alert(generated.error);
            return;
          }
          const url = await getPdfUrlAction(quoteId);
          if (url.ok) window.open(url.url, "_blank");
          else alert(url.error);
        })
      }
    >
      {pending ? "Generating…" : "Generate & download PDF"}
    </AdminButton>
  );
}
