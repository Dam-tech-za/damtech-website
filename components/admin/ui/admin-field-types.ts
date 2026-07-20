import type { ReactNode } from "react";

export type AdminFieldProps = {
  id?: string;
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};
