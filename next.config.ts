import type { NextConfig } from "next";
import { redirects } from "./lib/redirects";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dam-tech.co.za",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
