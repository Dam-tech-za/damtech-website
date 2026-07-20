"use client";

import { useState, useTransition } from "react";
import { checkLoginRateLimit } from "@/app/admin/login/actions";
import { createClient } from "@/lib/supabase/client";
import { AdminButton } from "@/components/admin/ui";

type GoogleSignInButtonProps = {
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/admin/" }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const limited = await checkLoginRateLimit();
        if (!limited.ok) {
          setError(limited.error);
          return;
        }

        const supabase = createClient();
        const origin = window.location.origin;
        const redirectTo = new URL("/auth/callback", origin);
        if (nextPath.startsWith("/admin")) {
          redirectTo.searchParams.set("next", nextPath);
        }

        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectTo.toString(),
            scopes: "openid email profile",
          },
        });

        if (oauthError) {
          setError(oauthError.message || "Unable to start Google sign-in.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to start Google sign-in.";
        setError(
          message.includes("Supabase public env")
            ? "Admin authentication is not configured yet."
            : message,
        );
      }
    });
  }

  return (
    <div className="admin-login__actions">
      <AdminButton
        type="button"
        variant="primary"
        size="lg"
        className="admin-login__google"
        onClick={handleClick}
        disabled={pending}
      >
        <GoogleGlyph />
        {pending ? "Redirecting…" : "Continue with Google"}
      </AdminButton>
      {error ? (
        <p className="admin-login__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="admin-login__google-icon"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
