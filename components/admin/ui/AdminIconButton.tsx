import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  isOpen?: boolean;
};

export function AdminIconButton({
  label,
  children,
  className,
  isOpen,
  ...props
}: AdminIconButtonProps) {
  return (
    <button
      type="button"
      className={[
        "admin-icon-btn",
        isOpen ? "is-open" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
