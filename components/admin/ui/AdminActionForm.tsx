"use client";

import {
  createContext,
  startTransition,
  useContext,
  useActionState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { AdminActionState } from "@/lib/admin/action-state";
import { AdminButton } from "./AdminButton";

/** Pending state of the surrounding AdminActionForm (null outside one). */
const ActionPendingContext = createContext<boolean | null>(null);

type AdminActionFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  children: ReactNode;
  className?: string;
  /** Native confirmation shown before a destructive or irreversible change. */
  confirmMessage?: string;
  /** Clear the fields after a confirmed save (e.g. a new note). */
  resetOnSuccess?: boolean;
};

/**
 * Form wrapper for admin Server Actions. Shows success only after the server
 * confirms the write, and shows a readable error when it fails.
 */
export function AdminActionForm({
  action,
  children,
  className,
  confirmMessage,
  resetOnSuccess = false,
}: AdminActionFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        // Submit manually rather than via the action prop so React does not
        // auto-reset the form: a failed save must keep what the user typed.
        event.preventDefault();
        if (pending) return;
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(formData));
      }}
    >
      <ActionPendingContext.Provider value={pending}>{children}</ActionPendingContext.Provider>
      <AdminActionMessage state={state} pending={pending} />
    </form>
  );
}

export function AdminActionMessage({
  state,
  pending = false,
}: {
  state: AdminActionState;
  pending?: boolean;
}) {
  const tone = pending ? "pending" : state ? (state.ok ? "success" : "error") : "idle";
  return (
    <p
      className={`admin-action-message admin-action-message--${tone}`}
      role={state && !state.ok && !pending ? "alert" : "status"}
      aria-live="polite"
      key={state?.at ?? "idle"}
    >
      {pending ? "Saving…" : state?.message ?? ""}
    </p>
  );
}

type AdminSubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  name?: string;
  value?: string;
};

/** Submit button that disables itself and changes label while the form is sending. */
export function AdminSubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  name,
  value,
}: AdminSubmitButtonProps) {
  const actionPending = useContext(ActionPendingContext);
  const { pending: nativePending } = useFormStatus();
  const pending = actionPending ?? nativePending;
  return (
    <AdminButton
      type="submit"
      variant={variant}
      disabled={pending}
      aria-disabled={pending}
      name={name}
      value={value}
    >
      {pending ? pendingLabel : children}
    </AdminButton>
  );
}
