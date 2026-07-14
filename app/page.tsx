interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  {
    name: "VERCEL_TOKEN",
    required: true,
    description:
      "Vercel access token with read access to your projects and Web Analytics. Scope it to the team and set an expiration.",
  },
  {
    name: "VERCEL_TEAM_ID",
    required: false,
    description: "Team ID (team_…). Only needed if the projects live under a team, not your personal account.",
  },
  {
    name: "RESEND_API_KEY",
    required: true,
    description: "Resend API key used to send the digest email.",
  },
  {
    name: "REPORT_FROM",
    required: true,
    description: 'Sender address on a Resend-verified domain, e.g. "Analytics Digest <reports@yourdomain.com>".',
  },
  {
    name: "REPORT_TO",
    required: true,
    description: "Recipient address(es), comma-separated for more than one.",
  },
  {
    name: "CRON_SECRET",
    required: true,
    description:
      "Any strong random value. Vercel injects it as a Bearer token on cron requests; the endpoint rejects anything else and refuses to run if it is unset.",
  },
  {
    name: "BLOB_READ_WRITE_TOKEN",
    required: false,
    description:
      "Auto-provisioned when you connect a Vercel Blob store. Enables the hosted full-report link; without it the email still sends.",
  },
];

const codeStyle: React.CSSProperties = {
  background: "#f3f4f6",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 40, maxWidth: 720, lineHeight: 1.5 }}>
      <h1>Vercel Analytics Digest</h1>
      <p>
        Emails a Web Analytics digest across all Vercel projects every 6 hours, driven by a Vercel
        Cron job hitting <code style={codeStyle}>/api/report</code>. The endpoint is protected by{" "}
        <code style={codeStyle}>CRON_SECRET</code> and cannot be triggered publicly.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Environment variables</h2>
      <p>
        Set these in the Vercel dashboard (Project → Settings → Environment Variables), then run{" "}
        <code style={codeStyle}>vercel env pull</code> for local development. Do not hand-edit{" "}
        <code style={codeStyle}>.env</code> files.
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 12 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "8px 12px 8px 0" }}>Variable</th>
            <th style={{ padding: "8px 12px" }}>Required</th>
            <th style={{ padding: "8px 0" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {ENV_VARS.map((envVar) => (
            <tr key={envVar.name} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
              <td style={{ padding: "8px 12px 8px 0", whiteSpace: "nowrap" }}>
                <code style={codeStyle}>{envVar.name}</code>
              </td>
              <td style={{ padding: "8px 12px", color: envVar.required ? "#b45309" : "#6b7280" }}>
                {envVar.required ? "Required" : "Optional"}
              </td>
              <td style={{ padding: "8px 0", color: "#374151" }}>{envVar.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
