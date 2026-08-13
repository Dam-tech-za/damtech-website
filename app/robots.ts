import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/site-url";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/site";

const origin = CANONICAL_ORIGIN.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/images/", "/_next/image"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: "www.dam-tech.co.za",
  };
}
