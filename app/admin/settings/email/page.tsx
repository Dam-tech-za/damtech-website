import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { isResendConfigured } from "@/lib/email";

export default async function AdminEmailSettingsPage() {
  await requireAdmin({ permission: "manageSettings" });
  const configured = isResendConfigured();

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Email delivery"
        description="Sender address, reply-to, notifications and test delivery."
        secondaryAction={{ href: "/admin/settings/", label: "All settings" }}
      />

      <div className="admin-panel">
        <header className="admin-panel__header">
          <h2>Email settings</h2>
        </header>
        <p>
          Customer quotations are sent with Resend. Configure these environment
          variables on Vercel (not in the database):
        </p>
        <ul className="admin-list">
          <li>
            <code>RESEND_API_KEY</code> —{" "}
            {configured ? "present on this runtime" : "missing"}
          </li>
          <li>
            <code>QUOTE_FROM_EMAIL</code> — verified sender for outbound quotes
          </li>
          <li>
            <code>QUOTE_REPLY_TO_EMAIL</code> — customer reply destination
          </li>
          <li>
            <code>QUOTE_INTERNAL_NOTIFY_EMAIL</code> — optional internal accept/reject
            alerts (defaults to LEAD_INBOX_EMAIL)
          </li>
        </ul>
        <p className="admin-empty__hint">
          See <code>docs/email-setup.md</code> for domain verification steps.
        </p>
      </div>
    </div>
  );
}
