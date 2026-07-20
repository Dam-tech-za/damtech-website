import type { InputHTMLAttributes, ReactNode } from "react";

type AdminCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export function AdminCheckbox({
  label,
  className,
  id,
  ...props
}: AdminCheckboxProps) {
  return (
    <label
      className={["admin-checkbox-field", className].filter(Boolean).join(" ")}
    >
      <input type="checkbox" className="admin-checkbox-field__input" id={id} {...props} />
      <span className="admin-checkbox-field__label">{label}</span>
    </label>
  );
}
