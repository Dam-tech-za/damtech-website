import { useId } from "react";
import type { AdminFieldProps } from "./admin-field-types";
import { AdminFieldError } from "./AdminFieldError";
import { AdminHelpText } from "./AdminHelpText";
import { AdminLabel } from "./AdminLabel";

export function AdminField({
  id,
  label,
  htmlFor,
  required,
  description,
  error,
  children,
  className,
}: AdminFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? htmlFor ?? generatedId;
  const descriptionId = description ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div
      className={[
        "admin-field",
        error ? "admin-field--invalid" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ? (
        <AdminLabel htmlFor={fieldId} required={required}>
          {label}
        </AdminLabel>
      ) : null}
      {description ? (
        <AdminHelpText id={descriptionId}>{description}</AdminHelpText>
      ) : null}
      {children}
      {error ? <AdminFieldError id={errorId}>{error}</AdminFieldError> : null}
    </div>
  );
}
