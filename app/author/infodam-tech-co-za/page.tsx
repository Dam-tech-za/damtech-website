import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import { BLOG_AUTHOR } from "@/lib/site";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

const seo = PAGE_SEO.author;
const pagination = paginatePosts(posts, 1, POSTS_PER_PAGE);

export const metadata = createPageMetadata(seo, { noIndex: true });

export default function AuthorPage() {
  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Andre de Lange", path: seo.path },
        ]}
      />

      <Hero
        compact
        title={seo.h1}
        description={BLOG_AUTHOR.bio}
      />

      <section className="content-wrap">
        <div className="content-grid">
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
