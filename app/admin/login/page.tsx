import Link from "next/link";
import { DamtechLogo } from "@/components/DamtechLogo";
import { GoogleSignInButton } from "@/components/admin/GoogleSignInButton";
import { getCurrentAdmin } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";

type PageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin/");
  }

  const params = await searchParams;
  const errorMessage = mapLoginError(params.error);
  const nextPath =
    params.next && params.next.startsWith("/admin") ? params.next : "/admin/";
  const configured = isSupabasePublicConfigured();

  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <DamtechLogo size={48} />
          <div>
            <p className="admin-login__kicker">Internal access only</p>
            <h1 className="admin-login__heading">Damtech Administration</h1>
          </div>
        </div>

        <p className="admin-login__lead">
          Sign in with your approved Google account to manage RFQs, quotes and
          operational records. There is no public registration.
        </p>

        {!configured ? (
          <p className="admin-login__error" role="alert">
            Admin authentication is not configured. Set{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> on the server.
          </p>
        ) : (
          <GoogleSignInButton nextPath={nextPath} />
        )}

        {errorMessage ? (
          <p className="admin-login__error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <p className="admin-login__notice">
          Access is restricted to Damtech team members on the approved-email
          allowlist. Unapproved Google accounts are denied automatically.
        </p>

        <Link href="/" className="admin-login__back">
          ← Back to dam-tech.co.za
        </Link>
      </div>
    </main>
  );
}

function mapLoginError(code?: string): string | null {
  switch (code) {
    case "missing_code":
      return "Sign-in was cancelled or incomplete. Please try again.";
    case "auth_exchange_failed":
      return "We could not complete Google sign-in. Please try again.";
    case "auth_not_configured":
      return "Admin authentication is not configured on this environment.";
    default:
      return null;
  }
}
