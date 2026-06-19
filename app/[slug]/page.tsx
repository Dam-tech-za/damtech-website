import Link from "next/link";
import { notFound } from "next/navigation";
import { CTA } from "@/components/CTA";
import { InternalServiceLinks } from "@/components/InternalServiceLinks";
import { PageSeo } from "@/components/PageSeo";
import { Prose } from "@/components/Prose";
import { RelatedPosts } from "@/components/RelatedPosts";
import { createArticleSchema, createMetadata } from "@/lib/seo";
import { DEFAULT_OG_IMAGE } from "@/lib/images";
import { getPostBySlug, getPostSlugs, getRelatedPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

const RESERVED = new Set([
  "about-us-waterproofing-company",
  "bitumen-waterproofing-services-and-more",
  "bitumen-waterproofing",
  "blog",
  "category",
  "contact",
  "dam-liners",
  "steel-water-storage-tanks",
  "waterproofing-and-dam-liners",
  "author",
]);

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const description =
    post.metaDescription?.trim() || post.excerpt.trim() || "";

  return createMetadata({
    title: post.metaTitle || post.title,
    description,
    path: `/${post.slug}`,
    image: DEFAULT_OG_IMAGE,
    ogType: "article",
    publishedTime: post.date,
    modifiedTime: post.modified,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  if (RESERVED.has(slug)) {
    notFound();
  }

  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const description =
    post.metaDescription?.trim() || post.excerpt.trim() || "";
  const relatedPosts = getRelatedPosts(slug, 3);

  return (
    <>
      <PageSeo
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/${post.slug}` },
        ]}
        schemas={createArticleSchema({
          title: post.title,
          description,
          path: `/${post.slug}`,
          datePublished: post.date,
          dateModified: post.modified,
          image: DEFAULT_OG_IMAGE,
        })}
      />

      <article>
        <header className="bg-gradient-to-br from-navy to-slate-800 py-12 text-white sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-sm text-sky-200">
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
              <span className="mx-2">/</span>
              <span>{post.category}</span>
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <time
              dateTime={post.date}
              className="mt-4 block text-sm text-slate-300"
            >
              {new Date(post.date).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Prose html={post.content} />
        </div>
      </article>

      <RelatedPosts posts={relatedPosts} />
      <InternalServiceLinks heading="Explore Our Services" />
      <CTA />
    </>
  );
}
