import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  fetchCustomers,
  fetchServices,
} from "../../lib/adminApi";

const STATUS_LABELS = {
  requested: "Requested",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const STATUS_COLORS = {
  requested: "#7c3aed",
  scheduled: "#2563eb",
  confirmed: "#10b981",
  in_progress: "#f59e0b",
  completed: "#6b7280",
  cancelled: "#ef4444",
  no_show: "#dc2626",
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toLocalDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMPTY_FORM = {
  customer_id: "",
  title: "",
  service_name: "",
  scheduled_at: "",
  duration_minutes: 60,
  notes: "",
  status: "scheduled",
};

export default function CalendarTab({ siteId }) {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appts, custs, srvs] = await Promise.all([
        fetchAppointments(siteId),
        fetchCustomers(siteId),
        fetchServices(siteId),
      ]);
      setAppointments(appts);
      setCustomers(custs);
      setServices(srvs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const dateKey = toLocalDateString(new Date(a.scheduled_at));
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(a);
    });
    return map;
  }, [appointments]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDay, daysInMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(toLocalDateString(today));
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const openNewForm = (dateStr) => {
    const dt = dateStr || toLocalDateString(today);
    setForm({ ...EMPTY_FORM, scheduled_at: `${dt}T09:00` });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (appt) => {
    const dt = new Date(appt.scheduled_at);
    const dtStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    setForm({
      customer_id: appt.customer_id || "",
      title: appt.title || "",
      service_name: appt.service_name || "",
      scheduled_at: dtStr,
      duration_minutes: appt.duration_minutes || 60,
      notes: appt.notes || "",
      status: appt.status || "scheduled",
    });
    setEditingId(appt.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.scheduled_at || !form.title) return;
    setSaving(true);
    try {
      const payload = {
        site_id: siteId,
        customer_id: form.customer_id || null,
        title: form.title,
        service_name: form.service_name || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes) || 60,
        notes: form.notes || null,
        status: form.status,
      };

      if (editingId) {
        const updated = await updateAppointment(editingId, payload);
        setAppointments((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await createAppointment(payload);
        setAppointments((prev) => [...prev, created]);
      }
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateAppointment(id, { status: newStatus });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const selectedAppts = selectedDate ? (appointmentsByDate[selectedDate] || []) : [];

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="admin-calendar">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Calendar</h2>
          <p className="muted">{appointments.length} total appointments</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={goToToday}>
            Today
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openNewForm(selectedDate)}
          >
            + New Appointment
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Calendar Grid */}
        <div className="calendar-panel panel">
          <div className="calendar-nav">
            <button type="button" className="btn btn-secondary btn-sm" onClick={prevMonth}>
              ‹
            </button>
            <h3 className="calendar-month-label">
              {MONTHS[viewMonth]} {viewYear}
            </h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={nextMonth}>
              ›
            </button>
          </div>

          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-day-header">
                {d}
              </div>
            ))}
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
              const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
              const dayAppts = appointmentsByDate[dateStr] || [];
              const isToday = dateStr === toLocalDateString(today);
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  className={`calendar-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${dayAppts.length > 0 ? "has-events" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="calendar-day-number">{day}</span>
                  {dayAppts.length > 0 && (
                    <div className="calendar-dots">
                      {dayAppts.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="calendar-dot"
                          style={{ background: STATUS_COLORS[a.status] || "#94a3b8" }}
                        />
                      ))}
                      {dayAppts.length > 3 && <span className="calendar-dot-more">+{dayAppts.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail / Form Panel */}
        <div className="calendar-detail-panel">
          {showForm ? (
            <section className="panel">
              <h3>{editingId ? "Edit Appointment" : "New Appointment"}</h3>
              <form className="admin-form" onSubmit={handleSave}>
                <label className="field">
                  <span>Title *</span>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Full Detail Package"
                  />
                </label>

                <label className="field">
                  <span>Customer</span>
                  <select
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  >
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Service</span>
                  <select
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  >
                    <option value="">— Select service —</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.price ? `($${s.price})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Date & Time *</span>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Duration (minutes)</span>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any notes about this appointment..."
                    rows={3}
                  />
                </label>

                <div className="row-gap">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : selectedDate ? (
            <section className="panel">
              <div className="day-detail-header">
                <h3>
                  {new Date(selectedDate + "T12:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openNewForm(selectedDate)}
                >
                  + Add
                </button>
              </div>

              {selectedAppts.length === 0 ? (
                <p className="muted">No appointments this day.</p>
              ) : (
                <div className="day-appt-list">
                  {selectedAppts.map((a) => (
                    <div key={a.id} className="day-appt-card">
                      <div className="day-appt-time">{formatTime(a.scheduled_at)}</div>
                      <div className="day-appt-body">
                        <div className="day-appt-title">{a.title}</div>
                        {a.customers && (
                          <div className="day-appt-customer">
                            {a.customers.first_name} {a.customers.last_name}
                          </div>
                        )}
                        {a.service_name && (
                          <div className="day-appt-service muted">{a.service_name}</div>
                        )}
                        <div className="day-appt-actions">
                          <select
                            className="status-select"
                            value={a.status}
                            onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditForm(a)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(a.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <span
                        className="day-appt-status-dot"
                        style={{ background: STATUS_COLORS[a.status] || "#94a3b8" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="panel">
              <p className="muted" style={{ textAlign: "center", padding: 32 }}>
                Select a day on the calendar to view appointments, or click "New Appointment" to create one.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
