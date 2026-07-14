import type { ReactNode } from "react";

export const metadata = {
  title: "Vercel Analytics Digest",
  description: "6-hourly email digest of Vercel Web Analytics across all projects",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
