"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createRfqUploadUrlAction } from "@/app/actions/rfq-upload";

export function RfqUploadClient({
  rfqId,
  token,
  rfqNumber,
}: {
  rfqId: string;
  token: string;
  rfqNumber: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <p>
        Uploading for <strong>{rfqNumber}</strong>
      </p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={pending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          startTransition(async () => {
            setMessage(null);
            const prepared = await createRfqUploadUrlAction({
              rfqId,
              token,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              category: "site_photographs",
            });
            if (!prepared.ok) {
              setMessage(prepared.error);
              return;
            }
            const supabase = createClient();
            const { error } = await supabase.storage
              .from("rfq-attachments")
              .uploadToSignedUrl(prepared.path, prepared.token, file);
            if (error) {
              setMessage(error.message);
              return;
            }
            setMessage("File uploaded successfully.");
            event.target.value = "";
          });
        }}
      />
      {message ? <p>{message}</p> : null}
    </div>
  );
}
