/**
 * Builds the cross-project analytics report: for each project with Web Analytics
 * enabled, it fetches the current 6-hour window, the preceding 6-hour window
 * (for deltas), and the top routes in the current window.
 */

import {
  listAnalyticsProjects,
  queryAggregate,
  VercelApiError,
  type VercelAuth,
} from "./vercel-api";

/**
 * A project can advertise `webAnalytics` in the projects list yet still reject
 * analytics queries with this code (analytics was never actually enabled). Such
 * projects are dropped from the digest rather than reported as failures.
 */
const WEB_ANALYTICS_NOT_ENABLED = "web_analytics_not_enabled";

function isAnalyticsNotEnabled(reason: unknown): boolean {
  return (
    reason instanceof VercelApiError &&
    (reason.code === WEB_ANALYTICS_NOT_ENABLED ||
      reason.message.includes(WEB_ANALYTICS_NOT_ENABLED))
  );
}

export const WINDOW_MS = 6 * 60 * 60 * 1000;
const TOP_ROUTES_LIMIT = 5;
/** Cap concurrent Vercel API calls so a large project count can't trip rate limits. */
const CONCURRENCY = 5;
/**
 * Stop dispatching new project fetches after this much wall time so the function
 * still has room (under its 60s maxDuration) to render, upload, and email a
 * partial digest rather than being hard-killed with nothing sent.
 */
const DATA_BUDGET_MS = 35_000;

export interface WindowStats {
  pageviews: number;
  visitors: number;
}

export interface RouteStat {
  route: string;
  pageviews: number;
}

export interface ProjectReport {
  id: string;
  name: string;
  current: WindowStats;
  previous: WindowStats;
  topRoutes: RouteStat[];
  /** Set when the headline (current-window) query failed; the project is still listed. */
  error?: string;
  /** True when the run's time budget was exhausted before this project was fetched. */
  skipped?: boolean;
}

