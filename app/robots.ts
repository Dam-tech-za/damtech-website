import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PATHS, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${siteConfig.domain.replace(/\/$/, "")}/sitemap.xml`,
    host: siteConfig.domain.replace(/^https?:\/\//, ""),
  };
}
