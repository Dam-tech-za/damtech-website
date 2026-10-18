import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics, AnalyticsNoScript } from "@/components/Analytics";
import { ConditionalSiteShell } from "@/components/ConditionalSiteShell";
import { PageShellBottom, PageShellTop } from "@/components/PageShell";
import { SiteTracking } from "@/components/SiteTracking";
import { TrackingGate } from "@/components/TrackingGate";
import { SEOJsonLd } from "@/components/SEOJsonLd";
import {
  createLocalBusinessSchema,
  createOrganizationSchema,
  createRootMetadata,
  createWebSiteSchema,
} from "@/lib/seo";
import "./globals.css";
import "./brand.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // Variable font: one ~48 KB latin file instead of five preloaded static weights.
});

/** Display face: variable width + weight so headlines can run expanded and heavy. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
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
    <html lang="en-ZA" className={`${inter.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">
        <AnalyticsNoScript />
        <SEOJsonLd data={globalSchemas} />
        <ConditionalSiteShell
          beforeMain={
            <>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <PageShellTop />
            </>
          }
          afterMain={
            <>
              <PageShellBottom />
              <TrackingGate>
                <Analytics />
                <SiteTracking />
              </TrackingGate>
            </>
          }
        >
          {children}
        </ConditionalSiteShell>
        <SpeedInsights />
      </body>
    </html>
  );
}