export interface Report {
  generatedAt: Date;
  sinceMs: number;
  untilMs: number;
  projects: ProjectReport[];
  totals: WindowStats & { previous: WindowStats };
  /** Count of projects whose current-window data is missing (errored or skipped). */
  incompleteCount: number;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Sums pageviews/visitors across aggregate rows (used for single-window totals). */
function sumWindow(rows: Array<Record<string, unknown>>): WindowStats {
  return rows.reduce<WindowStats>(
    (acc, row) => ({
      pageviews: acc.pageviews + toNumber(row.pageviews),
      visitors: acc.visitors + toNumber(row.visitors),
    }),
    { pageviews: 0, visitors: 0 },
  );
}

/**
 * Turns aggregate rows into ranked top pages. `dimensionKey` is where the grouped
 * value lives on each row (`route` for framework patterns, `requestPath` for raw
 * URLs). The API rolls the remainder past `limit` into an "Others" bucket, which
 * is dropped (real values start with "/", so this never removes a genuine page).
 */
function parseTopRoutes(
  rows: Array<Record<string, unknown>>,
  dimensionKey: "route" | "requestPath",
): RouteStat[] {
  return rows
    .map((row) => ({
      route: typeof row[dimensionKey] === "string" ? (row[dimensionKey] as string) : "(unknown)",
      pageviews: toNumber(row.pageviews),
    }))
    .filter((entry) => entry.pageviews > 0 && entry.route.toLowerCase() !== "others")
    .sort((a, b) => b.pageviews - a.pageviews);
}

async function fetchProjectReport(
  auth: VercelAuth,
  project: { id: string; name: string },
  currentSince: number,
  currentUntil: number,
  previousSince: number,
  previousUntil: number,
): Promise<ProjectReport | null> {
  // Settle each query independently: the top-routes call is a nice-to-have, so its
  // failure must not zero out the headline pageviews/visitors, which flow into the
  // report totals. Grouping by `environment` yields one production row per window,
  // giving an accurate deduplicated visitor count (unlike summing route/hour rows).
  const [currentResult, previousResult, routesResult] = await Promise.allSettled([
    queryAggregate(auth, {
      projectId: project.id,
      by: "environment",
      sinceMs: currentSince,
      untilMs: currentUntil,
    }),
    queryAggregate(auth, {
      projectId: project.id,
      by: "environment",
      sinceMs: previousSince,
      untilMs: previousUntil,
    }),
    queryAggregate(auth, {
      projectId: project.id,
      by: "route",
      sinceMs: currentSince,
      untilMs: currentUntil,
      limit: TOP_ROUTES_LIMIT,
    }),
  ]);

  // A project whose analytics isn't really enabled has no place in the digest.
  if (currentResult.status === "rejected" && isAnalyticsNotEnabled(currentResult.reason)) {
    return null;
  }

  const current =
    currentResult.status === "fulfilled"
      ? sumWindow(currentResult.value)
      : { pageviews: 0, visitors: 0 };
  const previous =
    previousResult.status === "fulfilled"
      ? sumWindow(previousResult.value)
      : { pageviews: 0, visitors: 0 };

  let topRoutes: RouteStat[] =
    routesResult.status === "fulfilled" ? parseTopRoutes(routesResult.value, "route") : [];

  // Static/non-framework projects report traffic under `requestPath` but leave the
  // `route` dimension empty, so `by=route` comes back with nothing. Fall back to raw
  // request paths for those — but only when there's real traffic to break down, to
  // avoid a wasted query on idle projects.
  if (topRoutes.length === 0 && current.pageviews > 0) {
    try {
      const pathRows = await queryAggregate(auth, {
        projectId: project.id,
        by: "requestPath",
        sinceMs: currentSince,
        untilMs: currentUntil,
        limit: TOP_ROUTES_LIMIT,
      });
      topRoutes = parseTopRoutes(pathRows, "requestPath");
    } catch {
      // A missing routes breakdown is non-fatal; keep the empty list.
    }
  }

  return {
    id: project.id,
    name: project.name,
    current,
    previous,
    topRoutes,
    // Only a failed headline (current-window) query marks the project incomplete;
    // a missing previous window merely degrades the delta, and missing routes just
    // empties the routes list.
    error: currentResult.status === "rejected" ? errorMessage(currentResult.reason) : undefined,
  };
}

/** Runs `worker` over `items` with a bounded number of concurrent tasks. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index] as T);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return results;
}

export async function buildReport(
  auth: VercelAuth,
  excludedProjects: readonly string[] = [],
): Promise<Report> {
  const untilMs = Date.now();
  const sinceMs = untilMs - WINDOW_MS;
  const previousUntil = sinceMs;
  const previousSince = sinceMs - WINDOW_MS;

  const allProjects = await listAnalyticsProjects(auth);

  // Exclude opted-out projects (matched by name or id, case-insensitively) before
  // any analytics calls so internal tools stay out of the digest and cost nothing.
  const excluded = new Set(excludedProjects.map((entry) => entry.toLowerCase()));
  const projects = allProjects.filter(
    (project) =>
      !excluded.has(project.name.toLowerCase()) && !excluded.has(project.id.toLowerCase()),
  );

  // Once the budget is spent, stop hitting the API and mark the rest as skipped so
  // a slow API day yields a partial (clearly-labelled) digest instead of a timeout.
  const deadline = Date.now() + DATA_BUDGET_MS;
  const settled = await mapWithConcurrency(projects, CONCURRENCY, (project) => {
    if (Date.now() >= deadline) {
      return Promise.resolve<ProjectReport | null>({
        id: project.id,
        name: project.name,
        current: { pageviews: 0, visitors: 0 },
        previous: { pageviews: 0, visitors: 0 },
        topRoutes: [],
        skipped: true,
      });
    }
    return fetchProjectReport(auth, project, sinceMs, untilMs, previousSince, previousUntil);
  });

  // Drop projects that only look analytics-enabled (null) so they neither appear
  // in the digest nor inflate the incomplete count.
  const projectReports = settled.filter((report): report is ProjectReport => report !== null);

  // Most active first, so the email leads with what matters.
  projectReports.sort((a, b) => b.current.pageviews - a.current.pageviews);

  const totals = projectReports.reduce(
    (acc, project) => {
      acc.pageviews += project.current.pageviews;
      acc.visitors += project.current.visitors;
      acc.previous.pageviews += project.previous.pageviews;
      acc.previous.visitors += project.previous.visitors;
      return acc;
    },
    { pageviews: 0, visitors: 0, previous: { pageviews: 0, visitors: 0 } },
  );

  const incompleteCount = projectReports.filter(
    (project) => project.error !== undefined || project.skipped === true,
  ).length;

  return {
    generatedAt: new Date(untilMs),
    sinceMs,
    untilMs,
    projects: projectReports,
    totals,
    incompleteCount,
  };
}
