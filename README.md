# Vercel Analytics Digest

Emails a Web Analytics digest across **all** your Vercel projects every 6 hours.
A Vercel Cron job hits `/api/report`, which:

1. Lists every project with Web Analytics enabled (`GET /v10/projects`).
2. For each, queries the current 6-hour window, the previous 6-hour window (for
   deltas), and the top routes (Web Analytics aggregate API).
3. Uploads a standalone HTML report to Vercel Blob.
4. Emails an inline digest (via Resend) with a link to the hosted report.

## Setup

1. **Deploy to Vercel** and link the project (`vercel link`).
2. **Add Blob storage**: Vercel dashboard → Storage → create a Blob store and
   connect it (this provisions `BLOB_READ_WRITE_TOKEN`). Optional — without it the
   email still sends, just without the "full report" link.
3. **Set environment variables** in the Vercel dashboard (see `.env.example`):
   - `VERCEL_TOKEN` — access token with read access to your projects + analytics.
   - `VERCEL_TEAM_ID` — only if the projects live under a team.
   - `RESEND_API_KEY`, `REPORT_FROM` (verified domain), `REPORT_TO`.
   - `CRON_SECRET` — any strong random value; Vercel injects it as a Bearer token
     on cron requests, and the route rejects anything else.
4. **Pull env locally** when developing: `vercel env pull` (do not hand-edit `.env`).

The cron schedule lives in `vercel.json` (`0 */6 * * *`).

## Manual trigger

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-deployment>/api/report
```

## Notes

- Window totals (pageviews + visitors) are grouped by `environment`, giving an
  accurate deduplicated visitor count per window (production traffic only).
- Deltas compare the current 6h window against the immediately preceding one, so
  no local storage is needed.
- Per-project fetches run with bounded concurrency (5) to stay clear of rate limits;
  a failure on one project is reported inline without sinking the whole digest.
