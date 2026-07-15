"use client";

import { useState, useTransition, type ReactNode } from "react";

type Props = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  successMessage: string;
  children: ReactNode;
};

export function SettingsFormClient({ action, successMessage, children }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await action(formData);
          setMessage(result.ok ? successMessage : result.error);
        });
      }}
    >
      {message ? <p className="admin-flash">{message}</p> : null}
      {children}
      {pending ? <p className="admin-empty__hint">Saving…</p> : null}
    </form>
  );
}
