import Link from "next/link";
import { DEFAULT_CATEGORY } from "@/lib/posts";

type BlogCategoryFilterProps = {
  activeCategory?: string;
};

const CATEGORIES = [DEFAULT_CATEGORY] as const;

export function BlogCategoryFilter({
  activeCategory = DEFAULT_CATEGORY,
}: BlogCategoryFilterProps) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Blog categories"
    >
      <Link
        href="/blog"
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          activeCategory === "all"
            ? "bg-water text-white"
            : "bg-white text-navy ring-1 ring-slate-200 hover:ring-water"
        }`}
      >
        All Posts
      </Link>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href="/category/uncategorized"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === category
              ? "bg-navy text-white"
              : "bg-white text-navy ring-1 ring-slate-200 hover:ring-water"
          }`}
        >
          {category}
        </Link>
      ))}
    </nav>
  );
}
