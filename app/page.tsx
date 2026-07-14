import { getSiteUrl, siteConfig } from "@/lib/site";

interface EnvVar {
  name: string;
  requirement: "Required" | "If using a team" | "If using Blob" | "Optional";
  description: string;
}

const REPOSITORY_URL = siteConfig.repositoryUrl;
const FORK_URL = `${REPOSITORY_URL}/fork`;

const ENV_VARS: EnvVar[] = [
  {
    name: "VERCEL_TOKEN",
    requirement: "Required",
    description:
      "A Vercel access token scoped to the team that owns the projects. Read access is sufficient.",
  },
  {
    name: "VERCEL_TEAM_ID",
    requirement: "If using a team",
    description:
      "The team_... id from Team Settings. Omit this for personal-account projects.",
  },
  {
    name: "RESEND_API_KEY",
    requirement: "Required",
    description: "An API key from Resend for email delivery.",
  },
  {
    name: "REPORT_FROM",
    requirement: "Required",
    description:
      "A sender on your verified domain, such as Analytics <reports@yourdomain.com>.",
  },
  {
    name: "REPORT_TO",
    requirement: "Required",
    description: "One recipient, or multiple comma-separated email addresses.",
  },
  {
    name: "CRON_SECRET",
    requirement: "Required",
    description:
      "The Bearer token that protects scheduled and manual runs.",
  },
  {
    name: "EXCLUDED_PROJECTS",
    requirement: "Optional",
    description:
      "Comma-separated project names or ids to exclude. Matching ignores case.",
  },
  {
    name: "BLOB_STORE_ID",
    requirement: "If using Blob",
    description:
      "Vercel adds this when you connect a Blob store and supplies the OIDC token at runtime.",
  },
];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .8a11.4 11.4 0 0 0-3.6 22.2c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.1 1.2a10.7 10.7 0 0 1 5.7 0c2.2-1.5 3.1-1.2 3.1-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.4 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.4 11.4 0 0 0 12 .8Z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="5" cy="4" r="2" fill="none" stroke="currentColor" />
      <circle cx="13" cy="4" r="2" fill="none" stroke="currentColor" />
      <circle cx="9" cy="14" r="2" fill="none" stroke="currentColor" />
      <path
        d="M5 6v1c0 2 1.6 3 4 3s4-1 4-3V6M9 10v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="inline-code">{children}</code>;
}

