import { Link } from "react-router-dom";

const featureCards = [
  {
    to: "/qr-preview",
    eyebrow: "QR Preview",
    title: "Branded QR experiences",
    text: "Show customers a digital card, website link, or Wi-Fi access flow that feels polished from the first scan.",
    metric: "3 scan types",
  },
  {
    to: "/admin-preview",
    eyebrow: "Admin Preview",
    title: "Business command center",
    text: "Track inquiries, jobs, payments, customers, and site updates from a calm dashboard built for daily work.",
    metric: "8 core tools",
  },
  {
    to: "/preview",
    eyebrow: "Card Designer",
    title: "Simple custom layouts",
    text: "Experiment with a lightweight card designer before creating the QR-ready profile your customers will open.",
    metric: "Live preview",
  },
];

const dashboardRows = [
  ["Revenue", "$12,480", "+18%"],
  ["Open inquiries", "24", "6 new"],
  ["Bookings", "41", "This month"],
];

export default function HomePage({ session }) {
  return (
    <main className="home-landing fade-in">
      <section className="home-hero-section">
        <div className="home-hero-bg" aria-hidden="true" />
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="home-logo-mark">
              <img src="/Logo.svg" alt="" />
              <span>Cielonline</span>
            </div>
            <p className="home-kicker">Client sites, QR cards, and business tools in one place</p>
            <h1>Run your online presence with less clutter and more control.</h1>
            <p className="home-lead">
              Cielonline helps service businesses publish polished QR experiences, manage website content, and keep daily operations organized from one modern dashboard.
            </p>
            <div className="hero-actions home-actions">
              <Link className="btn btn-primary btn-lg" to={session ? "/dashboard" : "/login"}>
                {session ? "Open Dashboard" : "Log in"}
              </Link>
              <Link className="btn btn-secondary btn-lg" to="/qr-preview">QR Preview</Link>
              <Link className="btn btn-secondary btn-lg" to="/admin-preview">Admin Preview</Link>
            </div>
          </div>

          <div className="liquid-dashboard-preview" aria-label="Cielonline dashboard preview">
            <div className="preview-topbar">
              <img src="/Logo.svg" alt="" />
              <div>
                <strong>Cielonline</strong>
                <span>Operations dashboard</span>
              </div>
            </div>
            <div className="preview-stat-grid">
              {dashboardRows.map(([label, value, detail]) => (
                <div className="preview-stat" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
            <div className="preview-workspace">
              <div className="preview-side-nav">
                <span className="active" />
                <span />
                <span />
                <span />
              </div>
              <div className="preview-chart-card">
                <div className="chart-line" />
                <div className="chart-bars">
                  <span style={{ height: "38%" }} />
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "46%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "64%" }} />
                </div>
              </div>
              <div className="preview-task-stack">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-feature-section" aria-label="Cielonline previews">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Choose what to explore</p>
            <h2>Simple previews for the tools that matter most.</h2>
          </div>
          <p className="muted">Start with the QR experience, preview the admin dashboard, or test a lighter card designer before signing in.</p>
        </div>

        <div className="home-feature-grid">
          {featureCards.map((card) => (
            <Link className="home-feature-card" to={card.to} key={card.title}>
              <span className="feature-eyebrow">{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className="feature-card-footer">
                <span>{card.metric}</span>
                <span aria-hidden="true">-&gt;</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="home-beta-link-row">
          <a href="/web-builder-beta.html" target="_blank" rel="noreferrer">Open experimental WebBuilder beta</a>
        </div>
      </section>
    </main>
  );
}
