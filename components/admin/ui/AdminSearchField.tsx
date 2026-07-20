import type { InputHTMLAttributes } from "react";
import { AdminInput } from "./AdminInput";

type AdminSearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  showIcon?: boolean;
};

export function AdminSearchField({
  label = "Search",
  showIcon = true,
  className,
  id,
  ...props
}: AdminSearchFieldProps) {
  const fieldId = id ?? props.name ?? "admin-search";

  return (
    <label className="admin-search-field" htmlFor={fieldId}>
      <span className="sr-only">{label}</span>
      {showIcon ? (
        <svg
          className="admin-search-field__icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M16 16l5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      <AdminInput
        id={fieldId}
        type="search"
        className={["admin-search-field__input", className]
          .filter(Boolean)
          .join(" ")}
        aria-label={label}
        {...props}
      />
    </label>
  );
}
