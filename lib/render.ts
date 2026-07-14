/**
 * Renders the report into HTML: a table-based email (broad client support) and
 * a standalone dark-themed page hosted on Vercel Blob.
 */

import type { ProjectReport, Report } from "./analytics";

const numberFormat = new Intl.NumberFormat("en-US");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(value: number): string {
  return numberFormat.format(value);
}

interface Delta {
  text: string;
  /** "up" | "down" | "flat" — drives colour. */
  direction: "up" | "down" | "flat";
}

/** Percent change from previous to current, guarding the divide-by-zero case. */
function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    if (current === 0) {
      return { text: "–", direction: "flat" };
    }
    return { text: "new", direction: "up" };
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  if (rounded === 0) {
    return { text: "0%", direction: "flat" };
  }
  const arrow = rounded > 0 ? "▲" : "▼";
  return {
    text: `${arrow} ${Math.abs(rounded)}%`,
    direction: rounded > 0 ? "up" : "down",
  };
}

const DELTA_COLORS: Record<Delta["direction"], string> = {
  up: "#16a34a",
  down: "#dc2626",
  flat: "#6b7280",
};

function formatWindowLabel(report: Report): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${fmt.format(new Date(report.sinceMs))} → ${fmt.format(new Date(report.untilMs))}`;
}

function projectRowsHtml(projects: ProjectReport[]): string {
  if (projects.length === 0) {
    return `<tr><td style="padding:16px;color:#6b7280;font-size:14px;">No projects with Web Analytics enabled were found.</td></tr>`;
  }

  return projects
    .map((project) => {
      const delta = computeDelta(project.current.pageviews, project.previous.pageviews);
      const routes =
        project.topRoutes.length > 0
          ? project.topRoutes
              .map((route) => escapeHtml(route.route))
              .join(", ")
          : "—";
      const detail = project.error
        ? `<span style="color:#dc2626;">${escapeHtml(project.error)}</span>`
        : project.skipped
          ? `<span style="color:#b45309;">Skipped — run time budget reached</span>`
          : `<span style="color:#6b7280;">${routes}</span>`;

      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(
            project.name,
          )}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${formatNumber(
            project.current.pageviews,
          )}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${formatNumber(
            project.current.visitors,
          )}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;font-weight:600;color:${
            DELTA_COLORS[delta.direction]
          };">${delta.text}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding:0 8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;">${detail}</td>
        </tr>`;
    })
    .join("");
}

/** Inline-styled email body. Kept table-based for email-client compatibility. */
export function renderEmailHtml(report: Report, reportUrl: string | undefined): string {
  const totalsDelta = computeDelta(
    report.totals.pageviews,
    report.totals.previous.pageviews,
  );

  const linkBlock = reportUrl
    ? `<p style="margin:24px 0 0;font-size:14px;">
         <a href="${escapeHtml(reportUrl)}" style="color:#2563eb;font-weight:600;text-decoration:none;">View the full interactive report →</a>
       </p>`
    : "";

  const incompleteBlock =
    report.incompleteCount > 0
      ? `<p style="margin:4px 0 0;font-size:13px;color:#b45309;font-weight:600;">⚠ ${report.incompleteCount} of ${report.projects.length} projects could not be loaded — totals below are undercounted.</p>`
      : "";

  return `
  <div style="background:#f3f4f6;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:24px 24px 8px;">
        <h1 style="margin:0;font-size:20px;color:#111827;">Analytics digest · last 6 hours</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${formatWindowLabel(report)}</p>
        ${incompleteBlock}
      </div>
      <div style="padding:8px 24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 8px 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Total pageviews</td>
            <td style="padding:12px 8px 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">vs prior 6h</td>
          </tr>
          <tr>
            <td style="padding:0 8px 12px;font-size:28px;font-weight:700;color:#111827;">${formatNumber(
              report.totals.pageviews,
            )}</td>
            <td style="padding:0 8px 12px;font-size:16px;font-weight:600;text-align:right;color:${
              DELTA_COLORS[totalsDelta.direction]
            };">${totalsDelta.text}</td>
          </tr>
        </table>
      </div>
      <div style="padding:0 16px 8px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:left;">Project</th>
              <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Views</th>
              <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Visitors</th>
              <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Δ Views</th>
            </tr>
          </thead>
          <tbody>
            ${projectRowsHtml(report.projects)}
          </tbody>
        </table>
      </div>
      <div style="padding:0 24px 24px;">
        ${linkBlock}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Generated ${escapeHtml(
          report.generatedAt.toISOString(),
        )} · Vercel Web Analytics</p>
      </div>
    </div>
  </div>`;
}

