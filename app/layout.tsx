import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics, AnalyticsNoScript } from "@/components/Analytics";
import { PageShell } from "@/components/PageShell";
import { SEOJsonLd } from "@/components/SEOJsonLd";
import {
  createLocalBusinessSchema,
  createOrganizationSchema,
  createRootMetadata,
  createWebSiteSchema,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = createRootMetadata();

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
        <AnalyticsNoScript />
        <SEOJsonLd data={globalSchemas} />
        <PageShell>{children}</PageShell>
        <Analytics />
      </body>
    </html>
  );
}
