import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { fetchUserSites } from "../lib/adminApi";
import { isSupabaseConfigured } from "../lib/supabaseClient";

const OverviewTab = lazy(() => import("../components/admin/OverviewTab"));
const WebsiteTab = lazy(() => import("../components/admin/WebsiteTab"));
const InquiriesTab = lazy(() => import("../components/admin/InquiriesTab"));
const CalendarTab = lazy(() => import("../components/admin/CalendarTab"));
const CustomersTab = lazy(() => import("../components/admin/CustomersTab"));
const ServicesTab = lazy(() => import("../components/admin/ServicesTab"));
const AnalyticsTab = lazy(() => import("../components/admin/AnalyticsTab"));

const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "website", label: "Website", icon: "🌐" },
  { key: "inquiries", label: "Inquiries", icon: "📩" },
  { key: "calendar", label: "Calendar", icon: "📅" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "services", label: "Services", icon: "🛠️" },
  { key: "analytics", label: "Analytics", icon: "📈" },
];

const fallback = (
  <div className="loading-state" style={{ minHeight: 200 }}>
    <div className="loading-spinner" />
    <span>Loading...</span>
  </div>
);

export default function AdminDashboardPage({ user }) {
  const [sites, setSites] = useState([]);
  const [activeSite, setActiveSite] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserSites(user.id);
      setSites(data);
      if (data.length === 1) setActiveSite(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (isSupabaseConfigured) loadSites();
    else setLoading(false);
  }, [loadSites]);

  if (!isSupabaseConfigured) {
    return (
      <main className="container main-space fade-in">
        <section className="panel" style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2>Administration Portal</h2>
          <p className="muted">
            Supabase is not configured yet. Follow the setup guide to connect the database and enable the admin dashboard.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container main-space fade-in">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Loading your sites...</span>
        </div>
      </main>
    );
  }

  // ── Site Picker ──
  if (!activeSite) {
    return (
      <main className="container main-space fade-in">
        <section className="panel" style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2>Select a Website</h2>
          <p className="muted">Choose the website you want to manage.</p>

          {sites.length === 0 ? (
            <div className="admin-empty">
              <span className="admin-empty-icon">🌐</span>
              <h3>No sites assigned yet</h3>
              <p className="muted">
                When a website is created for your account by Cielonline, it will appear here.
                Contact support to get started.
              </p>
            </div>
          ) : (
            <div className="site-list-grid">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  className="site-list-card"
                  onClick={() => setActiveSite(site)}
                >
                  <div className="site-list-card-inner">
                    <span className="site-list-card-icon">🌐</span>
                    <div className="site-list-card-info">
                      <strong>{site.site_name}</strong>
                      {site.description && <span className="muted">{site.description}</span>}
                      {site.site_url && (
                        <span className="muted site-url-text">{site.site_url}</span>
                      )}
                    </div>
                  </div>
                  <span className="site-list-card-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  // ── Admin Dashboard ──
  return (
    <main className="container main-space fade-in">
      {/* Site switcher bar */}
      {sites.length > 1 && (
        <div className="admin-site-switcher">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveSite(null)}
          >
            ← Switch Site
          </button>
          <span className="admin-site-name">{activeSite.site_name}</span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="dashboard-tabs admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`dashboard-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Suspense fallback={fallback}>
        {activeTab === "overview" && (
          <OverviewTab siteId={activeSite.id} site={activeSite} />
        )}
        {activeTab === "website" && (
          <WebsiteTab siteId={activeSite.id} site={activeSite} user={user} />
        )}
        {activeTab === "inquiries" && <InquiriesTab siteId={activeSite.id} />}
        {activeTab === "calendar" && <CalendarTab siteId={activeSite.id} />}
        {activeTab === "customers" && <CustomersTab siteId={activeSite.id} />}
        {activeTab === "services" && <ServicesTab siteId={activeSite.id} />}
        {activeTab === "analytics" && <AnalyticsTab siteId={activeSite.id} />}
      </Suspense>
    </main>
  );
}
