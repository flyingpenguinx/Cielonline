import { Link } from "react-router-dom";

const stats = [
  { label: "Revenue", value: "$18,240", note: "+22% this month" },
  { label: "Bookings", value: "68", note: "14 scheduled" },
  { label: "Customers", value: "312", note: "28 active leads" },
  { label: "Site visits", value: "5.8k", note: "+41% from QR" },
];

const tools = ["Overview", "Website", "Inquiries", "Calendar", "Customers", "Services", "Payments", "Analytics"];

const activity = [
  ["New inquiry", "Ceramic coating estimate", "2 min ago"],
  ["Payment", "Invoice paid through connected checkout", "Today"],
  ["Booking", "Mobile detail added to calendar", "Tomorrow"],
];

export default function AdminPreviewPage({ session }) {
  return (
    <main className="container main-space admin-preview-page fade-in">
      <section className="admin-preview-hero">
        <div className="admin-preview-copy">
          <p className="section-kicker">Admin Dashboard Preview</p>
          <h1>A calmer way to run the moving parts of your business.</h1>
          <p className="muted">
            Preview an operations hub for revenue, jobs, customers, website edits, payments, and analytics.
          </p>
          <div className="row-gap">
            <Link className="btn btn-primary" to={session ? "/admin" : "/login"}>
              {session ? "Open Admin Portal" : "Log in to manage"}
            </Link>
            <Link className="btn btn-secondary" to="/">Back Home</Link>
          </div>
        </div>
      </section>

      <section className="admin-preview-shell" aria-label="Admin dashboard interface preview">
        <aside className="admin-preview-sidebar">
          <img src="/Logo.svg" alt="" />
          <strong>Cielonline</strong>
          <nav>
            {tools.map((tool, index) => (
              <span className={index === 0 ? "active" : ""} key={tool}>{tool}</span>
            ))}
          </nav>
        </aside>

        <div className="admin-preview-main">
          <div className="admin-preview-toolbar">
            <div>
              <h2>Business Overview</h2>
              <p className="muted">Today at a glance</p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button">Export</button>
          </div>

          <div className="admin-preview-stats">
            {stats.map((stat) => (
              <article className="preview-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </article>
            ))}
          </div>

          <div className="admin-preview-content-grid">
            <article className="admin-preview-panel wide">
              <div className="panel-title-row">
                <h3>Cash flow</h3>
                <span>Last 30 days</span>
              </div>
              <div className="admin-preview-chart">
                <span style={{ height: "42%" }} />
                <span style={{ height: "56%" }} />
                <span style={{ height: "48%" }} />
                <span style={{ height: "72%" }} />
                <span style={{ height: "64%" }} />
                <span style={{ height: "86%" }} />
              </div>
            </article>

            <article className="admin-preview-panel">
              <div className="panel-title-row">
                <h3>Upcoming</h3>
                <span>Calendar</span>
              </div>
              <div className="schedule-list">
                <span>9:00 Website update</span>
                <span>11:30 Detail booking</span>
                <span>2:00 Payment follow-up</span>
              </div>
            </article>

            <article className="admin-preview-panel wide">
              <div className="panel-title-row">
                <h3>Recent activity</h3>
                <span>Live feed</span>
              </div>
              <div className="activity-list">
                {activity.map(([title, detail, time]) => (
                  <div className="activity-row" key={title}>
                    <div>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </div>
                    <small>{time}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
