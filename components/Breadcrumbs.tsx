import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** `dark` for navy hero backgrounds; `light` for white content areas. */
  variant?: "dark" | "light";
  className?: string;
};

export function Breadcrumbs({
  items,
  variant = "light",
  className = "",
}: BreadcrumbsProps) {
  if (items.length <= 1) {
    return null;
  }

  const linkClass =
    variant === "dark"
      ? "text-sky-200 hover:text-white"
      : "text-water hover:text-navy";
  const currentClass =
    variant === "dark" ? "text-white/90" : "text-slate-600";
  const separatorClass =
    variant === "dark" ? "text-slate-400" : "text-subtle";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden className={separatorClass}>
                  /
                </span>
              ) : null}
              {isLast ? (
                <span aria-current="page" className={currentClass}>
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className={linkClass}>
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
