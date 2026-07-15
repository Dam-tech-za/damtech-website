"use client";

import { useTransition } from "react";
import { generatePdfAction, getPdfUrlAction } from "@/app/admin/quotes/actions";

export function GeneratePdfButton({ quoteId }: { quoteId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn--md btn--primary"
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
    </button>
  );
}
