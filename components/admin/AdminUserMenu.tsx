import { SignOutButton } from "./SignOutButton";

type AdminUserMenuProps = {
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
};

export function AdminUserMenu({
  email,
  fullName,
  role,
  avatarUrl,
}: AdminUserMenuProps) {
  const initials = (fullName || email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="admin-user-menu">
      <div className="admin-user-menu__identity">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar
          <img
            src={avatarUrl}
            alt=""
            width={36}
            height={36}
            className="admin-user-menu__avatar"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="admin-user-menu__initials" aria-hidden>
            {initials || "A"}
          </span>
        )}
        <div className="admin-user-menu__text">
          <span className="admin-user-menu__name">{fullName || email}</span>
          <span className="admin-user-menu__meta">
            {role} · {email}
          </span>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}
