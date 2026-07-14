import { timingSafeEqual } from "node:crypto";
import { put } from "@vercel/blob";
import { buildReport } from "@/lib/analytics";
import { getConfig } from "@/lib/config";
import { sendDigestEmail } from "@/lib/email";
import { renderEmailHtml, renderReportPage } from "@/lib/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const numberFormat = new Intl.NumberFormat("en-US");

/** Constant-time comparison of the incoming bearer token against CRON_SECRET. */
function isAuthorized(request: Request, cronSecret: string): boolean {
  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const provided = Buffer.from(header);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/** Uploads the standalone report to Blob; returns undefined if Blob isn't set up. */
async function uploadReport(
  html: string,
  generatedAt: Date,
  blobToken: string | undefined,
): Promise<string | undefined> {
  if (!blobToken) {
    return undefined;
  }
  try {
    const key = `reports/${generatedAt.toISOString().replace(/[:.]/g, "-")}.html`;
    const blob = await put(key, html, {
      access: "public",
      contentType: "text/html; charset=utf-8",
      token: blobToken,
    });
    return blob.url;
  } catch (error) {
    // A hosted link is a nice-to-have; never fail the whole digest over it.
    console.error("Failed to upload report to Blob:", error);
    return undefined;
  }
}

export async function GET(request: Request): Promise<Response> {
  let config: ReturnType<typeof getConfig>;
  try {
    config = getConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  if (!config.cronSecret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET is not configured; refusing to run an open endpoint." },
      { status: 500 },
    );
  }
  if (!isAuthorized(request, config.cronSecret)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await buildReport({
      token: config.vercelToken,
      teamId: config.vercelTeamId,
    });

    const reportUrl = await uploadReport(
      renderReportPage(report),
      report.generatedAt,
      config.blobToken,
    );
    const emailHtml = renderEmailHtml(report, reportUrl);
    const incompleteSuffix =
      report.incompleteCount > 0 ? ` (${report.incompleteCount} incomplete)` : "";
    const subject = `Analytics · ${numberFormat.format(
      report.totals.pageviews,
    )} views in the last 6h${incompleteSuffix}`;

    await sendDigestEmail({
      apiKey: config.resendApiKey,
      from: config.reportFrom,
      to: config.reportTo,
      subject,
      html: emailHtml,
    });

    return Response.json({
      ok: true,
      projects: report.projects.length,
      incompleteProjects: report.incompleteCount,
      totalPageviews: report.totals.pageviews,
      totalVisitors: report.totals.visitors,
      reportUrl: reportUrl ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Digest run failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
