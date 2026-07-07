import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { categoryPath, POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

type Props = {
  params: Promise<{ page: string }>;
};

const categorySeo = PAGE_SEO.category;
const categoryBasePath = categoryPath();

export async function generateStaticParams() {
  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { page } = await params;
  const pageNumber = Number(page);

  return createPageMetadata(categorySeo, {
    title: `${categorySeo.title} — Page ${pageNumber}`,
    path: `${categoryBasePath}/page/${page}`,
    noIndex: true,
    canonicalPath: "/blog",
  });
}

export default async function CategoryPaginatedPage({ params }: Props) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const { items, currentPage, totalPages } = paginatePosts(
    posts,
    pageNumber,
    POSTS_PER_PAGE,
  );

  if (currentPage !== pageNumber) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: categorySeo.h1, path: categorySeo.path },
    {
      name: `Page ${currentPage}`,
      path: `${categoryBasePath}/page/${currentPage}`,
    },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />

      <Hero
        compact
        title={categorySeo.h1}
        description={`Page ${currentPage} of ${totalPages}.`}
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="content-grid">
          {items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath={categoryBasePath}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>

      <CTA />
    </>
  );
}
