import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardStats,
  fetchRecentActivity,
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

export default function OverviewTab({ siteId, site }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

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
