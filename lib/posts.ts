import postsData from "./posts-data.json";
import { BLOG_IMAGE_REWRITES } from "./images";

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
export const DEFAULT_CATEGORY = "Uncategorized";

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

  return output;
}

export const posts: BlogPost[] = (postsData as BlogPost[]).map((post) => ({
  ...post,
  category: post.category ?? DEFAULT_CATEGORY,
  content: rewriteBlogHtml(post.content),
}));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostSlugs(): string[] {
  return posts.map((post) => post.slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const currentIndex = posts.findIndex((post) => post.slug === slug);
  if (currentIndex === -1) return posts.slice(0, limit);

  const related: BlogPost[] = [];
  for (let i = 1; i < posts.length && related.length < limit; i++) {
    const index = (currentIndex + i) % posts.length;
    const candidate = posts[index];
    if (candidate.slug !== slug) {
      related.push(candidate);
    }
  }
  return related;
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
