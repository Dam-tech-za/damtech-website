"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/admin/actions";
import { AdminButton } from "@/components/admin/ui";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <AdminButton
      variant="secondary"
      className="admin-sign-out"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </AdminButton>
  );
}