/** Standalone HTML document uploaded to Blob and linked from the email. */
export function renderReportPage(report: Report): string {
  const maxPageviews = Math.max(
    1,
    ...report.projects.map((project) => project.current.pageviews),
  );

  const cards = report.projects
    .map((project) => {
      const delta = computeDelta(project.current.pageviews, project.previous.pageviews);
      const barWidth = Math.round((project.current.pageviews / maxPageviews) * 100);
      const routes =
        project.topRoutes.length > 0
          ? project.topRoutes
              .map(
                (route) =>
                  `<li><span class="route">${escapeHtml(route.route)}</span><span class="route-count">${formatNumber(
                    route.pageviews,
                  )}</span></li>`,
              )
              .join("")
          : `<li class="muted">No route data</li>`;
      const detail = project.error
        ? `<p class="error">${escapeHtml(project.error)}</p>`
        : project.skipped
          ? `<p class="skipped">Skipped — run time budget reached</p>`
          : `<ul class="routes">${routes}</ul>`;

      return `
      <article class="card">
        <header>
          <h2>${escapeHtml(project.name)}</h2>
          <span class="delta delta-${delta.direction}">${delta.text}</span>
        </header>
        <div class="metrics">
          <div><span class="metric">${formatNumber(project.current.pageviews)}</span><span class="label">pageviews</span></div>
          <div><span class="metric">${formatNumber(project.current.visitors)}</span><span class="label">visitors</span></div>
        </div>
        <div class="bar"><span style="width:${barWidth}%"></span></div>
        ${detail}
      </article>`;
    })
    .join("");

  const totalsDelta = computeDelta(
    report.totals.pageviews,
    report.totals.previous.pageviews,
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Analytics digest · ${escapeHtml(formatWindowLabel(report))}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b0f19; color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
  header.page h1 { margin: 0; font-size: 24px; }
  header.page p { margin: 4px 0 0; color: #9ca3af; font-size: 14px; }
  .summary { display: flex; gap: 24px; align-items: baseline; margin: 24px 0 32px; flex-wrap: wrap; }
  .summary .big { font-size: 40px; font-weight: 700; }
  .summary .sub { color: #9ca3af; font-size: 14px; }
  .delta-up { color: #22c55e; }
  .delta-down { color: #ef4444; }
  .delta-flat { color: #9ca3af; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .card { background: #131a2b; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; }
  .card header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .card h2 { margin: 0; font-size: 16px; overflow-wrap: anywhere; }
  .delta { font-weight: 600; font-size: 13px; white-space: nowrap; }
  .metrics { display: flex; gap: 24px; margin: 12px 0; }
  .metric { font-size: 22px; font-weight: 700; display: block; }
  .label { color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .bar { background: #1f2937; border-radius: 999px; height: 6px; overflow: hidden; margin-bottom: 12px; }
  .bar span { display: block; height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
  ul.routes { list-style: none; margin: 0; padding: 0; }
  ul.routes li { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 3px 0; border-top: 1px solid #1f2937; }
  .route { color: #cbd5e1; overflow-wrap: anywhere; }
  .route-count { color: #9ca3af; font-variant-numeric: tabular-nums; }
  .muted { color: #6b7280; }
  .error { color: #ef4444; font-size: 13px; margin: 8px 0 0; }
  .skipped { color: #f59e0b; font-size: 13px; margin: 8px 0 0; }
  .warn { color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 24px; }
  footer { margin-top: 40px; color: #6b7280; font-size: 12px; }
</style>
</head>
<body>
  <div class="wrap">
    <header class="page">
      <h1>Analytics digest</h1>
      <p>${escapeHtml(formatWindowLabel(report))} · last 6 hours</p>
    </header>
    ${
      report.incompleteCount > 0
        ? `<p class="warn">⚠ ${report.incompleteCount} of ${report.projects.length} projects could not be loaded — totals are undercounted.</p>`
        : ""
    }
    <section class="summary">
      <div>
        <div class="big">${formatNumber(report.totals.pageviews)}</div>
        <div class="sub">total pageviews · ${formatNumber(report.totals.visitors)} visitors</div>
      </div>
      <div class="delta-${totalsDelta.direction}" style="font-size:18px;font-weight:600;">${totalsDelta.text} <span class="sub">vs prior 6h</span></div>
    </section>
    <div class="grid">
      ${cards || '<p class="muted">No projects with Web Analytics enabled were found.</p>'}
    </div>
    <footer>Generated ${escapeHtml(report.generatedAt.toISOString())} · Vercel Web Analytics API</footer>
  </div>
</body>
</html>`;
}
