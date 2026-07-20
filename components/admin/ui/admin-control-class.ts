export function adminControlClassName(
  invalid?: boolean,
  className?: string,
): string {
  return [
    "admin-input",
    invalid ? "admin-input--invalid" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
