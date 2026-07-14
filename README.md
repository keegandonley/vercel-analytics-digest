# Vercel Analytics Digest

Emails a Web Analytics digest across **all** your Vercel projects every 6 hours.
A Vercel Cron job hits `/api/report`, which:

1. Lists every project with Web Analytics enabled (`GET /v10/projects`).
2. For each, queries the current 6-hour window, the previous 6-hour window (for
   deltas), and the top routes (Web Analytics aggregate API).
3. Uploads a standalone HTML report to Vercel Blob.
4. Emails an inline digest (via Resend) with a link to the hosted report.

## Setup

The default `0 */6 * * *` schedule needs a Vercel Pro plan. On Hobby, change the
cron to run about once per day. The project uses Node 24 and pnpm.

1. Fork the repository and deploy it to Vercel with the Next.js preset.
2. Create a Vercel access token at <https://vercel.com/account/tokens>. Scope it
   to the team that owns the projects, set an expiration, and save it as
   `VERCEL_TOKEN`. The REST API requires this access token; OIDC cannot
   authenticate these requests.
3. Enable Web Analytics from the Analytics tab of each project you want in the
   digest.
4. Add `VERCEL_TEAM_ID` (`team_...`) when the projects belong to a team. Omit it
   for personal-account projects.
5. Configure Resend. Create `RESEND_API_KEY`, verify a sending domain or
   subdomain, use that domain in `REPORT_FROM`, and set `REPORT_TO`.
6. To add a hosted full-report link, connect a public Vercel Blob store from
   Project / Storage. Public access is fixed at creation and lets recipients
   open the emailed link without signing in. Connecting the store adds
   `BLOB_STORE_ID`; Vercel supplies `VERCEL_OIDC_TOKEN` to deployed functions.
   Enable OIDC federation in Project / Settings / Security. This step is
   optional. The email still sends when Blob is absent.
7. Generate `CRON_SECRET` with `openssl rand -base64 32`. The route fails closed
   when the secret is absent and requires it as a Bearer token.
8. Set the variables in Project / Settings / Environment Variables and target
   Production. See `.env.example`. `EXCLUDED_PROJECTS` accepts a comma-separated
   list of project names or ids. If the site uses a custom domain, set
   `NEXT_PUBLIC_SITE_URL` to its full origin so canonical and social metadata use
   that domain; otherwise Vercel's production domain is detected automatically.
9. Redeploy to Production. Vercel reads environment variables and storage
   settings at deployment time.

The cron schedule lives in `vercel.json` (`0 */6 * * *`).

## Manual trigger

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-deployment>/api/report
```

Expect an `ok: true` response. A null `reportUrl` means the deployment cannot see
the Blob store or OIDC configuration; `incompleteProjects > 0` means at least one
analytics request failed. Confirm that the report URL opens and the email arrives.

For local development, run `vercel link` and then `vercel env pull`; do not
hand-edit env files. The pulled OIDC token is development-scoped. Use the
deployed endpoint to test Blob uploads.

## Notes

- Window totals (pageviews + visitors) are grouped by `environment`, which
  deduplicates production visitors within each window.
- Deltas compare the current 6h window against the previous 6h window, so the
  app does not need local storage.
- Per-project fetches run with bounded concurrency (5) to stay clear of rate limits;
  a failure on one project is reported inline without sinking the whole digest.
