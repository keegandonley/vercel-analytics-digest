export const siteConfig = {
  name: "Vercel Analytics Digest",
  shortName: "Analytics Digest",
  description:
    "A self-hosted email digest that compares six-hour Vercel Web Analytics totals across all your projects.",
  repositoryUrl: "https://github.com/keegandonley/vercel-analytics-digest",
  author: {
    name: "Keegan Donley",
    url: "https://keegan.codes",
  },
} as const;

/**
 * Uses an explicit public URL when provided, then Vercel's stable production
 * domain. Preview deployment URLs are intentionally excluded from canonicals.
 */
export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const value =
    configuredUrl ||
    (productionDomain ? `https://${productionDomain}` : "http://localhost:3000");

  try {
    return new URL(value);
  } catch {
    return new URL("http://localhost:3000");
  }
}
