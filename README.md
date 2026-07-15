# Vercel Analytics Digest

[![GPL-3.0 License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

Emails a Web Analytics digest across **all** your Vercel projects on a configurable
hourly interval (every 6 hours by default).
A Vercel Cron job hits `/api/report`, which:

1. Lists every project with Web Analytics enabled (`GET /v10/projects`).
2. For each, queries the configured current window, the previous equal window
   (for deltas), and the top routes (Web Analytics aggregate API).
3. Uploads a standalone HTML report to Vercel Blob.
4. Emails an inline digest (via Resend) with a link to the hosted report.

## Requirements

- Node.js 24 and pnpm for local development
- A Vercel account and access token
- Vercel Web Analytics enabled on at least one project
- A Resend account with a verified sending domain
- Vercel Pro for the default hourly cron dispatcher, or the documented daily
  schedule for Hobby

## Setup

The hourly dispatcher in `vercel.json` needs a Vercel Pro plan. On Hobby, set
`REPORT_INTERVAL_HOURS=24` and change its schedule to `0 0 * * *`. The project
uses Node 24 and pnpm.

1. Fork the repository and deploy it to Vercel with the Next.js preset.
2. Create a Vercel access token at <https://vercel.com/account/tokens>. Scope it
   to the team that owns the projects, set an expiration, and save it as
   `VERCEL_TOKEN`. The REST API requires this access token; OIDC cannot
   authenticate these requests.
3. Enable Web Analytics from the Analytics tab of each project you want in the
   digest. This app tracks its own landing page too: enable Web Analytics on the
   project you deploy this to and its traffic shows up in that project's
   Analytics tab. Leave it off and the tracker no-ops.
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
   list of project names or ids. `REPORT_INTERVAL_HOURS` accepts a whole number
   from 1 through 24 and defaults to 6. If the site uses a custom domain, set
   `NEXT_PUBLIC_SITE_URL` to its full origin so canonical and social metadata use
   that domain; otherwise Vercel's production domain is detected automatically.
9. Redeploy to Production. Vercel reads environment variables and storage
   settings at deployment time.

Vercel does not expand environment variables in cron expressions, so the cron in
`vercel.json` runs hourly and the route uses `REPORT_INTERVAL_HOURS` to decide
which invocations produce a digest. Authenticated manual triggers always run.

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

To work on the homepage without connecting a Vercel project:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Notes

- Window totals (pageviews + visitors) are grouped by `environment`, which
  deduplicates production visitors within each window.
- Deltas compare the configured current window against the previous equal window, so the
  app does not need local storage.
- Per-project fetches run with bounded concurrency (5) to stay clear of rate limits;
  a failure on one project is reported inline without sinking the whole digest.

## Contributing and security

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the local
workflow. Please report vulnerabilities privately according to
[SECURITY.md](SECURITY.md).

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
