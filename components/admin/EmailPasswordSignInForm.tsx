"use client";

import { useState, useTransition, type FormEvent } from "react";
import { signInWithEmailPassword } from "@/app/admin/login/actions";
import { AdminButton, AdminInput, AdminLabel } from "@/components/admin/ui";

type EmailPasswordSignInFormProps = {
  nextPath?: string;
};

export function EmailPasswordSignInForm({
  nextPath = "/admin/",
}: EmailPasswordSignInFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("next", nextPath);

    startTransition(async () => {
      const result = await signInWithEmailPassword(formData);
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
      <div className="admin-login__field">
        <AdminLabel htmlFor="admin-login-email" required>
          Email
        </AdminLabel>
        <AdminInput
          id="admin-login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={pending}
          placeholder="you@damtech.co.za"
        />
      </div>
      <div className="admin-login__field">
        <AdminLabel htmlFor="admin-login-password" required>
          Password
        </AdminLabel>
        <AdminInput
          id="admin-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          minLength={8}
        />
      </div>
      <AdminButton
        type="submit"
        variant="secondary"
        size="lg"
        className="admin-login__password-submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in with email"}
      </AdminButton>
      {error ? (
        <p className="admin-login__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
