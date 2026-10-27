"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

type Props = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  successMessage: string;
  children: ReactNode;
};

/** Stable text snapshot of a form's values (files are compared by name and size). */
function snapshot(form: HTMLFormElement): string {
  const parts: string[] = [];
  new FormData(form).forEach((value, key) => {
    parts.push(`${key}=${typeof value === "string" ? value : `${value.name}:${value.size}`}`);
  });
  return parts.join("&");
}

const LEAVE_WARNING = "You have unsaved changes. Leave without saving?";

/**
 * Settings form: Save stays disabled until something changes, a "Saved"
 * message confirms the save, and leaving with unsaved changes asks first.
 */
export function SettingsFormClient({ action, successMessage, children }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const baseline = useRef<string>("");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Remember the starting values once the form has rendered.
  useEffect(() => {
    if (form.current) baseline.current = snapshot(form.current);
  }, []);

  // Save buttons inside the form follow the dirty state.
  useEffect(() => {
    form.current?.querySelectorAll<HTMLButtonElement>('button[type="submit"]').forEach((button) => {
      button.disabled = !dirty || pending;
      button.title = !dirty ? "Nothing has changed yet" : "";
    });
  }, [dirty, pending]);

  // Warn before closing the tab or following a link with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm(LEAVE_WARNING)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.ok ? 3500 : 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function check() {
    if (form.current) setDirty(snapshot(form.current) !== baseline.current);
  }

  return (
    <form
      ref={form}
      onInput={check}
      onChange={check}
      // Submitted by hand (not the form action prop) so React doesn't reset
      // the fields to their old defaults after saving.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result.ok) {
            if (form.current) baseline.current = snapshot(form.current);
            setDirty(false);
            setToast({ ok: true, text: successMessage });
          } else {
            setToast({ ok: false, text: result.error });
          }
        });
      }}
    >
      {children}
      <p className="admin-settings-form__state" aria-live="polite">
        {pending ? "Saving…" : dirty ? "You have unsaved changes." : ""}
      </p>
      {toast ? (
        <div className={`admin-toast${toast.ok ? "" : " admin-toast--error"}`} role="status">
          {toast.ok ? "✓ " : ""}
          {toast.text}
        </div>
      ) : null}
    </form>
  );
}
