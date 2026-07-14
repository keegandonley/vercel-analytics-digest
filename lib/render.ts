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

const MONO_FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const SANS_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Single accent hue used for links, bars, and small flourishes in the email. */
const ACCENT = "#2a78d6";
/** Unfilled remainder of the traffic bar — a lighter step of the accent's own ramp. */
const ACCENT_TRACK = "#dce9f9";

/** Brighter delta variants that stay legible on the dark hero band. */
const HERO_DELTA_COLORS: Record<Delta["direction"], string> = {
  up: "#4ade80",
  down: "#f87171",
  flat: "#94a3b8",
};

/**
 * Email-safe horizontal meter: two table cells whose widths carry the value.
 * Reads even when border-radius is stripped; a 2px white border separates
 * fill from track.
 */
function trafficBarHtml(pageviews: number, maxPageviews: number): string {
  const raw = Math.round((pageviews / maxPageviews) * 100);
  // Keep non-zero traffic visible as at least a sliver.
  const percent = pageviews > 0 ? Math.min(100, Math.max(raw, 3)) : 0;

  const cellStyle = "height:6px;line-height:6px;font-size:1px;border-radius:3px;";
  const fillCell = `<td width="${percent}%" height="6" bgcolor="${ACCENT}" style="background-color:${ACCENT};${cellStyle}border-right:2px solid #ffffff;">&nbsp;</td>`;
  const trackCell = `<td height="6" bgcolor="${ACCENT_TRACK}" style="background-color:${ACCENT_TRACK};${cellStyle}">&nbsp;</td>`;

  let cells: string;
  if (percent <= 0) {
    cells = trackCell;
  } else if (percent >= 100) {
    cells = `<td height="6" bgcolor="${ACCENT}" style="background-color:${ACCENT};${cellStyle}">&nbsp;</td>`;
  } else {
    cells = `${fillCell}${trackCell}`;
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr>${cells}</tr></table>`;
}

/** One labelled card per project: name, delta, metrics, traffic bar, Top pages. */
function projectCardHtml(project: ProjectReport, maxPageviews: number): string {
  const failed = Boolean(project.error) || Boolean(project.skipped);
  const delta = computeDelta(project.current.pageviews, project.previous.pageviews);
  // A failed fetch has no meaningful numbers, so its delta is shown as neutral.
  const deltaText = failed ? "–" : delta.text;
  const deltaColor = failed ? DELTA_COLORS.flat : DELTA_COLORS[delta.direction];

  let statusRow = "";
  let metricsRow = "";
  let barRow = "";
  let bodyRow = "";

  if (project.error) {
    statusRow = `
          <tr>
            <td colspan="2" style="padding:6px 0 0;font-family:${SANS_FONT};font-size:13px;line-height:1.5;color:#dc2626;"><strong style="font-weight:600;">⚠ Failed to load</strong> — ${escapeHtml(
              project.error,
            )}</td>
          </tr>`;
  } else if (project.skipped) {
    statusRow = `
          <tr>
            <td colspan="2" style="padding:6px 0 0;font-family:${SANS_FONT};font-size:13px;line-height:1.5;color:#b45309;"><strong style="font-weight:600;">◷ Skipped</strong> — run time budget reached</td>
          </tr>`;
  } else {
    const metrics =
      project.current.pageviews === 0 && project.current.visitors === 0
        ? `<span style="color:#9ca3af;">No traffic in this window</span>`
        : `<strong style="font-weight:600;color:#111827;">${formatNumber(
            project.current.pageviews,
          )}</strong> pageviews&nbsp;&nbsp;<span style="color:#d1d5db;">·</span>&nbsp;&nbsp;<strong style="font-weight:600;color:#111827;">${formatNumber(
            project.current.visitors,
          )}</strong> visitors`;
    metricsRow = `
          <tr>
            <td colspan="2" style="padding:4px 0 0;font-family:${SANS_FONT};font-size:13px;color:#6b7280;">${metrics}</td>
          </tr>`;
    barRow = `
          <tr>
            <td colspan="2" style="padding:12px 0 0;">${trafficBarHtml(
              project.current.pageviews,
              maxPageviews,
            )}</td>
          </tr>`;

    if (project.topRoutes.length > 0) {
      const routeRows = project.topRoutes
        .map(
          (route) => `
            <tr>
              <td style="padding:5px 0;border-top:1px solid #f3f4f6;font-family:${MONO_FONT};font-size:12px;color:#4b5563;word-break:break-all;">${escapeHtml(
                route.route,
              )}</td>
              <td align="right" style="padding:5px 0 5px 16px;border-top:1px solid #f3f4f6;font-family:${SANS_FONT};font-size:12px;color:#9ca3af;white-space:nowrap;">${formatNumber(
                route.pageviews,
              )}</td>
            </tr>`,
        )
        .join("");
      bodyRow = `
          <tr>
            <td colspan="2" style="padding:14px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td colspan="2" style="padding:0 0 5px;font-family:${SANS_FONT};font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;">Top pages <span style="font-weight:400;letter-spacing:0.06em;">· by pageviews</span></td>
                </tr>
                ${routeRows}
              </table>
            </td>
          </tr>`;
    }
  }

  return `
    <tr>
      <td style="padding:18px 28px 20px;border-top:1px solid #f0f1f3;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="font-family:${SANS_FONT};font-size:15px;font-weight:600;letter-spacing:-0.1px;color:#111827;word-break:break-word;">${escapeHtml(
              project.name,
            )}</td>
            <td align="right" valign="top" style="padding-left:12px;font-family:${SANS_FONT};font-size:13px;font-weight:700;white-space:nowrap;color:${deltaColor};">${deltaText}</td>
          </tr>
          ${statusRow}
          ${metricsRow}
          ${barRow}
          ${bodyRow}
        </table>
      </td>
    </tr>`;
}

function projectCardsHtml(projects: ProjectReport[]): string {
  if (projects.length === 0) {
    return `
    <tr>
      <td style="padding:20px 28px 24px;border-top:1px solid #f0f1f3;font-family:${SANS_FONT};font-size:14px;color:#6b7280;">No projects with Web Analytics enabled were found.</td>
    </tr>`;
  }
  const maxPageviews = Math.max(
    1,
    ...projects.map((project) => project.current.pageviews),
  );
  return projects.map((project) => projectCardHtml(project, maxPageviews)).join("");
}

/** Inline-styled email body. Kept table-based for email-client compatibility. */
export function renderEmailHtml(report: Report, reportUrl: string | undefined): string {
  const totalsDelta = computeDelta(
    report.totals.pageviews,
    report.totals.previous.pageviews,
  );
  const visitorsDelta = computeDelta(
    report.totals.visitors,
    report.totals.previous.visitors,
  );

  // Inbox preview line; hidden inside the email body itself.
  const preheader = `${formatNumber(report.totals.pageviews)} pageviews (${
    totalsDelta.text
  }) across ${report.projects.length} project${
    report.projects.length === 1 ? "" : "s"
  } in the last 6 hours.`;

  const incompleteBlock =
    report.incompleteCount > 0
      ? `
        <tr>
          <td bgcolor="#fef3c7" style="background-color:#fef3c7;padding:12px 28px;font-family:${SANS_FONT};font-size:13px;line-height:1.5;color:#92400e;"><strong style="font-weight:600;">⚠ Partial data</strong> — ${report.incompleteCount} of ${report.projects.length} projects could not be loaded, so totals are undercounted.</td>
        </tr>`
      : "";

  const linkBlock = reportUrl
    ? `
        <tr>
          <td align="center" style="padding:26px 28px 6px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
              <tr>
                <td bgcolor="#111827" style="background-color:#111827;border-radius:8px;">
                  <a href="${escapeHtml(
                    reportUrl,
                  )}" style="display:inline-block;padding:12px 26px;font-family:${SANS_FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">View the full report&nbsp;&nbsp;→</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : "";

  return `
  <div style="margin:0;padding:0;background-color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(
      preheader,
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;max-width:620px;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse:collapse;background-color:#ffffff;">

                  <tr>
                    <td style="padding:28px 28px 22px;">
                      <div style="font-family:${SANS_FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#6b7280;"><span style="color:#111827;">▲</span>&nbsp;&nbsp;Vercel Analytics</div>
                      <div style="padding-top:8px;font-family:${SANS_FONT};font-size:23px;font-weight:700;letter-spacing:-0.4px;color:#111827;">Six-hour traffic digest</div>
                      <div style="padding-top:6px;font-family:${MONO_FONT};font-size:12px;color:#9ca3af;">${escapeHtml(
                        formatWindowLabel(report),
                      )}</div>
                    </td>
                  </tr>

                  <tr>
                    <td bgcolor="#111827" style="background-color:#111827;padding:26px 28px 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="padding-bottom:12px;font-family:${SANS_FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;">Total pageviews</td>
                          <td align="right" style="padding-bottom:12px;font-family:${SANS_FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;">vs prior 6h</td>
                        </tr>
                        <tr>
                          <td style="font-family:${SANS_FONT};font-size:44px;font-weight:700;letter-spacing:-1.5px;line-height:1;color:#ffffff;">${formatNumber(
                            report.totals.pageviews,
                          )}</td>
                          <td align="right" valign="bottom" style="padding-left:16px;font-family:${SANS_FONT};font-size:18px;font-weight:700;white-space:nowrap;color:${
                            HERO_DELTA_COLORS[totalsDelta.direction]
                          };">${totalsDelta.text}</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding-top:14px;font-family:${SANS_FONT};font-size:13px;line-height:1.5;color:#9ca3af;"><strong style="font-weight:600;color:#e5e7eb;">${formatNumber(
                            report.totals.visitors,
                          )}</strong> unique visitors <span style="font-weight:600;color:${
                            HERO_DELTA_COLORS[visitorsDelta.direction]
                          };">${visitorsDelta.text}</span>&nbsp;&nbsp;<span style="color:#374151;">·</span>&nbsp;&nbsp;${
                            report.projects.length
                          } project${report.projects.length === 1 ? "" : "s"}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${incompleteBlock}

                  <tr>
                    <td style="padding:24px 28px 12px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="font-family:${SANS_FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;">Projects</td>
                          <td align="right" style="font-family:${SANS_FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;">Δ vs prior 6h</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${projectCardsHtml(report.projects)}

                  ${linkBlock}

                  <tr>
                    <td style="padding:${reportUrl ? "22" : "26"}px 28px 26px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td align="center" style="padding-top:20px;border-top:1px solid #f0f1f3;font-family:${SANS_FONT};font-size:12px;line-height:1.6;color:#9ca3af;">Generated ${escapeHtml(
                            report.generatedAt.toISOString(),
                          )}<br/>Vercel Web Analytics · every 6 hours</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
      const barWidth = Math.max(0, Math.round((project.current.pageviews / maxPageviews) * 100));
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
