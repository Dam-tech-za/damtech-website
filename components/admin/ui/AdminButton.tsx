import Link from "next/link";
import { forwardRef } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type AdminButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link";

type AdminButtonSize = "sm" | "md" | "lg";

type AdminButtonBaseProps = {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
  children: ReactNode;
};

type AdminButtonAsButton = AdminButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AdminButtonAsLink = AdminButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type AdminButtonProps = AdminButtonAsButton | AdminButtonAsLink;

function buttonClassName(
  variant: AdminButtonVariant,
  size: AdminButtonSize,
  className?: string,
) {
  return [
    "admin-btn",
    `admin-btn--${variant}`,
    size !== "md" ? `admin-btn--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export const AdminButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  AdminButtonProps
>(function AdminButton(
  {
    variant = "secondary",
    size = "md",
    className,
    children,
    ...props
  },
  ref,
) {
  const classes = buttonClassName(variant, size, className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} ref={ref as never} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type="button"
      className={classes}
      ref={ref as never}
      {...buttonProps}
    >
      {children}
    </button>
  );
});
