import { useState, useEffect, useCallback } from "react";
import { fetchInquiries, updateInquiryStatus, deleteInquiry } from "../../lib/adminApi";

const STATUSES = ["new", "contacted", "booked", "completed", "cancelled"];

const STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  new: "#2563eb",
  contacted: "#f59e0b",
  booked: "#10b981",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InquiriesTab({ siteId }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInquiries(siteId);
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    setSaving(true);
    try {
      const updated = await updateInquiryStatus(id, newStatus);
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (id) => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const inquiry = inquiries.find((i) => i.id === id);
      const updated = await updateInquiryStatus(id, inquiry.status, noteText.trim());
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setNoteText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this inquiry permanently?")) return;
    try {
      await deleteInquiry(id);
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);
  const newCount = inquiries.filter((i) => i.status === "new").length;

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading inquiries...</span>
      </div>
    );
  }

  return (
    <div className="admin-inquiries">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Inquiries & Leads</h2>
          <p className="muted">
            {inquiries.length} total · {newCount} new
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="inquiry-filters">
        <button
          type="button"
          className={`filter-chip ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({inquiries.length})
        </button>
        {STATUSES.map((s) => {
          const count = inquiries.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              type="button"
              className={`filter-chip ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              <span className="status-dot" style={{ background: STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">📩</span>
          <h3>No {filter !== "all" ? STATUS_LABELS[filter]?.toLowerCase() : ""} inquiries</h3>
          <p className="muted">
            When visitors submit a contact form on your website, their inquiries appear here.
          </p>
        </div>
      ) : (
        <div className="inquiry-list">
          {filtered.map((inq) => (
            <div
              key={inq.id}
              className={`inquiry-card ${expandedId === inq.id ? "expanded" : ""}`}
            >
              <div
                className="inquiry-card-header"
                onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
              >
                <div className="inquiry-card-left">
                  <span
                    className="status-badge"
                    style={{
                      background: `${STATUS_COLORS[inq.status]}15`,
                      color: STATUS_COLORS[inq.status],
                      borderColor: `${STATUS_COLORS[inq.status]}30`,
                    }}
                  >
                    {STATUS_LABELS[inq.status] || inq.status}
                  </span>
                  <div className="inquiry-card-info">
                    <strong>{inq.name || "Unknown"}</strong>
                    <span className="muted">{inq.email || "No email"}</span>
                  </div>
                </div>
                <div className="inquiry-card-right">
                  {inq.service_requested && (
                    <span className="inquiry-service">{inq.service_requested}</span>
                  )}
                  <span className="inquiry-time">{formatDate(inq.created_at)}</span>
                  <span className="inquiry-chevron">{expandedId === inq.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedId === inq.id && (
                <div className="inquiry-card-body">
                  <div className="inquiry-details-grid">
                    {inq.phone && (
                      <div className="inquiry-detail">
                        <span className="detail-label">Phone</span>
                        <a href={`tel:${inq.phone}`} className="detail-value">
                          {inq.phone}
                        </a>
                      </div>
                    )}
                    {inq.email && (
                      <div className="inquiry-detail">
                        <span className="detail-label">Email</span>
                        <a href={`mailto:${inq.email}`} className="detail-value">
                          {inq.email}
                        </a>
                      </div>
                    )}
                    {inq.service_requested && (
                      <div className="inquiry-detail">
                        <span className="detail-label">Service</span>
                        <span className="detail-value">{inq.service_requested}</span>
                      </div>
                    )}
                    {inq.preferred_date && (
                      <div className="inquiry-detail">
                        <span className="detail-label">Preferred Date</span>
                        <span className="detail-value">{formatDate(inq.preferred_date)}</span>
                      </div>
                    )}
                    {inq.vehicle_info && (
                      <div className="inquiry-detail">
                        <span className="detail-label">Vehicle</span>
                        <span className="detail-value">{inq.vehicle_info}</span>
                      </div>
                    )}
                  </div>

                  {inq.message && (
                    <div className="inquiry-message">
                      <span className="detail-label">Message</span>
                      <p>{inq.message}</p>
                    </div>
                  )}

                  {inq.admin_notes && (
                    <div className="inquiry-notes">
                      <span className="detail-label">Admin Notes</span>
                      <p>{inq.admin_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="inquiry-actions">
                    <div className="inquiry-status-change">
                      <span className="detail-label">Update Status</span>
                      <div className="status-buttons">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`btn btn-sm ${inq.status === s ? "btn-primary" : "btn-secondary"}`}
                            disabled={saving || inq.status === s}
                            onClick={() => handleStatusChange(inq.id, s)}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="inquiry-add-note">
                      <span className="detail-label">Add Note</span>
                      <div className="note-input-row">
                        <input
                          type="text"
                          placeholder="Add a note about this inquiry..."
                          value={expandedId === inq.id ? noteText : ""}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="note-input"
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={saving || !noteText.trim()}
                          onClick={() => handleAddNote(inq.id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div className="inquiry-danger-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(inq.id)}
                      >
                        Delete Inquiry
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
