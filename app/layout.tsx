import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Vercel Analytics Digest | Analytics by email",
    template: "%s | Vercel Analytics Digest",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  category: "technology",
  keywords: [
    "Vercel Analytics",
    "Web Analytics",
    "analytics email digest",
    "Vercel Cron",
    "Resend",
    "self-hosted analytics",
    "open source",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vercel Analytics Digest",
    description:
      "Pageviews, visitors, and top routes from every project—delivered by email every six hours.",
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vercel Analytics Digest — Vercel analytics delivered by email",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vercel Analytics Digest",
    description:
      "Pageviews, visitors, and top routes from every project—delivered by email every six hours.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
