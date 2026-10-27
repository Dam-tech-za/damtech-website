import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageSeo } from "@/components/PageSeo";
import { Prose } from "@/components/Prose";
import { getPostCta, getPostServiceLinks } from "@/lib/internal-links";
import { createArticleSchema, createMetadata } from "@/lib/seo";
import { DEFAULT_OG_IMAGE } from "@/lib/images";
import { getPostBySlug, getPostSlugs, getRelatedPosts, resolvePostDescription } from "@/lib/posts";
import { blogPostPath } from "@/lib/blog-url-moves";
import { BLOG_AUTHOR } from "@/lib/site";
import {
  LazyCTA as CTA,
  LazyInternalServiceLinks as InternalServiceLinks,
  LazyPostCallToAction as PostCallToAction,
  LazyPostServiceLinks as PostServiceLinks,
  LazyRelatedPosts as RelatedPosts,
} from "@/components/lazy";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    // Unknown slugs render the 404 page — never inherit the homepage title/canonical.
    return {
      title: { absolute: "Page Not Found | Damtech" },
      // Next.js adds its own noindex to not-found responses; a second robots
      // tag here only duplicated it.
      robots: null,
      alternates: { canonical: null },
    };
  }

  return createMetadata({
    title: post.metaTitle || post.title,
    description: resolvePostDescription(post),
    path: blogPostPath(post.slug),
    image: DEFAULT_OG_IMAGE,
    ogType: "article",
    publishedTime: post.date,
    modifiedTime: post.modified,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const description = resolvePostDescription(post);
  const relatedPosts = getRelatedPosts(slug, 3);
  const serviceLinks = getPostServiceLinks(post);
  const postCta = getPostCta(post);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: blogPostPath(post.slug) },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={createArticleSchema({
          title: post.title,
          description,
          path: blogPostPath(post.slug),
          datePublished: post.date,
          dateModified: post.modified,
          image: DEFAULT_OG_IMAGE,
        })}
      />

      <article>
        <header className="dt-article-hero">
          <div className="site-container max-w-3xl">
            <Breadcrumbs items={breadcrumbs} variant="light" className="mb-6" />
            <p className="dt-eyebrow">Damtech guide</p>
            <h1 className="dt-article-hero__title">
              {post.title}
            </h1>
            <p className="dt-article-hero__meta">
              By{" "}
              <Link href={BLOG_AUTHOR.path} className="dt-article-hero__author">
                {BLOG_AUTHOR.name}
              </Link>
              <span className="mx-2" aria-hidden>
                ·
              </span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.modified &&
              post.modified.slice(0, 10) > post.date.slice(0, 10) ? (
                <>
                  <span className="mx-2" aria-hidden>
                    ·
                  </span>
                  Updated{" "}
                  <time dateTime={post.modified}>
                    {new Date(post.modified).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </>
              ) : null}
            </p>
          </div>
        </header>

        <div className="site-container max-w-3xl py-10 lg:py-12">
          <Prose html={post.content} />
          <PostServiceLinks links={serviceLinks} />
          <PostCallToAction
            heading={postCta.heading}
            description={postCta.description}
            buttonText={postCta.buttonText}
            buttonHref={postCta.buttonHref}
          />
        </div>
      </article>

      <RelatedPosts posts={relatedPosts} />
      <InternalServiceLinks heading="Explore Our Services" />
      <CTA
        title={postCta.heading}
        description={postCta.description}
      />
    </>
  );
}
