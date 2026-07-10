import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import { BlogPagination } from "@/components/BlogPagination";
import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import {
  LazyCTA as CTA,
} from "@/components/lazy";

type Props = {
  params: Promise<{ page: string }>;
};

const authorSeo = PAGE_SEO.author;

export async function generateStaticParams() {
  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { page } = await params;
  const pageNumber = Number(page);

  return createPageMetadata(authorSeo, {
    title: `${authorSeo.title} — Page ${pageNumber}`,
    path: `/author/infodam-tech-co-za/page/${page}`,
    noIndex: true,
  });
}

export default async function AuthorPaginatedPage({ params }: Props) {
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

  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Andre de Lange", path: authorSeo.path },
          {
            name: `Page ${currentPage}`,
            path: `/author/infodam-tech-co-za/page/${currentPage}`,
          },
        ]}
      />

      <Hero
        compact
        title={authorSeo.h1}
        description={`Page ${currentPage} of ${totalPages}.`}
      />

      <section className="content-wrap">
        <div className="content-grid">
          {items.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <BlogPagination
          basePath="/author/infodam-tech-co-za"
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </section>

      <CTA />
    </>
  );
}
