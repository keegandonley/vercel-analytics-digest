import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel Analytics Digest | Analytics by email",
  description:
    "A self-hosted email digest that compares six-hour Vercel Web Analytics totals across your projects.",
  openGraph: {
    title: "Vercel Analytics Digest",
    description: "Vercel analytics delivered by email every six hours.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
