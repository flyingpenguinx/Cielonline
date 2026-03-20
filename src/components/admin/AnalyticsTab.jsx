import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchInquiries, fetchAppointments, fetchCustomers } from "../../lib/adminApi";
import { fetchPayments, fetchSiteEvents } from "../../lib/sitePlatformApi";

function formatMonthLabel(dateStr) {
  const d = new Date(dateStr + "-01");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekdayName(iso) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
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

export default function AnalyticsTab({ siteId }) {
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [siteEvents, setSiteEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inq, appts, custs, paymentRows, eventRows] = await Promise.all([
        fetchInquiries(siteId),
        fetchAppointments(siteId),
        fetchCustomers(siteId),
        fetchPayments(siteId),
        fetchSiteEvents(siteId),
      ]);
      setInquiries(inq);
      setAppointments(appts);
      setCustomers(custs);
      setPayments(paymentRows);
      setSiteEvents(eventRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Computed Analytics ──
  const inquiryByMonth = useMemo(() => {
    const map = {};
    inquiries.forEach((i) => {
      const key = getMonthKey(i.created_at);
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [inquiries]);

  const apptByMonth = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const key = getMonthKey(a.scheduled_at);
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [appointments]);

  const inquiryByStatus = useMemo(() => {
    const map = {};
    inquiries.forEach((i) => {
      const s = i.status || "unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [inquiries]);

  const apptByStatus = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const s = (a.status || "unknown").replace(/_/g, " ");
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [appointments]);

  const customersByMonth = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      const key = getMonthKey(c.created_at);
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: map[k] }));
  }, [customers]);

  const customersBySource = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      const s = c.source || "unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }));
  }, [customers]);

  const revenueByMonth = useMemo(() => {
    const map = {};
    payments
      .filter((payment) => payment.status === "paid")
      .forEach((payment) => {
        const key = getMonthKey(payment.paid_at || payment.created_at);
        map[key] = (map[key] || 0) + Number(payment.amount || 0);
      });
    const sorted = Object.keys(map).sort();
    return sorted.slice(-6).map((k) => ({ label: formatMonthLabel(k), value: Number(map[k].toFixed(2)) }));
  }, [payments]);

  const topEvents = useMemo(() => {
    const map = {};
    siteEvents.forEach((event) => {
      const key = event.event_name || event.event_type || "unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));
  }, [siteEvents]);

  const busiestDays = useMemo(() => {
    const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    appointments.forEach((a) => {
      const day = getWeekdayName(a.scheduled_at);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [appointments]);

  // Quick stats
  const conversionRate = inquiries.length > 0
    ? ((inquiries.filter((i) => i.status === "booked" || i.status === "completed").length / inquiries.length) * 100).toFixed(1)
    : 0;

  const completedAppts = appointments.filter((a) => a.status === "completed").length;
  const completionRate = appointments.length > 0
    ? ((completedAppts / appointments.length) * 100).toFixed(1)
    : 0;

  const totalRevenue = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    .toFixed(2);

  const pageViews = siteEvents.filter((event) => event.event_type === "page_view").length;

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
          <p className="muted">Business performance overview</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
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
          <div className="analytics-stat-value">{pageViews}</div>
          <div className="analytics-stat-label">Tracked Page Views</div>
        </div>
        <div className="analytics-stat">
          <div className="analytics-stat-value">${totalRevenue}</div>
          <div className="analytics-stat-label">Revenue Collected</div>
        </div>
      </div>

      {/* Charts Grid */}
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
        {topEvents.length > 0 && (
          <div className="panel">
            <BarChart data={topEvents} label="Top Website Events" color="#0f172a" />
          </div>
        )}
      </div>

      {/* Empty state */}
      {inquiries.length === 0 && appointments.length === 0 && customers.length === 0 && payments.length === 0 && siteEvents.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty-icon">📊</span>
          <h3>No data yet</h3>
          <p className="muted">
            Analytics will populate as inquiries, appointments, customers, payments, and site activity are added.
          </p>
        </div>
      )}
    </div>
  );
}
