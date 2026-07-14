/**
 * Thin client over the Vercel REST API for the two things this service needs:
 * listing projects and querying the Web Analytics aggregate endpoint.
 */

const API_BASE = "https://api.vercel.com";
const REQUEST_TIMEOUT_MS = 15_000;

export interface VercelAuth {
  token: string;
  teamId: string | undefined;
}

/** Error carrying the Vercel API HTTP status and error code (when present). */
export class VercelApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

interface VercelProject {
  id: string;
  name: string;
  /** Present only when Web Analytics is enabled for the project. */
  webAnalytics?: { id: string };
}

/** A single row from a Web Analytics aggregate query. */
interface AggregateRow {
  pageviews?: number;
  visitors?: number;
  /** The grouped dimension value (e.g. the route) is echoed back under `by`. */
  [key: string]: unknown;
}

interface AggregateResponse {
  data?: AggregateRow[];
}

interface ProjectsListResponse {
  projects?: VercelProject[];
  pagination?: { next?: string | number | null };
}

async function vercelFetch(
  path: string,
  auth: VercelAuth,
  searchParams: Record<string, string>,
): Promise<unknown> {
  const url = new URL(path, API_BASE);
  if (auth.teamId) {
    url.searchParams.set("teamId", auth.teamId);
  }
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let code: string | undefined;
    try {
      code = (JSON.parse(body) as { error?: { code?: string } }).error?.code;
    } catch {
      // Non-JSON error body; leave code undefined.
    }
    throw new VercelApiError(
      response.status,
      code,
      `Vercel API ${response.status} for ${url.pathname}: ${body.slice(0, 500)}`,
    );
  }

  return response.json();
}

/**
 * Lists every project that has Web Analytics enabled, following pagination.
 * Projects without analytics are skipped since querying them would only ever
 * return zeros.
 */
export async function listAnalyticsProjects(
  auth: VercelAuth,
): Promise<Array<{ id: string; name: string }>> {
  const projects: Array<{ id: string; name: string }> = [];
  let from: string | undefined;

  // Bound the loop defensively so a malformed pagination cursor can't spin forever.
  for (let pageIndex = 0; pageIndex < 50; pageIndex += 1) {
    const params: Record<string, string> = { limit: "100" };
    if (from) {
      params.from = from;
    }

    const json = await vercelFetch("/v10/projects", auth, params);

    // The endpoint returns either a bare array or a { projects, pagination } object.
    const isArrayShape = Array.isArray(json);
    const pageProjects = isArrayShape
      ? (json as VercelProject[])
      : ((json as ProjectsListResponse).projects ?? []);

    for (const project of pageProjects) {
      if (project.webAnalytics) {
        projects.push({ id: project.id, name: project.name });
      }
    }

    // The bare-array shape carries no cursor, so it is inherently a single page.
    const next = isArrayShape ? undefined : (json as ProjectsListResponse).pagination?.next;
    // Treat empty string the same as a missing cursor so we don't re-fetch page 1.
    if (next === undefined || next === null || next === "") {
      break;
    }
    from = String(next);
  }

  return projects;
}

/**
 * Runs a Web Analytics aggregate query and returns the raw rows.
 * `since`/`until` are epoch milliseconds, giving true sub-day window precision.
 */
export async function queryAggregate(
  auth: VercelAuth,
  options: {
    projectId: string;
    by: string;
    sinceMs: number;
    untilMs: number;
    limit?: number;
  },
): Promise<AggregateRow[]> {
  const params: Record<string, string> = {
    projectId: options.projectId,
    by: options.by,
    since: String(options.sinceMs),
    until: String(options.untilMs),
  };
  if (options.limit !== undefined) {
    params.limit = String(options.limit);
  }

  const json = (await vercelFetch(
    "/v1/query/web-analytics/visits/aggregate",
    auth,
    params,
  )) as AggregateResponse;

  return json.data ?? [];
}
