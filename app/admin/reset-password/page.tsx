import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DamtechLogo } from "@/components/DamtechLogo";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import {
  AdminActionForm,
  AdminHelpText,
  AdminInput,
  AdminLabel,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { setNewPasswordAction } from "../forgot-password/actions";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the emailed reset link (signed in by /auth/callback). */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user?.email) {
    redirect("/admin/forgot-password/");
  }

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <DamtechLogo size={48} />
          <div>
            <p className="admin-login__kicker">{user.email}</p>
            <h1 className="admin-login__heading">Choose a new password</h1>
          </div>
        </div>

        <AdminActionForm action={setNewPasswordAction} className="admin-login__form">
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={user.email}
            readOnly
            hidden
          />
          <div className="admin-login__field">
            <AdminLabel htmlFor="new-password" required>
              New password
            </AdminLabel>
            <AdminInput
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
            />
            <AdminHelpText>
              At least {PASSWORD_MIN_LENGTH} characters, with letters and numbers.
            </AdminHelpText>
          </div>
          <div className="admin-login__field">
            <AdminLabel htmlFor="confirm-password" required>
              Confirm new password
            </AdminLabel>
            <AdminInput
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
            />
          </div>
          <AdminSubmitButton pendingLabel="Saving…">Save new password</AdminSubmitButton>
        </AdminActionForm>

        <Link href="/admin/" className="admin-login__back">
          ← Back to admin
        </Link>
      </div>
    </main>
  );
}
