import postsData from "./posts-data.json";
import { BLOG_IMAGE_REWRITES } from "./images";
import { rewriteInternalLinks } from "./internal-links";
import { topicOverlapScore } from "./post-topics";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  metaTitle: string;
  metaDescription: string;
  category?: string;
};

export const POSTS_PER_PAGE = 10;
export const DEFAULT_CATEGORY = "Dam Liner Guides";

export const BLOG_CATEGORIES = [
  "Dam Liner Guides",
  "Leak Repair",
  "Steel Reservoirs",
  "Borehole & Irrigation",
  "Waterproofing",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** Assign a meaningful category from slug and title when JSON has no category. */
export function inferPostCategory(slug: string, title: string): BlogCategory {
  const text = `${slug} ${title}`.toLowerCase();

  if (/\bleak|repair|seepage|failure\b/.test(text)) {
    return "Leak Repair";
  }
  if (/\bsteel|corrugated|reservoir|tank\b/.test(text)) {
    return "Steel Reservoirs";
  }
  if (/\bborehole|irrigation\b/.test(text)) {
    return "Borehole & Irrigation";
  }
  if (/\bwaterproof|bitumen|roof\b/.test(text)) {
    return "Waterproofing";
  }

  return "Dam Liner Guides";
}

export function rewriteBlogHtml(html: string): string {
  let output = html;

  for (const [oldUrl, { src }] of Object.entries(BLOG_IMAGE_REWRITES)) {
    output = output.split(oldUrl).join(src);
  }

  output = output.replace(/<img\b[^>]*>/gi, (tag) => {
    const src =
      tag.match(/\bsrc="([^"]+)"/i)?.[1] ??
      tag.match(/\bdata-src="([^"]+)"/i)?.[1];

    if (!src?.startsWith("/images/")) {
      return tag;
    }

    const rewrite = Object.values(BLOG_IMAGE_REWRITES).find((item) => item.src === src);
    const alt = rewrite?.alt ?? tag.match(/\balt="([^"]*)"/i)?.[1] ?? "";

    return `<img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" />`;
  });

  output = output.replace(/<h1\b([^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");

  output = rewriteInternalLinks(output);

  return output;
}

export const posts: BlogPost[] = (postsData as BlogPost[]).map((post) => ({
  ...post,
  category: post.category ?? inferPostCategory(post.slug, post.title),
  content: rewriteBlogHtml(post.content),
}));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostSlugs(): string[] {
  return posts.map((post) => post.slug);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function stripLeadingTitle(text: string, title: string): string {
  const normalised = text.trim();
  const titleLower = title.toLowerCase();
  if (normalised.toLowerCase().startsWith(titleLower)) {
    return normalised.slice(title.length).trim();
  }
  return normalised;
}

function looksTruncated(text: string): boolean {
  const trimmed = text.trim();
  if (/[.!?…]["']?$/.test(trimmed)) return false;
  if (trimmed.length >= 155) return true;
  const lastWord = trimmed.split(/\s+/).at(-1) ?? "";
  if (lastWord.length <= 2) return true;
  return trimmed.length >= 70;
}

function isLowQualityMetaDescription(text: string, title: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 50) return true;
  if (trimmed.toLowerCase().startsWith(title.toLowerCase().slice(0, 40))) {
    return true;
  }
  return looksTruncated(trimmed);
}

/** Prefer a clean, unique meta description — not a duplicated title prefix or WP truncation. */
export function resolvePostDescription(post: BlogPost): string {
  const title = (post.metaTitle || post.title).trim();
  const fromContent = stripLeadingTitle(
    stripHtml(post.content).slice(0, 500),
    title,
  );

  for (const value of [post.metaDescription, post.excerpt]) {
    const candidate = stripLeadingTitle(stripHtml(value ?? ""), title);
    if (
      candidate.length >= 40 &&
      !isLowQualityMetaDescription(candidate, title)
    ) {
      return candidate;
    }
  }

  if (fromContent.length >= 40) {
    return fromContent;
  }

  return fromContent || title;
}

/** Shorter excerpt for blog cards — avoids title duplication and truncation artifacts. */
export function resolvePostExcerpt(post: BlogPost, maxLength = 140): string {
  const description = resolvePostDescription(post);
  if (description.length <= maxLength) {
    return description;
  }
  const trimmed = description.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${trimmed}…`;
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return posts.slice(0, limit);

  const currentText = `${current.title} ${stripHtml(current.content)}`;

  const scored = posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: topicOverlapScore(currentText, `${post.title} ${stripHtml(post.content)}`),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length >= limit) {
    return scored.slice(0, limit).map((entry) => entry.post);
  }

  const related: BlogPost[] = scored.map((entry) => entry.post);
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  for (let i = 1; related.length < limit && i < posts.length; i++) {
    const index = (currentIndex + i) % posts.length;
    const candidate = posts[index];
    if (candidate.slug !== slug && !related.some((post) => post.slug === candidate.slug)) {
      related.push(candidate);
    }
  }

  return related.slice(0, limit);
}

export function paginatePosts<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    totalItems: items.length,
  };
}
