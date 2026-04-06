import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchInquiries, fetchAppointments, fetchCustomers, fetchCompletedJobs } from "../../lib/adminApi";
import { fetchPayments, fetchSiteEvents } from "../../lib/sitePlatformApi";

function formatMonthLabel(dateStr) {
  const d = new Date(dateStr + "-01");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekdayName(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Parse user agent into device category ── */
function parseDevice(ua) {
  if (!ua) return "Unknown";
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(lower)) return "Mobile";
  if (/tablet|ipad/.test(lower)) return "Tablet";
  return "Desktop";
}

/* ── Parse browser from user agent ── */
function parseBrowser(ua) {
  if (!ua) return "Unknown";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

/* ── Parse referrer into a source category ── */
function parseReferrerSource(ref) {
  if (!ref) return "Direct";
  const lower = ref.toLowerCase();
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\./.test(lower)) return "Search";
  if (/facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|tiktok\.|youtube\./.test(lower)) return "Social";
  if (/t\.co\//.test(lower)) return "Social";
  if (lower.includes(window.location.hostname)) return "Internal";
  return "Referral";
}

/* ── Extract referrer domain ── */
function parseReferrerDomain(ref) {
  if (!ref) return "direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return ref.slice(0, 40);
  }
}

function BarChart({ data, label, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="analytics-chart">
      <h4>{label}</h4>
      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bar-col">
            <div className="bar-wrapper">
              <div
                className="bar-fill"
                style={{
                  height: `${(d.value / max) * 100}%`,
                  background: color,
                }}
              />
            </div>
            <span className="bar-label">{d.label}</span>
            <span className="bar-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal list chart for ranked items ── */
function RankedList({ data, label, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="analytics-chart">
      <h4>{label}</h4>
      <div className="ranked-list">
        {data.map((d, i) => (
          <div key={i} className="ranked-row">
            <span className="ranked-label">{d.label}</span>
            <div className="ranked-bar-track">
              <div className="ranked-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
            </div>
            <span className="ranked-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tabs for switching analytics sections ── */
const ANALYTICS_SECTIONS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "traffic", label: "Traffic", icon: "🌐" },
  { key: "business", label: "Business", icon: "💼" },
  { key: "reports", label: "Reports", icon: "📋" },
];

export default function AnalyticsTab({ siteId }) {
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [siteEvents, setSiteEvents] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");

  // Reports date range
  const [reportRange, setReportRange] = useState("30d");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inq, appts, custs, paymentRows, eventRows, jobRows] = await Promise.all([
        fetchInquiries(siteId),
        fetchAppointments(siteId),
        fetchCustomers(siteId),
        fetchPayments(siteId),
        fetchSiteEvents(siteId),
        fetchCompletedJobs(siteId),
      ]);
      setInquiries(inq);
      setAppointments(appts);
      setCustomers(custs);
      setPayments(paymentRows);
      setSiteEvents(eventRows);
      setCompletedJobs(jobRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // ══════════════════════════════════════════════
  //  BUSINESS METRICS (existing)
  // ══════════════════════════════════════════════
  const inquiryByMonth = useMemo(() => {
    const map = {};
    inquiries.forEach((i) => { const key = getMonthKey(i.created_at); map[key] = (map[key] || 0) + 1; });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [inquiries]);

  const apptByMonth = useMemo(() => {
    const map = {};
    appointments.forEach((a) => { const key = getMonthKey(a.scheduled_at); map[key] = (map[key] || 0) + 1; });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [appointments]);

  const inquiryByStatus = useMemo(() => {
    const map = {};
    inquiries.forEach((i) => { const s = i.status || "unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [inquiries]);

  const apptByStatus = useMemo(() => {
    const map = {};
    appointments.forEach((a) => { const s = (a.status || "unknown").replace(/_/g, " "); map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [appointments]);

  const customersByMonth = useMemo(() => {
    const map = {};
    customers.forEach((c) => { const key = getMonthKey(c.created_at); map[key] = (map[key] || 0) + 1; });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [customers]);

  const customersBySource = useMemo(() => {
    const map = {};
    customers.forEach((c) => { const s = c.source || "unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }));
  }, [customers]);

  const revenueByMonth = useMemo(() => {
    const map = {};
    payments.filter((p) => p.status === "paid").forEach((p) => {
      const key = getMonthKey(p.paid_at || p.created_at);
      map[key] = (map[key] || 0) + Number(p.amount || 0);
    });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: Number(map[k].toFixed(2)) }));
  }, [payments]);

  const topEvents = useMemo(() => {
    const map = {};
    siteEvents.forEach((e) => { const key = e.event_name || e.event_type || "unknown"; map[key] = (map[key] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));
  }, [siteEvents]);

  const busiestDays = useMemo(() => {
    const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    appointments.forEach((a) => { const day = getWeekdayName(a.scheduled_at); map[day] = (map[day] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [appointments]);

  // ══════════════════════════════════════════════
  //  TRAFFIC ANALYTICS (new)
  // ══════════════════════════════════════════════
  const pageViewEvents = useMemo(() => siteEvents.filter((e) => e.event_type === "page_view"), [siteEvents]);

  // Page views by day (last 14 days)
  const viewsByDay = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => { const key = getDayKey(e.created_at); map[key] = (map[key] || 0) + 1; });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-14).map((k) => ({ label: formatDayLabel(k), value: map[k] }));
  }, [pageViewEvents]);

  // Unique visitors (by visitor_id) by day
  const uniqueVisitorsByDay = useMemo(() => {
    const dayMap = {};
    pageViewEvents.forEach((e) => {
      const key = getDayKey(e.created_at);
      if (!dayMap[key]) dayMap[key] = new Set();
      dayMap[key].add(e.visitor_id || e.id);
    });
    const sorted = Object.keys(dayMap).sort();
    return sorted.slice(-14).map((k) => ({ label: formatDayLabel(k), value: dayMap[k].size }));
  }, [pageViewEvents]);

  // Total unique visitors
  const uniqueVisitors = useMemo(() => {
    const set = new Set();
    pageViewEvents.forEach((e) => set.add(e.visitor_id || e.id));
    return set.size;
  }, [pageViewEvents]);

  // Referrer sources breakdown
  const referrerSources = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => {
      const src = parseReferrerSource(e.referrer);
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [pageViewEvents]);

  // Top referrer domains
  const topReferrers = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => {
      const domain = parseReferrerDomain(e.referrer);
      map[domain] = (map[domain] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  }, [pageViewEvents]);

  // Top pages
  const topPages = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => {
      const page = e.page_path || "/";
      map[page] = (map[page] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  }, [pageViewEvents]);

  // Device breakdown
  const deviceBreakdown = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => {
      const dev = parseDevice(e.user_agent);
      map[dev] = (map[dev] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [pageViewEvents]);

  // Browser breakdown
  const browserBreakdown = useMemo(() => {
    const map = {};
    pageViewEvents.forEach((e) => {
      const br = parseBrowser(e.user_agent);
      map[br] = (map[br] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [pageViewEvents]);

  // Views by hour of day
  const viewsByHour = useMemo(() => {
    const map = {};
    for (let h = 0; h < 24; h++) map[h] = 0;
    pageViewEvents.forEach((e) => {
      const h = new Date(e.created_at).getHours();
      map[h] = (map[h] || 0) + 1;
    });
    return Object.entries(map).map(([h, v]) => ({ label: `${String(h).padStart(2, "0")}:00`, value: v }));
  }, [pageViewEvents]);

  // Quick stats
  const conversionRate = inquiries.length > 0
    ? ((inquiries.filter((i) => i.status === "booked" || i.status === "completed").length / inquiries.length) * 100).toFixed(1)
    : 0;

  const completedAppts = appointments.filter((a) => a.status === "completed").length;
  const completionRate = appointments.length > 0
    ? ((completedAppts / appointments.length) * 100).toFixed(1)
    : 0;

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    .toFixed(2);

  const totalPageViews = pageViewEvents.length;

  // Avg views per day
  const avgViewsPerDay = useMemo(() => {
    if (viewsByDay.length === 0) return 0;
    const total = viewsByDay.reduce((s, d) => s + d.value, 0);
    return (total / viewsByDay.length).toFixed(1);
  }, [viewsByDay]);

  // Bounce rate approximation (visitors with only 1 page view)
  const bounceRate = useMemo(() => {
    const visitorPageCounts = {};
    pageViewEvents.forEach((e) => {
      const vid = e.visitor_id || e.id;
      visitorPageCounts[vid] = (visitorPageCounts[vid] || 0) + 1;
    });
    const visitors = Object.keys(visitorPageCounts);
    if (visitors.length === 0) return "0";
    const singlePage = visitors.filter((v) => visitorPageCounts[v] === 1).length;
    return ((singlePage / visitors.length) * 100).toFixed(1);
  }, [pageViewEvents]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="admin-section-header">
        <div>
          <h2>Analytics & Insights</h2>
          <p className="muted">Business performance and website traffic</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="analytics-tabs">
        {ANALYTICS_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`analytics-tab-btn ${section === s.key ? "active" : ""}`}
            onClick={() => setSection(s.key)}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ OVERVIEW SECTION ═══════════════ */}
      {section === "overview" && (
        <>
          <div className="analytics-summary">
            <div className="analytics-stat">
              <div className="analytics-stat-value">{totalPageViews}</div>
              <div className="analytics-stat-label">Page Views</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{uniqueVisitors}</div>
              <div className="analytics-stat-label">Unique Visitors</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{inquiries.length}</div>
              <div className="analytics-stat-label">Inquiries</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{appointments.length}</div>
              <div className="analytics-stat-label">Appointments</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{customers.length}</div>
              <div className="analytics-stat-label">Customers</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{conversionRate}%</div>
              <div className="analytics-stat-label">Conversion</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">${totalRevenue}</div>
              <div className="analytics-stat-label">Revenue</div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            {viewsByDay.length > 0 && (
              <div className="panel analytics-chart-wide">
                <BarChart data={viewsByDay} label="Page Views (Last 14 Days)" color="#2563eb" />
              </div>
            )}
            {topEvents.length > 0 && (
              <div className="panel">
                <RankedList data={topEvents} label="Top Website Events" color="#0f172a" />
              </div>
            )}
            {referrerSources.length > 0 && (
              <div className="panel">
                <BarChart data={referrerSources} label="Traffic Sources" color="#8b5cf6" />
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ TRAFFIC SECTION ═══════════════ */}
      {section === "traffic" && (
        <>
          <div className="analytics-summary">
            <div className="analytics-stat">
              <div className="analytics-stat-value">{totalPageViews}</div>
              <div className="analytics-stat-label">Total Page Views</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{uniqueVisitors}</div>
              <div className="analytics-stat-label">Unique Visitors</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{avgViewsPerDay}</div>
              <div className="analytics-stat-label">Avg Views / Day</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{bounceRate}%</div>
              <div className="analytics-stat-label">Bounce Rate</div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            {viewsByDay.length > 0 && (
              <div className="panel analytics-chart-wide">
                <BarChart data={viewsByDay} label="Page Views by Day" color="#2563eb" />
              </div>
            )}
            {uniqueVisitorsByDay.length > 0 && (
              <div className="panel analytics-chart-wide">
                <BarChart data={uniqueVisitorsByDay} label="Unique Visitors by Day" color="#10b981" />
              </div>
            )}
            {referrerSources.length > 0 && (
              <div className="panel">
                <BarChart data={referrerSources} label="How They Found You" color="#8b5cf6" />
              </div>
            )}
            {topReferrers.length > 0 && (
              <div className="panel">
                <RankedList data={topReferrers} label="Top Referrer Domains" color="#0891b2" />
              </div>
            )}
            {topPages.length > 0 && (
              <div className="panel">
                <RankedList data={topPages} label="Most Visited Pages" color="#2563eb" />
              </div>
            )}
            {deviceBreakdown.length > 0 && (
              <div className="panel">
                <BarChart data={deviceBreakdown} label="Device Type" color="#ea580c" />
              </div>
            )}
            {browserBreakdown.length > 0 && (
              <div className="panel">
                <BarChart data={browserBreakdown} label="Browser" color="#7c3aed" />
              </div>
            )}
            {viewsByHour.length > 0 && (
              <div className="panel analytics-chart-wide">
                <BarChart data={viewsByHour} label="Traffic by Hour of Day" color="#0f766e" />
              </div>
            )}
          </div>

          {pageViewEvents.length === 0 && (
            <div className="admin-empty">
              <span className="admin-empty-icon">🌐</span>
              <h3>No traffic data yet</h3>
              <p className="muted">Traffic analytics will appear once visitors start viewing your site. Page views, referrer sources, device types, and more will be tracked automatically.</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ BUSINESS SECTION ═══════════════ */}
      {section === "business" && (
        <>
          <div className="analytics-summary">
            <div className="analytics-stat">
              <div className="analytics-stat-value">{inquiries.length}</div>
              <div className="analytics-stat-label">Total Inquiries</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{appointments.length}</div>
              <div className="analytics-stat-label">Total Appointments</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{customers.length}</div>
              <div className="analytics-stat-label">Total Customers</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{conversionRate}%</div>
              <div className="analytics-stat-label">Inquiry → Booked</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">{completionRate}%</div>
              <div className="analytics-stat-label">Completion Rate</div>
            </div>
            <div className="analytics-stat">
              <div className="analytics-stat-value">${totalRevenue}</div>
              <div className="analytics-stat-label">Revenue Collected</div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            {inquiryByMonth.length > 0 && (
              <div className="panel">
                <BarChart data={inquiryByMonth} label="Inquiries by Month" color="#2563eb" />
              </div>
            )}
            {apptByMonth.length > 0 && (
              <div className="panel">
                <BarChart data={apptByMonth} label="Appointments by Month" color="#10b981" />
              </div>
            )}
            {customersByMonth.length > 0 && (
              <div className="panel">
                <BarChart data={customersByMonth} label="New Customers by Month" color="#8b5cf6" />
              </div>
            )}
            {revenueByMonth.length > 0 && (
              <div className="panel">
                <BarChart data={revenueByMonth} label="Revenue by Month" color="#0f766e" />
              </div>
            )}
            <div className="panel">
              <BarChart data={busiestDays} label="Busiest Days of Week" color="#f59e0b" />
            </div>
            {inquiryByStatus.length > 0 && (
              <div className="panel">
                <BarChart data={inquiryByStatus} label="Inquiries by Status" color="#2563eb" />
              </div>
            )}
            {apptByStatus.length > 0 && (
              <div className="panel">
                <BarChart data={apptByStatus} label="Appointments by Status" color="#10b981" />
              </div>
            )}
            {customersBySource.length > 0 && (
              <div className="panel">
                <BarChart data={customersBySource} label="Customers by Source" color="#8b5cf6" />
              </div>
            )}
          </div>

          {inquiries.length === 0 && appointments.length === 0 && customers.length === 0 && payments.length === 0 && (
            <div className="admin-empty">
              <span className="admin-empty-icon">💼</span>
              <h3>No business data yet</h3>
              <p className="muted">Analytics will populate as inquiries, appointments, customers, and payments come in.</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ REPORTS SECTION ═══════════════ */}
      {section === "reports" && (
        <ReportsSection
          completedJobs={completedJobs}
          appointments={appointments}
          customers={customers}
          payments={payments}
          inquiries={inquiries}
          reportRange={reportRange}
          setReportRange={setReportRange}
          reportFrom={reportFrom}
          setReportFrom={setReportFrom}
          reportTo={reportTo}
          setReportTo={setReportTo}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REPORTS SECTION — date-range filtering, client frequency, job logs
   ═══════════════════════════════════════════════════════════════════ */

const RANGE_PRESETS = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "ytd", label: "Year to Date" },
  { key: "1y", label: "Last 12 Months" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

function getDateRange(preset, customFrom, customTo) {
  const now = new Date();
  let from = null;
  let to = now;

  switch (preset) {
    case "7d": from = new Date(Date.now() - 7 * 86400000); break;
    case "30d": from = new Date(Date.now() - 30 * 86400000); break;
    case "90d": from = new Date(Date.now() - 90 * 86400000); break;
    case "ytd": from = new Date(now.getFullYear(), 0, 1); break;
    case "1y": from = new Date(Date.now() - 365 * 86400000); break;
    case "all": from = null; break;
    case "custom":
      from = customFrom ? new Date(customFrom) : null;
      to = customTo ? new Date(customTo + "T23:59:59") : now;
      break;
    default: from = new Date(Date.now() - 30 * 86400000);
  }
  return { from, to };
}

function filterByRange(items, dateField, from, to) {
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function ReportsSection({ completedJobs, appointments, customers, payments, inquiries, reportRange, setReportRange, reportFrom, setReportFrom, reportTo, setReportTo }) {
  const { from, to } = getDateRange(reportRange, reportFrom, reportTo);

  const filteredJobs = useMemo(() => filterByRange(completedJobs, "completed_at", from, to), [completedJobs, from, to]);
  const filteredAppts = useMemo(() => filterByRange(appointments, "scheduled_at", from, to), [appointments, from, to]);
  const filteredPayments = useMemo(() => filterByRange(payments, "created_at", from, to), [payments, from, to]);
  const filteredInquiries = useMemo(() => filterByRange(inquiries, "created_at", from, to), [inquiries, from, to]);

  const completedAppts = filteredAppts.filter((a) => a.status === "completed");
  const paidPayments = filteredPayments.filter((p) => p.status === "paid");
  const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalJobRevenue = filteredJobs.reduce((s, j) => s + Number(j.amount_charged || 0), 0);

  // Client visit frequency
  const clientFrequency = useMemo(() => {
    const map = {};
    filteredJobs.forEach((j) => {
      if (!j.customer_id) return;
      if (!map[j.customer_id]) map[j.customer_id] = { count: 0, customer: j.customers };
      map[j.customer_id].count++;
    });
    return Object.entries(map)
      .map(([id, { count, customer }]) => ({
        id,
        name: customer ? `${customer.first_name} ${customer.last_name}` : "Unknown",
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredJobs]);

  // Top services performed
  const topServices = useMemo(() => {
    const map = {};
    filteredJobs.forEach((j) => {
      const svcs = j.services_performed?.length ? j.services_performed : [j.title];
      svcs.forEach((svc) => { map[svc] = (map[svc] || 0) + 1; });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }, [filteredJobs]);

  // Jobs by month
  const jobsByMonth = useMemo(() => {
    const map = {};
    filteredJobs.forEach((j) => {
      const key = getMonthKey(j.completed_at);
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.keys(map).sort();
    return sorted.map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [filteredJobs]);

  // Revenue by month (from completed jobs)
  const jobRevenueByMonth = useMemo(() => {
    const map = {};
    filteredJobs.forEach((j) => {
      if (!j.amount_charged) return;
      const key = getMonthKey(j.completed_at);
      map[key] = (map[key] || 0) + Number(j.amount_charged);
    });
    const sorted = Object.keys(map).sort();
    return sorted.map((k) => ({ label: formatMonthLabel(k), value: Number(map[k].toFixed(2)) }));
  }, [filteredJobs]);

  // New vs returning clients
  const newVsReturning = useMemo(() => {
    const allJobCustomers = {};
    // Sort all completed jobs by date ascending to track first visit
    const sorted = [...completedJobs].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
    sorted.forEach((j) => {
      if (!j.customer_id) return;
      if (!allJobCustomers[j.customer_id]) allJobCustomers[j.customer_id] = j.completed_at;
    });

    let newClients = 0;
    let returning = 0;
    filteredJobs.forEach((j) => {
      if (!j.customer_id) return;
      const firstVisit = allJobCustomers[j.customer_id];
      if (from && new Date(firstVisit) >= from && new Date(firstVisit) <= to) {
        newClients++;
      } else {
        returning++;
      }
    });
    return [
      { label: "New Client", value: newClients },
      { label: "Returning", value: returning },
    ];
  }, [completedJobs, filteredJobs, from, to]);

  return (
    <>
      {/* Date range selector */}
      <div className="panel" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 16px" }}>
        <span className="detail-label" style={{ marginRight: 4 }}>Date Range:</span>
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`filter-chip ${reportRange === p.key ? "active" : ""}`}
            onClick={() => setReportRange(p.key)}
          >
            {p.label}
          </button>
        ))}
        {reportRange === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
            <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="search-input" style={{ width: 150, padding: "4px 8px" }} />
            <span>to</span>
            <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="search-input" style={{ width: 150, padding: "4px 8px" }} />
          </div>
        )}
      </div>

      {/* Summary stats for period */}
      <div className="analytics-summary">
        <div className="analytics-stat">
          <div className="analytics-stat-value">{filteredJobs.length}</div>
          <div className="analytics-stat-label">Jobs Completed</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">${totalJobRevenue.toFixed(2)}</div>
          <div className="analytics-stat-label">Job Revenue</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">{completedAppts.length}</div>
          <div className="analytics-stat-label">Appts Completed</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">${totalRevenue.toFixed(2)}</div>
          <div className="analytics-stat-label">Payments Collected</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">{filteredInquiries.length}</div>
          <div className="analytics-stat-label">Inquiries</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">{clientFrequency.length}</div>
          <div className="analytics-stat-label">Unique Clients Served</div>
        </div>
      </div>

      <div className="analytics-charts-grid">
        {/* Jobs by month */}
        {jobsByMonth.length > 0 && (
          <div className="panel">
            <BarChart data={jobsByMonth} label="Jobs Completed by Month" color="#10b981" />
          </div>
        )}

        {/* Revenue by month */}
        {jobRevenueByMonth.length > 0 && (
          <div className="panel">
            <BarChart data={jobRevenueByMonth} label="Job Revenue by Month ($)" color="#0f766e" />
          </div>
        )}

        {/* Top services */}
        {topServices.length > 0 && (
          <div className="panel">
            <RankedList data={topServices} label="Most Performed Services" color="#2563eb" />
          </div>
        )}

        {/* New vs returning */}
        {filteredJobs.length > 0 && (
          <div className="panel">
            <BarChart data={newVsReturning} label="New vs Returning Clients" color="#8b5cf6" />
          </div>
        )}
      </div>

      {/* Client Visit Frequency Table */}
      {clientFrequency.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h4>Client Visit Frequency</h4>
          <p className="muted" style={{ marginBottom: 12 }}>Ranked by number of completed jobs in the selected period.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>#</th>
                  <th style={{ padding: "8px 12px" }}>Client</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Visits</th>
                </tr>
              </thead>
              <tbody>
                {clientFrequency.slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px" }}>{c.name}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent completed jobs list */}
      {filteredJobs.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h4>Recent Completed Jobs</h4>
          <div className="customer-appt-list">
            {filteredJobs.slice(0, 25).map((j) => (
              <div key={j.id} className="customer-appt-item">
                <div className="customer-appt-date">{formatDayLabel(j.completed_at)}</div>
                <div className="customer-appt-info">
                  <strong>{j.title}</strong>
                  {j.services_performed?.length > 0 && <span className="muted"> · {j.services_performed.join(", ")}</span>}
                  {j.customers && <span className="muted"> · {j.customers.first_name} {j.customers.last_name}</span>}
                </div>
                {j.amount_charged && <span style={{ fontWeight: 600, color: "#10b981" }}>${Number(j.amount_charged).toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredJobs.length === 0 && completedAppts.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty-icon">📋</span>
          <h3>No report data for this period</h3>
          <p className="muted">Log completed jobs from the Customers tab to populate reports. Adjust the date range above to see different periods.</p>
        </div>
      )}
    </>
  );
}
