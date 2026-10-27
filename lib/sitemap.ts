import type { MetadataRoute } from "next";
import {
  catalogueProductUrlPath,
  CATALOGUE_PRODUCTS,
  getSchemaImageUrls,
} from "@/lib/catalogue";
import { getProjectSlugs } from "@/lib/projects";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import { blogPostPath } from "@/lib/blog-url-moves";
import { absoluteUrl } from "@/lib/seo";
import { INDEXABLE_STATIC_PATHS } from "@/lib/site";
import { SITEMAP_LASTMOD } from "@/lib/sitemap-lastmod.generated";

function isDisallowedSitemapPath(path: string): boolean {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return (
    normalised.startsWith("/_next") ||
    normalised.startsWith("/api/") ||
    normalised.startsWith("/admin/") ||
    normalised.startsWith("/auth/") ||
    normalised.startsWith("/q/") ||
    normalised.startsWith("/category/") ||
    normalised.startsWith("/author/") ||
    normalised === "/thank-you" ||
    normalised === "/thank-you/" ||
    normalised.startsWith("/quote/success") ||
    normalised.startsWith("/order") ||
    normalised.startsWith("/feeds") ||
    /\/quote\/.+\/upload/.test(normalised)
  );
}

function dedupeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

/**
 * Fallback lastmod for a URL missing from `SITEMAP_LASTMOD` (run
 * `node scripts/generate-sitemap-lastmod.mjs` after content changes). Never use the
 * build time — Google ignores lastmod that changes on every deploy.
 */
export const PAGES_LAST_MODIFIED = new Date("2026-10-19T00:00:00+02:00");

/** Midday SAST keeps the UTC date in sitemap.xml equal to the local calendar date. */
const SAST_MIDDAY = "T12:00:00+02:00";

function pageLastModified(path: string): Date {
  const date = SITEMAP_LASTMOD[path];
  return date ? new Date(`${date}${SAST_MIDDAY}`) : PAGES_LAST_MODIFIED;
}

function latest(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/** Build sitemap entries for all indexable routes (used by app/sitemap.ts). */
export function buildSitemap(): MetadataRoute.Sitemap {
  const newestPost = latest(...posts.map((post) => new Date(post.modified)));

  const staticEntries: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.filter(
    (path) => !isDisallowedSitemapPath(path),
  ).map((path) => ({
    url: absoluteUrl(path),
    lastModified:
      path === "/blog" ? latest(pageLastModified(path), newestPost) : pageLastModified(path),
  }));

  const catalogueEntries: MetadataRoute.Sitemap = CATALOGUE_PRODUCTS.map(
    (product) => {
      const path = catalogueProductUrlPath(product).replace(/\/$/, "");
      const schemaImages = getSchemaImageUrls(product.images);
      return {
        url: absoluteUrl(path),
        lastModified: pageLastModified(path),
        ...(schemaImages.length > 0 ? { images: schemaImages } : {}),
      };
    },
  );

  const projectEntries: MetadataRoute.Sitemap = getProjectSlugs().map((slug) => ({
    url: absoluteUrl(`/projects/${slug}`),
    lastModified: pageLastModified(`/projects/${slug}`),
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(blogPostPath(post.slug)),
    lastModified: new Date(post.modified),
  }));

  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  const blogPages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, i) => ({
      url: absoluteUrl(`/blog/page/${i + 2}`),
      lastModified: latest(pageLastModified("/blog"), newestPost),
    }),
  );

  return dedupeSitemap([
    ...staticEntries,
    ...catalogueEntries,
    ...projectEntries,
    ...postEntries,
    ...blogPages,
  ]);
}
