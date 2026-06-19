import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/projects";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";
import { INDEXABLE_STATIC_PATHS } from "@/lib/site";

function isDisallowedSitemapPath(path: string): boolean {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return (
    normalised.startsWith("/_next") ||
    normalised.startsWith("/api/") ||
    normalised.startsWith("/category/") ||
    normalised.startsWith("/author/") ||
    normalised === "/thank-you" ||
    normalised === "/thank-you/"
  );
}

function staticPriority(path: string): number {
  if (path === "/") return 1;
  if (
    path === "/dam-liners" ||
    path === "/hdpe-dam-lining" ||
    path === "/pvc-dam-lining" ||
    path === "/torch-on-dam-lining" ||
    path === "/steel-water-storage-tanks" ||
    path === "/bitumen-waterproofing" ||
    path === "/contact" ||
    path === "/quote"
  ) {
    return 0.9;
  }
  if (path === "/projects" || path === "/blog") return 0.85;
  return 0.8;
}

/** Build sitemap entries for all indexable routes (used by app/sitemap.ts). */
export function buildSitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.filter(
    (path) => !isDisallowedSitemapPath(path),
  ).map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/blog" ? "weekly" : "monthly",
    priority: staticPriority(path),
  }));

  const projectEntries: MetadataRoute.Sitemap = getProjectSlugs().map((slug) => ({
    url: absoluteUrl(`/projects/${slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/${post.slug}`),
    lastModified: new Date(post.modified),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  const blogPages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, i) => ({
      url: absoluteUrl(`/blog/page/${i + 2}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
  );

  return [...staticEntries, ...projectEntries, ...postEntries, ...blogPages];
}
