import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { CTA } from "@/components/CTA";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";

const seo = PAGE_SEO.author;
const pagination = paginatePosts(posts, 1, POSTS_PER_PAGE);

export const metadata = createPageMetadata(seo, { noIndex: true });

export default function AuthorPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Tiaan", path: seo.path },
        ]}
      />

      <Hero compact title={seo.h1} description="Author at Damtech." />

      <section className="content-wrap">
        <div className="grid gap-6 md:grid-cols-2">
          {pagination.items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath="/author/infodam-tech-co-za"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
        />
      </section>

      <CTA />
    </>
  );
}
