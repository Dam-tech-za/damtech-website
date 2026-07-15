"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/admin/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn--md btn--ghost-dark admin-sign-out"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
