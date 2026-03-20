import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  updateClientSite,
} from "../../lib/adminApi";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_COLORS = {
  new: "#2563eb",
  contacted: "#f59e0b",
  booked: "#10b981",
  completed: "#6b7280",
  cancelled: "#ef4444",
  scheduled: "#2563eb",
  confirmed: "#10b981",
  in_progress: "#f59e0b",
  no_show: "#ef4444",
};

export default function OverviewTab({ siteId, site, onSiteUpdated }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteForm, setSiteForm] = useState({
    site_name: site?.site_name || "",
    site_url: site?.site_url || "",
    slug: site?.slug || "",
    description: site?.description || "",
    is_published: site?.is_published !== false,
  });
  const [savingSite, setSavingSite] = useState(false);

  useEffect(() => {
    setSiteForm({
      site_name: site?.site_name || "",
      site_url: site?.site_url || "",
      slug: site?.slug || "",
      description: site?.description || "",
      is_published: site?.is_published !== false,
    });
  }, [site]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        fetchDashboardStats(siteId),
        fetchRecentActivity(siteId),
      ]);
      setStats(s);
      setActivity(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading overview...</span>
      </div>
    );
  }

  const handleSiteSave = async (event) => {
    event.preventDefault();
    setSavingSite(true);
    try {
      const updated = await updateClientSite(siteId, {
        site_name: siteForm.site_name,
        site_url: siteForm.site_url || null,
        slug: siteForm.slug || null,
        description: siteForm.description || null,
        is_published: siteForm.is_published,
      });
      onSiteUpdated?.(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSite(false);
    }
  };

  return (
    <div className="admin-overview">
      {/* Site Info Banner */}
      <div className="overview-site-banner">
        <div className="overview-site-info">
          <h2>{site?.site_name || "Your Business"}</h2>
          {site?.site_url && (
            <a
              href={site.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="overview-site-url"
            >
              {site.site_url} ↗
            </a>
          )}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <section className="panel">
        <div className="admin-section-header">
          <div>
            <h3>Site Operations</h3>
            <p className="muted">Control the main site identity, public URL, slug, and publish state from one place.</p>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSiteSave}>
          <div className="form-grid">
            <label className="field">
              <span>Site Name</span>
              <input value={siteForm.site_name} onChange={(e) => setSiteForm((prev) => ({ ...prev, site_name: e.target.value }))} />
            </label>
            <label className="field">
              <span>Public URL</span>
              <input type="url" value={siteForm.site_url} onChange={(e) => setSiteForm((prev) => ({ ...prev, site_url: e.target.value }))} placeholder="https://your-client-site.vercel.app" />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Slug</span>
              <input value={siteForm.slug} onChange={(e) => setSiteForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="vivid-auto-details" />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={siteForm.description} onChange={(e) => setSiteForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Luxury auto detailing in Sacramento" />
            </label>
          </div>

          <label className="checkbox-field">
            <input type="checkbox" checked={siteForm.is_published} onChange={(e) => setSiteForm((prev) => ({ ...prev, is_published: e.target.checked }))} />
            <span>Site is published and available to the public</span>
          </label>

          <div className="row-gap">
            <button type="submit" className="btn btn-primary" disabled={savingSite}>
              {savingSite ? "Saving..." : "Save Site Settings"}
            </button>
          </div>
        </form>
      </section>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-body">
            <div className="stat-number">{stats?.totalCustomers ?? 0}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>
        <div className="stat-card stat-card-alert">
          <div className="stat-icon">📩</div>
          <div className="stat-body">
            <div className="stat-number">{stats?.newInquiries ?? 0}</div>
            <div className="stat-label">New Inquiries</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-body">
            <div className="stat-number">{stats?.upcomingAppointments ?? 0}</div>
            <div className="stat-label">Upcoming Appointments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-body">
            <div className="stat-number">{stats?.appointmentsThisMonth ?? 0}</div>
            <div className="stat-label">Appointments (30d)</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <section className="panel admin-activity-panel">
        <h3>Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="muted">No recent activity yet. Inquiries and appointments will appear here.</p>
        ) : (
          <div className="activity-list">
            {activity.map((item) => (
              <div key={`${item.type}-${item.id}`} className="activity-item">
                <div className="activity-icon">
                  {item.type === "inquiry" ? "📩" : "📅"}
                </div>
                <div className="activity-body">
                  <div className="activity-title">
                    {item.type === "inquiry" ? (
                      <span>
                        <strong>{item.name || "Unknown"}</strong> submitted an inquiry
                        {item.service_requested ? ` for ${item.service_requested}` : ""}
                      </span>
                    ) : (
                      <span>
                        <strong>
                          {item.customers
                            ? `${item.customers.first_name} ${item.customers.last_name}`
                            : "Customer"}
                        </strong>{" "}
                        — {item.title || "Appointment"}
                      </span>
                    )}
                  </div>
                  <div className="activity-meta">
                    <span
                      className="status-dot"
                      style={{ background: STATUS_COLORS[item.status] || "#94a3b8" }}
                    />
                    <span className="activity-status">{(item.status || "unknown").replace(/_/g, " ")}</span>
                    <span className="activity-time">{formatDate(item.sort_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