export default function Home() {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}#software`,
        name: siteConfig.name,
        url: siteUrl,
        description: siteConfig.description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        codeRepository: siteConfig.repositoryUrl,
        author: {
          "@type": "Person",
          name: siteConfig.author.name,
          url: siteConfig.author.url,
        },
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <a className="skip-link" href="#setup">
        Skip to setup
      </a>

      <section className="hero-shell">
        <div className="site-width">
          <nav className="nav" aria-label="Main navigation">
            <a
              className="brand"
              href="#top"
              aria-label="Vercel Analytics Digest home"
            >
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>Analytics Digest</span>
            </a>

            <div className="nav-links">
              <a href="#setup">Setup</a>
              <a
                className="nav-github"
                href={REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon />
                GitHub
              </a>
            </div>
          </nav>

          <div className="hero" id="top">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Open source / self-hosted
              </div>
              <h1>
                Vercel analytics.
                <span>Delivered by email.</span>
              </h1>
              <p className="hero-description">
                Every six hours, the app collects pageviews, visitor counts,
                and top routes from your projects. Resend emails the totals and
                compares them with the previous six hours.
              </p>

              <div className="hero-actions">
                <a className="button button-primary" href="#setup">
                  Deploy your own
                  <ArrowIcon />
                </a>
                <a
                  className="button button-secondary"
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <GitHubIcon />
                  Star on GitHub
                </a>
              </div>

              <p className="privacy-note">
                <span aria-hidden="true">◇</span>
                Your Vercel token stays in your project&apos;s environment.
              </p>
            </div>

            <div className="digest-scene" aria-label="Example analytics digest">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="digest-card">
                <div className="email-header">
                  <div className="email-brand">
                    <span>▲</span> Vercel Analytics
                  </div>
                  <h2>Six-hour traffic digest</h2>
                  <code>Jul 14, 6:00 AM CDT - Jul 14, 12:00 PM CDT</code>
                </div>

                <div className="email-summary">
                  <div className="email-summary-labels">
                    <span>Total pageviews</span>
                    <span>vs prior 6h</span>
                  </div>
                  <div className="email-total">
                    <strong>9,738</strong>
                    <span>▲ 18%</span>
                  </div>
                  <p>
                    <strong>6,585</strong> unique visitors <b>▲ 12%</b>
                    <i>·</i> 2 projects
                  </p>
                </div>

                <div className="email-projects-heading">
                  <span>Projects</span>
                  <span>Δ vs prior 6h</span>
                </div>

                <div className="email-project">
                  <div className="email-project-title">
                    <strong>keegan.codes</strong>
                    <span className="email-delta-up">▲ 24%</span>
                  </div>
                  <p>
                    <strong>5,821</strong> pageviews <i>·</i>{" "}
                    <strong>3,984</strong> visitors
                  </p>
                  <div className="email-traffic-bar">
                    <span className="bar-full" />
                  </div>
                  <div className="email-routes">
                    <div className="email-routes-label">
                      Top pages <span>· by pageviews</span>
                    </div>
                    <div>
                      <code>/projects</code>
                      <span>2,184</span>
                    </div>
                    <div>
                      <code>/blog</code>
                      <span>1,406</span>
                    </div>
                  </div>
                </div>

                <div className="email-project">
                  <div className="email-project-title">
                    <strong>admin</strong>
                    <span className="email-delta-up">▲ 9%</span>
                  </div>
                  <p>
                    <strong>3,917</strong> pageviews <i>·</i>{" "}
                    <strong>2,601</strong> visitors
                  </p>
                  <div className="email-traffic-bar">
                    <span className="bar-two-thirds" />
                  </div>
                  <div className="email-routes">
                    <div className="email-routes-label">
                      Top pages <span>· by pageviews</span>
                    </div>
                    <div>
                      <code>/dashboard</code>
                      <span>1,612</span>
                    </div>
                    <div>
                      <code>/reports</code>
                      <span>984</span>
                    </div>
                  </div>
                </div>

                <div className="email-report-action">
                  <span>View the full report&nbsp;&nbsp;→</span>
                </div>

                <div className="email-generated">
                  Generated 2026-07-14T17:00:00.000Z
                  <br />
                  Vercel Web Analytics · every 6 hours
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-strip" aria-label="Project features">
        <div className="site-width signal-grid">
          <div>
            <span>01</span>
            <p>
              <strong>Analytics projects</strong>Combined in one digest
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              <strong>Six-hour schedule</strong>Current vs. previous
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              <strong>Runs in your accounts</strong>Vercel, Resend, optional Blob
            </p>
          </div>
          <div>
            <span>04</span>
            <p>
              <strong>No database</strong>Compares live windows
            </p>
          </div>
        </div>
      </section>

      <section className="setup-section" id="setup">
        <div className="site-width">
          <div className="section-heading setup-heading">
            <span className="kicker">DEPLOYMENT RUNBOOK</span>
            <h2>Set up your fork.</h2>
            <p>
              The app runs in your Vercel and Resend accounts. Setup takes about
              10 minutes once your sending domain is verified.
            </p>
          </div>

          <div className="plan-note">
            <div className="plan-icon">!</div>
            <div>
              <strong>Use Vercel Pro for the six-hour schedule.</strong>
              <p>
                The included <Code>0 */6 * * *</Code> cron runs every six hours.
                Vercel Hobby limits cron jobs to about one run per day, so use a
                daily schedule on Hobby.
              </p>
            </div>
          </div>

          <div className="setup-layout">
            <aside className="setup-index" aria-label="Setup sections">
              <span>ON THIS PAGE</span>
              <a href="#deploy-project">
                <i>01</i>Create the project
              </a>
              <a href="#connect-services">
                <i>02</i>Connect services
              </a>
              <a href="#environment">
                <i>03</i>Environment
              </a>
              <a href="#deploy-verify">
                <i>04</i>Deploy &amp; verify
              </a>
            </aside>

            <div className="setup-content">
              <article className="setup-group" id="deploy-project">
                <div className="group-title">
                  <span>01</span>
                  <div>
                    <h3>Create your project</h3>
                    <p>Fork the repo and import it into Vercel.</p>
                  </div>
                </div>
                <div className="instruction-list">
                  <div className="instruction">
                    <span className="instruction-number">1</span>
                    <div>
                      <h4>Fork the repository</h4>
                      <p>
                        Fork the repo, then import your fork into Vercel. Keep
                        Next.js as the framework preset.
                      </p>
                      <div className="inline-actions">
                        <a href={FORK_URL} target="_blank" rel="noreferrer">
                          <ForkIcon />
                          Fork on GitHub
                        </a>
                        <a
                          href={REPOSITORY_URL}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="instruction">
                    <span className="instruction-number">2</span>
                    <div>
                      <h4>Create a Vercel access token</h4>
                      <p>
                        In Vercel Account Settings, create a token for the team
                        that owns the projects. Set an expiration and save it as
                        <Code>VERCEL_TOKEN</Code>. The REST API requires this
                        access token; OIDC cannot authenticate these requests.
                      </p>
                    </div>
                  </div>
                  <div className="instruction">
                    <span className="instruction-number">3</span>
                    <div>
                      <h4>Enable Web Analytics</h4>
                      <p>
                        In each project you want included, open its Analytics
                        tab and enable Web Analytics. The digest skips projects
                        without it.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="setup-group" id="connect-services">
                <div className="group-title">
                  <span>02</span>
                  <div>
                    <h3>Connect Resend and Blob</h3>
                    <p>
                      Resend is required. Blob adds a link to the full HTML report.
                    </p>
                  </div>
                </div>
                <div className="instruction-list">
                  <div className="instruction">
                    <span className="instruction-number">4</span>
                    <div>
                      <h4>Set up Resend</h4>
                      <p>
                        Create a Resend API key. Verify a sending domain (or a
                        subdomain such as <Code>reports.yourdomain.com</Code>)
                        with the DNS records Resend provides. Your
                        <Code>REPORT_FROM</Code> address must use that verified
                        domain.
                      </p>
                    </div>
                  </div>
                  <div className="instruction">
                    <span className="instruction-number">5</span>
                    <div>
                      <h4>Connect a public Blob store (optional)</h4>
                      <p>
                        Blob adds a hosted HTML report link to each email. To
                        enable it, open Storage in your Vercel project and
                        create or connect a Blob store. Choose
                        <strong> Public</strong> so recipients can open the
                        report without signing in. You cannot change the access
                        mode after creating the store.
                      </p>
                      <div className="detail-note">
                        <strong>Vercel uses OIDC for Blob uploads.</strong>{" "}
                        Connecting the store adds <Code>BLOB_STORE_ID</Code>.
                        Vercel supplies <Code>VERCEL_OIDC_TOKEN</Code> on
                        deployments. Enable OIDC federation in Project Settings
                        / Security.
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="setup-group" id="environment">
                <div className="group-title">
                  <span>03</span>
                  <div>
                    <h3>Configure the environment</h3>
                    <p>Store the app&apos;s configuration in Vercel.</p>
                  </div>
                </div>
                <div className="instruction-list compact">
                  <div className="instruction">
                    <span className="instruction-number">6</span>
                    <div>
                      <h4>Generate the cron secret</h4>
                      <p>
                        Create a strong random value. The endpoint fails closed
                        when this is absent.
                      </p>
                      <div
                        className="terminal"
                        role="group"
                        aria-label="Generate a cron secret command"
                      >
                        <div className="terminal-bar">
                          <span />
                          <span />
                          <span />
                          <small>TERMINAL</small>
                        </div>
                        <code>
                          <b>$</b> openssl rand -base64 32
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="instruction">
                    <span className="instruction-number">7</span>
                    <div>
                      <h4>Add production environment variables</h4>
                      <p>
                        Open Project / Settings / Environment Variables. Target
                        Production and mark secrets as Sensitive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="env-table-wrap">
                  <table className="env-table">
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Status</th>
                        <th>What it does</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ENV_VARS.map((envVar) => (
                        <tr key={envVar.name}>
                          <td>
                            <code>{envVar.name}</code>
                          </td>
                          <td>
                            <span
                              className={`status status-${envVar.requirement.toLowerCase().replaceAll(" ", "-")}`}
                            >
                              {envVar.requirement}
                            </span>
                          </td>
                          <td>{envVar.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="setup-group" id="deploy-verify">
                <div className="group-title">
                  <span>04</span>
                  <div>
                    <h3>Deploy and verify</h3>
                    <p>Redeploy, then call the report endpoint once.</p>
                  </div>
                </div>
                <div className="instruction-list">
                  <div className="instruction">
                    <span className="instruction-number">8</span>
                    <div>
                      <h4>Redeploy to Production</h4>
                      <p>
                        Vercel reads environment variables and Blob settings at
                        deployment time. Redeploy after connecting storage or
                        changing the configuration.
                      </p>
                    </div>
                  </div>
                  <div className="instruction">
                    <span className="instruction-number">9</span>
                    <div>
                      <h4>Trigger a test digest</h4>
                      <p>
                        Call the production endpoint with the same secret you
                        saved in Vercel.
                      </p>
                      <div
                        className="terminal terminal-wide"
                        role="group"
                        aria-label="Test the report endpoint command"
                      >
                        <div className="terminal-bar">
                          <span />
                          <span />
                          <span />
                          <small>TERMINAL</small>
                        </div>
                        <code>
                          <b>$</b> curl -H &quot;Authorization: Bearer
                          $CRON_SECRET&quot; <br />
                          &nbsp;&nbsp;https://&lt;your-production-url&gt;/api/report
                        </code>
                        <div className="terminal-result">
                          ✓{" "}
                          {`{"ok":true,"projects":3,"incompleteProjects":0,"reportUrl":"https://..."}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="checks">
                  <div>
                    <span>✓</span>
                    <p>
                      <strong>Email arrived</strong>Resend accepted and
                      delivered the digest.
                    </p>
                  </div>
                  <div>
                    <span>✓</span>
                    <p>
                      <strong>Report opens</strong>The public Blob URL returns
                      the full HTML report.
                    </p>
                  </div>
                  <div>
                    <span>✓</span>
                    <p>
                      <strong>No incomplete data</strong>
                      <Code>incompleteProjects</Code> is zero.
                    </p>
                  </div>
                </div>

                <details className="troubleshooting">
                  <summary>
                    Troubleshooting the first run <span>+</span>
                  </summary>
                  <div className="troubleshooting-grid">
                    <p>
                      <Code>reportUrl: null</Code>
                      <span>
                        Confirm the Blob store is connected to Production, OIDC
                        is enabled, and you redeployed afterward.
                      </span>
                    </p>
                    <p>
                      <Code>incompleteProjects &gt; 0</Code>
                      <span>
                        One or more analytics requests failed. The digest omits
                        projects that lack Web Analytics.
                      </span>
                    </p>
                    <p>
                      <Code>domain is not verified</Code>
                      <span>
                        Finish the DKIM, SPF/return-path, and DMARC setup in
                        Resend before sending.
                      </span>
                    </p>
                  </div>
                </details>

                <div className="local-note">
                  <span>LOCAL DEVELOPMENT</span>
                  <p>
                    Run <Code>vercel link</Code>, then{" "}
                    <Code>vercel env pull</Code>. Don&apos;t hand-edit env
                    files. Local OIDC is development-scoped. Use the deployed
                    endpoint when testing Blob uploads.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="open-source-cta">
        <div className="site-width cta-inner">
          <div>
            <span className="kicker">OPEN SOURCE ON GITHUB</span>
            <h2>Fork the repo and change what you need.</h2>
          </div>
          <div className="cta-actions">
            <a
              className="button button-light"
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon />
              Star the repo
            </a>
            <a
              className="button button-outline-light"
              href={FORK_URL}
              target="_blank"
              rel="noreferrer"
            >
              <ForkIcon />
              Fork your copy
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="site-width footer-inner">
          <a className="brand footer-brand" href="#top">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Analytics Digest</span>
          </a>
          <p>
            A project by{" "}
            <a href="https://keegan.codes" target="_blank" rel="noreferrer">
              keegan.codes
            </a>
          </p>
          <div className="footer-links">
            <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="#setup">Setup</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
