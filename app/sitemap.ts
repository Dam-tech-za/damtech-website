import type { MetadataRoute } from "next";
import { INDEXABLE_STATIC_PATHS } from "@/lib/site";
import { getProjectSlugs } from "@/lib/projects";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.8,
    }),
  );

  const projectEntries: MetadataRoute.Sitemap = getProjectSlugs().map(
    (slug) => ({
      url: absoluteUrl(`/projects/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/${post.slug}`),
    lastModified: new Date(post.modified),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  const blogPages: MetadataRoute.Sitemap = Array.from(
    { length: totalPages - 1 },
    (_, i) => ({
      url: absoluteUrl(`/blog/page/${i + 2}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
  );

  return [...staticEntries, ...projectEntries, ...postEntries, ...blogPages];
}
