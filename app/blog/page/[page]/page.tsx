import { notFound } from "next/navigation";
import { BlogCategoryFilter } from "@/components/BlogCategoryFilter";
import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

type Props = {
  params: Promise<{ page: string }>;
};

const blogSeo = PAGE_SEO.blog;

export async function generateStaticParams() {
  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { page } = await params;
  const pageNumber = Number(page);

  return createPageMetadata(blogSeo, {
    title: `${blogSeo.title} — Page ${pageNumber}`,
    description: `Page ${pageNumber} of Damtech blog articles on farm dam liners, steel reservoirs, waterproofing and water storage in South Africa.`,
    path: `/blog/page/${page}`,
  });
}

export default async function BlogPaginatedPage({ params }: Props) {
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
    { name: "Blog", path: blogSeo.path },
    { name: `Page ${currentPage}`, path: `/blog/page/${currentPage}` },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />

      <Hero
        compact
        title={blogSeo.h1}
        description={`Page ${currentPage} of ${totalPages} — farm dam, waterproofing and water storage articles.`}
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <BlogCategoryFilter activeCategory="all" />
        <div className="mt-8 content-grid">
          {items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath="/blog"
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>

      <InternalServiceLinks heading="Explore Our Services" />
      <CTA />
    </>
  );
}
