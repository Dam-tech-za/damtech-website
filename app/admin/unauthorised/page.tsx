import { DamtechLogo } from "@/components/DamtechLogo";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { AdminButton } from "@/components/admin/ui";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { writeAuditLog } from "@/lib/auth/audit";

type PageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AdminUnauthorisedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    await writeAuditLog({
      actorUserId: user.id,
      actorEmail: user.email ?? null,
      action: "access_denied",
      entityType: "admin_auth",
      metadata: { reason: params.reason ?? "unauthorised_page", path: "/admin/unauthorised/" },
    });
  }

  const copy = messageForReason(params.reason);

  return (
    <main className="admin-login admin-login--denied">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <DamtechLogo size={48} />
          <div>
            <p className="admin-login__kicker">Access denied</p>
            <h1 className="admin-login__heading">Unauthorised</h1>
          </div>
        </div>
        <p className="admin-login__lead">{copy}</p>
        {user?.email ? (
          <p className="admin-login__notice">
            Signed in as <strong>{user.email}</strong>. This account is not on
            the Damtech admin allowlist, or it has been deactivated.
          </p>
        ) : (
          <p className="admin-login__notice">
            If you believe this is a mistake, contact a Damtech owner to be
            added to the approved-email allowlist.
          </p>
        )}
        <div className="admin-login__actions admin-login__actions--row">
          {user ? <SignOutButton /> : null}
          <AdminButton href="/admin/login/" variant="primary">
            Try another account
          </AdminButton>
          <AdminButton href="/" variant="secondary">
            Back to website
          </AdminButton>
        </div>
      </div>
    </main>
  );
}

function messageForReason(reason?: string): string {
  switch (reason) {
    case "inactive":
      return "Your admin profile is inactive. Ask an owner to reactivate access.";
    case "no_email":
      return "Google did not return an email address, so access cannot be verified.";
    case "not_allowlisted":
    default:
      return "You are signed in, but this Google account is not approved for Damtech Administration.";
  }
}
