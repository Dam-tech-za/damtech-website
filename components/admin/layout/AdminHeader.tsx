import { AdminBreadcrumbs, type AdminBreadcrumb } from "./AdminBreadcrumbs";
import { AdminUserMenu } from "./AdminUserMenu";
import { AdminIconButton } from "@/components/admin/ui/AdminIconButton";

type AdminHeaderProps = {
  title: string;
  breadcrumbs: AdminBreadcrumb[];
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
  onMenuToggleId?: string;
  showTitle?: boolean;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
};

export function AdminHeader({
  title,
  breadcrumbs,
  email,
  fullName,
  role,
  avatarUrl,
  onMenuToggleId = "admin-mobile-nav-toggle",
  showTitle = false,
  sidebarCollapsed = false,
  onExpandSidebar,
}: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <label
          htmlFor={onMenuToggleId}
          className="admin-header__menu-btn"
          aria-label="Open navigation"
        >
          <span />
          <span />
          <span />
        </label>
        {sidebarCollapsed && onExpandSidebar ? (
          <AdminIconButton
            className="admin-header__sidebar-expand"
            label="Expand sidebar navigation"
            onClick={onExpandSidebar}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M4 6h11M4 12h11M4 18h7M17 6l3 2-3 2M17 12l3 2-3 2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </AdminIconButton>
        ) : null}
        <div>
          <AdminBreadcrumbs items={breadcrumbs} />
          {showTitle ? (
            <p className="admin-header__context">{title}</p>
          ) : null}
        </div>
      </div>
      <div className="admin-header__right">
        <AdminUserMenu
          email={email}
          fullName={fullName}
          role={role}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}
