export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 40, maxWidth: 640 }}>
      <h1>Vercel Analytics Digest</h1>
      <p>
        This service emails a Web Analytics digest across all Vercel projects every 6
        hours, driven by a Vercel Cron job hitting <code>/api/report</code>.
      </p>
      <p>The endpoint is protected by <code>CRON_SECRET</code> and cannot be triggered publicly.</p>
    </main>
  );
}
