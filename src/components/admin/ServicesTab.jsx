import { useState, useEffect, useCallback } from "react";
import { fetchServices, createService, updateService, deleteService } from "../../lib/adminApi";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  deposit_amount: "",
  duration_minutes: 60,
  sort_order: 0,
  is_active: true,
  booking_enabled: true,
};

export default function ServicesTab({ siteId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchServices(siteId);
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        site_id: siteId,
        name: form.name,
        description: form.description || null,
        price: form.price ? parseFloat(form.price) : null,
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
        booking_enabled: form.booking_enabled,
      };

      if (editingId) {
        const updated = await updateService(editingId, payload);
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await createService(payload);
        setServices((prev) => [...prev, created]);
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

  const handleEdit = (svc) => {
    setForm({
      name: svc.name || "",
      description: svc.description || "",
      price: svc.price || "",
      deposit_amount: svc.deposit_amount || "",
      duration_minutes: svc.duration_minutes || 60,
      sort_order: svc.sort_order || 0,
      is_active: svc.is_active !== false,
      booking_enabled: svc.booking_enabled !== false,
    });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service?")) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading services...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <section className="panel" style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2>{editingId ? "Edit Service" : "Add Service"}</h2>
        <form className="admin-form" onSubmit={handleSave}>
          <label className="field">
            <span>Service Name *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Full Detail Package"
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's included in this service?"
              rows={3}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Price ($)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Deposit ($)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                placeholder="Optional"
              />
            </label>
            <label className="field">
              <span>Duration (min)</span>
              <input
                type="number"
                min={15}
                max={480}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </label>
          </div>
          <label className="field">
            <span>Sort Order</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Active (visible to customers)</span>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.booking_enabled}
              onChange={(e) => setForm({ ...form, booking_enabled: e.target.checked })}
            />
            <span>Allow online booking for this service</span>
          </label>
          <div className="row-gap">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add Service"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ ...EMPTY_FORM });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="admin-services">
      <div className="admin-section-header">
        <div>
          <h2>Services</h2>
          <p className="muted">Manage the services your business offers</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">🛠️</span>
          <h3>No services yet</h3>
          <p className="muted">Add the services your business offers so customers can request them.</p>
        </div>
      ) : (
        <div className="services-list">
          {services.map((svc) => (
            <div key={svc.id} className={`service-card ${!svc.is_active ? "inactive" : ""}`}>
              <div className="service-card-left">
                <strong>{svc.name}</strong>
                {svc.description && <p className="muted">{svc.description}</p>}
                <div className="service-meta">
                  {svc.price != null && <span className="service-price">${parseFloat(svc.price).toFixed(2)}</span>}
                  {svc.deposit_amount != null && <span className="muted">Deposit ${parseFloat(svc.deposit_amount).toFixed(2)}</span>}
                  {svc.duration_minutes && <span className="muted">{svc.duration_minutes} min</span>}
                  {svc.booking_enabled === false && <span className="service-inactive-badge">Booking Off</span>}
                  {!svc.is_active && <span className="service-inactive-badge">Inactive</span>}
                </div>
              </div>
              <div className="service-card-right">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(svc)}>
                  Edit
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(svc.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
