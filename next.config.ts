import type { NextConfig } from "next";
import { redirects } from "./lib/redirects";

const supabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  process.env.SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  "*.supabase.co";

// Allow GTM → GA4 (G-F01WG96KRG) + Consent Mode / ads signals + Meta Pixel.
// See https://developers.google.com/tag-platform/security/guides/csp
// Dev only: React needs 'unsafe-eval' for debugging (never added in production).
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  [
    "img-src 'self' data: blob:",
    "https://*.googleusercontent.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    // GA4 Google Signals audiences use the visitor's regional Google domain.
    "https://www.google.co.za",
    "https://googleads.g.doubleclick.net",
    "https://www.googleadservices.com",
    "https://www.facebook.com",
    "https://*.facebook.com",
    "https://dam-tech.co.za",
    "https://www.dam-tech.co.za",
    `https://${supabaseHost}`,
  ].join(" "),
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://connect.facebook.net",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    `https://${supabaseHost}`,
    `wss://${supabaseHost}`,
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    // GA4 sends hits to the bare analytics.google.com host, which the wildcard
    // above does not match (audit 18 Oct 2026: hits were being blocked).
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://google.com",
    "https://www.google.co.za",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://pagead2.googlesyndication.com",
    "https://ade.googlesyndication.com",
    "https://www.facebook.com",
    "https://*.facebook.com",
    "https://connect.facebook.net",
    "https://vitals.vercel-insights.com",
  ].join(" "),
  [
    "frame-src 'self'",
    "https://accounts.google.com",
    "https://www.googletagmanager.com",
    "https://td.doubleclick.net",
    "https://www.facebook.com",
    `https://${supabaseHost}`,
  ].join(" "),
  "worker-src 'self' blob: https://www.googletagmanager.com",
].join("; ");

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dam-tech.co.za",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.dam-tech.co.za",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async redirects() {
    return redirects;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/order",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/order/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/feeds/google-merchant.tsv",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/feeds/google-merchant.tsv/",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
