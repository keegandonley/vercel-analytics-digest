/**
 * Builds the cross-project analytics report: for each project with Web Analytics
 * enabled, it fetches the current 6-hour window, the preceding 6-hour window
 * (for deltas), and the top routes in the current window.
 */

import { listAnalyticsProjects, queryAggregate, type VercelAuth } from "./vercel-api";

export const WINDOW_MS = 6 * 60 * 60 * 1000;
const TOP_ROUTES_LIMIT = 5;
/** Cap concurrent Vercel API calls so a large project count can't trip rate limits. */
const CONCURRENCY = 5;

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
  /** Set when this project's data could not be fetched; it is still listed. */
  error?: string;
}

export interface Report {
  generatedAt: Date;
  sinceMs: number;
  untilMs: number;
  projects: ProjectReport[];
  totals: WindowStats & { previous: WindowStats };
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

async function fetchProjectReport(
  auth: VercelAuth,
  project: { id: string; name: string },
  currentSince: number,
  currentUntil: number,
  previousSince: number,
  previousUntil: number,
): Promise<ProjectReport> {
  try {
    // Grouping by `environment` yields one production row per window, giving an
    // accurate deduplicated visitor count (unlike summing route- or hour-rows).
    const [currentRows, previousRows, routeRows] = await Promise.all([
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

    const topRoutes: RouteStat[] = routeRows
      .map((row) => ({
        route: typeof row.route === "string" ? row.route : "(unknown)",
        pageviews: toNumber(row.pageviews),
      }))
      .filter((entry) => entry.pageviews > 0)
      .sort((a, b) => b.pageviews - a.pageviews);

    return {
      id: project.id,
      name: project.name,
      current: sumWindow(currentRows),
      previous: sumWindow(previousRows),
      topRoutes,
    };
  } catch (error) {
    return {
      id: project.id,
      name: project.name,
      current: { pageviews: 0, visitors: 0 },
      previous: { pageviews: 0, visitors: 0 },
      topRoutes: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
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

export async function buildReport(auth: VercelAuth): Promise<Report> {
  const untilMs = Date.now();
  const sinceMs = untilMs - WINDOW_MS;
  const previousUntil = sinceMs;
  const previousSince = sinceMs - WINDOW_MS;

  const projects = await listAnalyticsProjects(auth);

  const projectReports = await mapWithConcurrency(projects, CONCURRENCY, (project) =>
    fetchProjectReport(auth, project, sinceMs, untilMs, previousSince, previousUntil),
  );

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

  return {
    generatedAt: new Date(untilMs),
    sinceMs,
    untilMs,
    projects: projectReports,
    totals,
  };
}
