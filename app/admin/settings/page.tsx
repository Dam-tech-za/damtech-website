import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export default function AdminSettingsPage() {
  return (
    <AdminModulePlaceholder
      navId="settings"
      title="Settings"
      description="Allowlist management and role administration UI will land in a later phase. Use SQL for now — see docs/admin-auth-setup.md."
    />
  );
}
