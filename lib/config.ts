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

export function getConfig(): AppConfig {
  return {
    vercelToken: required("VERCEL_TOKEN"),
    vercelTeamId: optional("VERCEL_TEAM_ID"),
    resendApiKey: required("RESEND_API_KEY"),
    reportFrom: required("REPORT_FROM"),
    reportTo: required("REPORT_TO")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
    cronSecret: optional("CRON_SECRET"),
  };
}
