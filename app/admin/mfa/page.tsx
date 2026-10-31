import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DamtechLogo } from "@/components/DamtechLogo";
import { MfaEnrolForm } from "@/components/admin/MfaEnrolForm";
import { SignOutButton } from "@/components/admin/SignOutButton";
import {
  AdminActionForm,
  AdminHelpText,
  AdminInput,
  AdminLabel,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { getAdminSession, getCurrentUser } from "@/lib/auth/get-current-user";
import { listTotpFactors, MFA_REMEMBER_DAYS, safeAdminNext } from "@/lib/auth/mfa";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpAction } from "./actions";

export const metadata: Metadata = { title: "Two-step verification" };

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

/**
 * Second sign-in step for every admin: set up an authenticator app once,
 * then enter its 6-digit code after each password or Google sign-in.
 */
export default async function AdminMfaPage({ searchParams }: PageProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect((await getCurrentUser()) ? "/admin/unauthorised/" : "/admin/login/");
  }

  const nextPath = safeAdminNext((await searchParams).next);
  if (session.aal === "aal2") {
    redirect(nextPath);
  }

  const factors = await listTotpFactors(await createClient());
  const hasApp = factors.some((factor) => factor.verified);

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <DamtechLogo size={48} />
          <div>
            <p className="admin-login__kicker">{session.user.email}</p>
            <h1 className="admin-login__heading">Two-step verification</h1>
          </div>
        </div>

        {hasApp ? (
          <AdminActionForm action={verifyTotpAction} className="admin-login__form">
            <input type="hidden" name="next" value={nextPath} />
            <div className="admin-login__field">
              <AdminLabel htmlFor="mfa-code" required>
                6-digit code from your authenticator app
              </AdminLabel>
              <AdminInput
                id="mfa-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,7}"
                maxLength={7}
                required
                autoFocus
              />
            </div>
            <AdminSubmitButton pendingLabel="Checking…">Verify</AdminSubmitButton>
            <AdminHelpText>
              You stay signed in on this device and won&apos;t be asked for a code
              again for {MFA_REMEMBER_DAYS} days, unless you sign out.
            </AdminHelpText>
          </AdminActionForm>
        ) : (
          <MfaEnrolForm nextPath={nextPath} />
        )}

        <AdminHelpText>
          Lost your phone? Ask the owner to remove your authenticator in
          Supabase (Authentication → Users → your account → MFA factors), then
          sign in and set it up again.
        </AdminHelpText>

        <div className="admin-mfa__signout">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
