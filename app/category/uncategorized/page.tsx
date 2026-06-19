import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";

const seo = PAGE_SEO.category;
const pagination = paginatePosts(posts, 1, POSTS_PER_PAGE);

export const metadata = createPageMetadata(seo, {
  noIndex: true,
  canonicalPath: "/blog",
});

export default function CategoryPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Uncategorized", path: seo.path },
        ]}
      />

      <Hero compact title={seo.h1} description="Damtech articles and guides." />

      <section className="content-wrap">
        <div className="grid gap-6 md:grid-cols-2">
          {pagination.items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath="/category/uncategorized"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      </section>

      <CTA />
    </>
  );
}
