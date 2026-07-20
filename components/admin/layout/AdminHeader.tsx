import { AdminBreadcrumbs, type AdminBreadcrumb } from "./AdminBreadcrumbs";
import { AdminUserMenu } from "./AdminUserMenu";

type AdminHeaderProps = {
  title: string;
  breadcrumbs: AdminBreadcrumb[];
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
  onMenuToggleId?: string;
  showTitle?: boolean;
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
