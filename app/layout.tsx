import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PageShell } from "@/components/PageShell";
import { SEOJsonLd } from "@/components/SEOJsonLd";
import { siteConfig } from "@/lib/site";
import {
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebSiteSchema,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
};

const globalSchemas = [
  createOrganizationSchema(),
  createLocalBusinessSchema(),
  createWebSiteSchema(),
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">
        <SEOJsonLd data={globalSchemas} />
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
