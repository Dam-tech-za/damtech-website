import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageSeo } from "@/components/PageSeo";
import { Prose } from "@/components/Prose";
import { getPostCta, getPostServiceLinks } from "@/lib/internal-links";
import { createArticleSchema, createMetadata } from "@/lib/seo";
import { DEFAULT_OG_IMAGE } from "@/lib/images";
import { getPostBySlug, getPostSlugs, getRelatedPosts, resolvePostDescription } from "@/lib/posts";
import { getSubServiceSlugs } from "@/lib/sub-service-pages";
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

const RESERVED = new Set([
  "about-us-waterproofing-company",
  "agricultural-water-storage",
  "bitumen-waterproofing-services-and-more",
  "bitumen-waterproofing",
  "blog",
  "category",
  "contact",
  "dam-liners",
  "dam-lining-cost-south-africa",
  "dam-repair-services",
  "farm-dam-liners",
  "johannesburg-dam-liners",
  "limpopo-dam-liners",
  "mining-dam-liners",
  "mpumalanga-dam-liners",
  "pretoria-dam-liners",
  "projects",
  "quote",
  "reservoir-lining",
  "services",
  "steel-water-storage-tanks",
  "thank-you",
  "faq",
  "western-cape-dam-liners",
  "author",
  ...getSubServiceSlugs(),
]);

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return createMetadata({
    title: post.metaTitle || post.title,
    description: resolvePostDescription(post),
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

  const description = resolvePostDescription(post);
  const relatedPosts = getRelatedPosts(slug, 3);
  const serviceLinks = getPostServiceLinks(post);
  const postCta = getPostCta(post);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/${post.slug}` },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
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
        <header className="-mt-[var(--header-height)] bg-gradient-to-br from-navy to-slate-800 pt-[calc(var(--header-height)+3rem)] pb-12 text-white sm:pt-[calc(var(--header-height)+3.5rem)] sm:pb-16">
          <div className="site-container max-w-3xl">
            <Breadcrumbs items={breadcrumbs} variant="dark" className="mb-4" />
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              By{" "}
              <Link href={BLOG_AUTHOR.path} className="font-medium text-sky-200 hover:text-white">
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
