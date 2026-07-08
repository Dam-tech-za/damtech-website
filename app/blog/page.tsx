import { BlogCard } from "@/components/BlogCard";
import { BlogCategoryFilter } from "@/components/BlogCategoryFilter";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
} from "@/components/lazy";

const seo = PAGE_SEO.blog;
const pagination = paginatePosts(posts, 1, POSTS_PER_PAGE);

export const metadata = createPageMetadata(seo);

export default function BlogPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: seo.path },
  ];

  return (
    <>
      <PageSeo breadcrumbs={breadcrumbs} />

      <Hero
        compact
        title={seo.h1}
        description="Practical guides on farm dam linings, leak repair, borehole integration, steel reservoir maintenance and water storage for South African agriculture."
        breadcrumbs={breadcrumbs}
      />

      <section className="content-wrap">
        <div className="max-w-3xl">
          <p className="text-slate-600 leading-relaxed">
            Welcome to the Damtech blog. Here we share field-tested advice on
            protecting and optimising your water storage — from HDPE dam lining
            and corrugated steel reservoirs to waterproofing and preventative
            maintenance. Browse articles below or filter by category.
          </p>
        </div>

        <div className="mt-8">
          <BlogCategoryFilter activeCategory="all" />
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Showing {pagination.items.length} of {pagination.totalItems} articles
        </p>

        <div className="mt-6 content-grid">
          {pagination.items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        <BlogPagination
          basePath="/blog"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      </section>

      <InternalServiceLinks heading="Explore Our Services" />
      <CTA />
    </>
  );
}
