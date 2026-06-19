import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
};

export function BlogPagination({
  basePath,
  currentPage,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number) =>
    page === 1 ? basePath : `${basePath}/page/${page}`;

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          rel="prev"
          className="btn-secondary text-sm"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-slate-600">
        Page {currentPage} of {totalPages}
      </p>
      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          rel="next"
          className="btn-secondary text-sm"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
