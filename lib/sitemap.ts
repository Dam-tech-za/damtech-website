import type { MetadataRoute } from "next";
import {
  catalogueProductUrlPath,
  CATALOGUE_PRODUCTS,
  getSchemaImageUrls,
} from "@/lib/catalogue";
import { getProjectSlugs } from "@/lib/projects";
import { POSTS_PER_PAGE, paginatePosts, posts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";
import { INDEXABLE_STATIC_PATHS } from "@/lib/site";

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

function staticChangeFrequency(
  path: string,
): NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]> {
  if (path === "/" || path === "/blog") return "weekly";
  return "monthly";
}

function dedupeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

/** Build sitemap entries for all indexable routes (used by app/sitemap.ts). */
export function buildSitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.filter(
    (path) => !isDisallowedSitemapPath(path),
  ).map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: staticChangeFrequency(path),
  }));

  const catalogueEntries: MetadataRoute.Sitemap = CATALOGUE_PRODUCTS.map(
    (product) => {
      const schemaImages = getSchemaImageUrls(product.images);
      return {
        url: absoluteUrl(catalogueProductUrlPath(product)),
        changeFrequency: "monthly" as const,
        ...(schemaImages.length > 0 ? { images: schemaImages } : {}),
      };
    },
  );

  const projectEntries: MetadataRoute.Sitemap = getProjectSlugs().map((slug) => ({
    url: absoluteUrl(`/projects/${slug}`),
    changeFrequency: "monthly" as const,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/${post.slug}`),
    lastModified: new Date(post.modified),
    changeFrequency: "monthly",
  }));

  const { totalPages } = paginatePosts(posts, 1, POSTS_PER_PAGE);
  const blogPages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, i) => ({
      url: absoluteUrl(`/blog/page/${i + 2}`),
      changeFrequency: "weekly" as const,
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
