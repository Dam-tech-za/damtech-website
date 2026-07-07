import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { categoryPath, POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

const seo = PAGE_SEO.category;
const pagination = paginatePosts(posts, 1, POSTS_PER_PAGE);
const categoryBasePath = categoryPath();

const CATEGORY_BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: seo.h1, path: seo.path },
] as const;

export const metadata = createPageMetadata(seo, {
  noIndex: true,
  canonicalPath: "/blog",
});

export default function CategoryPage() {
  return (
    <>
      <PageSeo breadcrumbs={[...CATEGORY_BREADCRUMBS]} />

      <Hero
        compact
        title={seo.h1}
        description="Practical guides on dam liners, steel reservoirs, leak repair, borehole integration and waterproofing for South African farms and properties."
        breadcrumbs={[...CATEGORY_BREADCRUMBS]}
      />

      <section className="content-wrap">
        <div className="content-grid">
          {pagination.items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath={categoryBasePath}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      </section>

      <CTA />
    </>
  );
}
