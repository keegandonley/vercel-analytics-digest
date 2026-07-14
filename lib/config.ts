/**
 * Reads and validates environment configuration at the request boundary.
 * Throwing here (rather than at module load) keeps `next build` from failing
 * when secrets are absent, and surfaces misconfiguration as a clear 500.
 */

export interface AppConfig {
  vercelToken: string;
  vercelTeamId: string | undefined;
  resendApiKey: string;
  reportFrom: string;
  reportTo: string[];
  cronSecret: string | undefined;
  /** Project names or ids to omit from the digest, lower-cased for matching. */
  excludedProjects: string[];
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Parses a comma-separated env var into a trimmed, non-empty, lower-cased list. */
function csvLower(name: string): string[] {
  return (optional(name) ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getConfig(): AppConfig {
  const reportTo = required("REPORT_TO")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (reportTo.length === 0) {
    throw new Error("REPORT_TO contained no valid email addresses");
  }

  return {
    vercelToken: required("VERCEL_TOKEN"),
    vercelTeamId: optional("VERCEL_TEAM_ID"),
    resendApiKey: required("RESEND_API_KEY"),
    reportFrom: required("REPORT_FROM"),
    reportTo,
    cronSecret: optional("CRON_SECRET"),
    excludedProjects: csvLower("EXCLUDED_PROJECTS"),
  };
}
