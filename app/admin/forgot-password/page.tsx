import type { Metadata } from "next";
import Link from "next/link";
import { DamtechLogo } from "@/components/DamtechLogo";
import {
  AdminActionForm,
  AdminInput,
  AdminLabel,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { requestPasswordResetAction } from "./actions";

export const metadata: Metadata = { title: "Reset password" };

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const prefill = typeof email === "string" && email.length <= 254 ? email : "";

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <DamtechLogo size={48} />
          <div>
            <p className="admin-login__kicker">Internal access only</p>
            <h1 className="admin-login__heading">Reset your password</h1>
          </div>
        </div>

        <p className="admin-login__lead">
          Enter your admin email. We will email you a secure link; open it in
          this browser to choose a new password.
        </p>

        <AdminActionForm action={requestPasswordResetAction} className="admin-login__form">
          <div className="admin-login__field">
            <AdminLabel htmlFor="reset-email" required>
              Email
            </AdminLabel>
            <AdminInput
              id="reset-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              defaultValue={prefill}
              placeholder="you@damtech.co.za"
            />
          </div>
          <AdminSubmitButton pendingLabel="Sending link…">
            Email me a reset link
          </AdminSubmitButton>
        </AdminActionForm>

        <Link href="/admin/login/" className="admin-login__back">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
