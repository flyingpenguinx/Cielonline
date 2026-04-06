import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCustomerNotes,
  createCustomerNote,
  deleteCustomerNote,
  fetchAppointments,
  fetchCompletedJobsByCustomer,
  createCompletedJob,
  updateCompletedJob,
  deleteCompletedJob,
  uploadJobImage,
  fetchServices,
  createService,
} from "../../lib/adminApi";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_color: "",
  license_plate: "",
  address: "",
  tags: "",
  source: "website",
};

export default function CustomersTab({ siteId }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Detail view
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerNotes, setCustomerNotes] = useState([]);
  const [customerAppts, setCustomerAppts] = useState([]);
  const [customerJobs, setCustomerJobs] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);

  // Job completion form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", notes: "", amount_charged: "", completed_at: "" });
  const [selectedJobServices, setSelectedJobServices] = useState([]);
  const [otherService, setOtherService] = useState({ name: "", description: "", price: "" });
  const [showOtherService, setShowOtherService] = useState(false);
  const [addToServicesPrompt, setAddToServicesPrompt] = useState(null); // { name, description, price }
  const [jobImages, setJobImages] = useState([]);
  const [jobSaving, setJobSaving] = useState(false);
  const [services, setServices] = useState([]);
  const jobImageRef = useRef(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef(null);

  // ── CSV/Excel file parsing ──
  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\s_]+/g, "_"));
    const FIELD_MAP = {
      first_name: "first_name", first: "first_name", firstname: "first_name",
      last_name: "last_name", last: "last_name", lastname: "last_name",
      email: "email", email_address: "email",
      phone: "phone", phone_number: "phone", telephone: "phone",
      address: "address",
      vehicle_make: "vehicle_make", make: "vehicle_make",
      vehicle_model: "vehicle_model", model: "vehicle_model",
      vehicle_year: "vehicle_year", year: "vehicle_year",
      vehicle_color: "vehicle_color", color: "vehicle_color",
      license_plate: "license_plate", plate: "license_plate", license: "license_plate",
      tags: "tags",
      source: "source",
    };
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const row = { ...EMPTY_FORM };
      headers.forEach((h, i) => {
        const field = FIELD_MAP[h];
        if (field && values[i]) row[field] = values[i];
      });
      return row;
    }).filter((r) => r.first_name && r.last_name);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("");

    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rows = parseCSVText(ev.target.result);
        setImportRows(rows);
        setImportStatus(rows.length > 0 ? `${rows.length} customers found` : "No valid rows found. Ensure columns: first_name, last_name, email, phone");
      };
      reader.readAsText(file);
    } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
      // For Excel we read as CSV-like text from pasted data
      setImportStatus("Excel files: please save as CSV first, then import the CSV file.");
    } else {
      setImportStatus("Supported formats: CSV, TXT (comma-separated). For Excel/Sheets, export as CSV first.");
    }
  };

  const handleImportSubmit = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportStatus("Importing...");
    let success = 0;
    let failed = 0;
    for (const row of importRows) {
      try {
        const payload = {
          site_id: siteId,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email || null,
          phone: row.phone || null,
          vehicle_make: row.vehicle_make || null,
          vehicle_model: row.vehicle_model || null,
          vehicle_year: row.vehicle_year ? parseInt(row.vehicle_year) : null,
          vehicle_color: row.vehicle_color || null,
          license_plate: row.license_plate || null,
          address: row.address || null,
          tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          source: row.source || "import",
        };
        await createCustomer(payload);
        success++;
      } catch {
        failed++;
      }
    }
    setImportStatus(`Imported ${success} customer${success !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}.`);
    setImporting(false);
    setImportRows([]);
    load();
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers(siteId);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setDetailLoading(true);
    setShowJobForm(false);
    try {
      const [notes, allAppts, jobs, srvs] = await Promise.all([
        fetchCustomerNotes(customer.id),
        fetchAppointments(siteId),
        fetchCompletedJobsByCustomer(customer.id),
        fetchServices(siteId),
      ]);
      setCustomerNotes(notes);
      setCustomerAppts(allAppts.filter((a) => a.customer_id === customer.id));
      setCustomerJobs(jobs);
      setServices(srvs);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) return;
    setSaving(true);
    try {
      const payload = {
        site_id: siteId,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        vehicle_make: form.vehicle_make || null,
        vehicle_model: form.vehicle_model || null,
        vehicle_year: form.vehicle_year ? parseInt(form.vehicle_year) : null,
        vehicle_color: form.vehicle_color || null,
        license_plate: form.license_plate || null,
        address: form.address || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        source: form.source || "manual",
      };

      if (editingId) {
        const updated = await updateCustomer(editingId, payload);
        setCustomers((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        if (selectedCustomer?.id === editingId) setSelectedCustomer(updated);
      } else {
        const created = await createCustomer(payload);
        setCustomers((prev) => [created, ...prev]);
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

  const openEditForm = (customer) => {
    setForm({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      vehicle_make: customer.vehicle_make || "",
      vehicle_model: customer.vehicle_model || "",
      vehicle_year: customer.vehicle_year || "",
      vehicle_color: customer.vehicle_color || "",
      license_plate: customer.license_plate || "",
      address: customer.address || "",
      tags: (customer.tags || []).join(", "),
      source: customer.source || "manual",
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer and all related data?")) return;
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;
    try {
      const note = await createCustomerNote({
        customer_id: selectedCustomer.id,
        content: newNote.trim(),
      });
      setCustomerNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteCustomerNote(noteId);
      setCustomerNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Completed Jobs handlers ──
  const toggleJobService = (name) => {
    setSelectedJobServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleAddOtherService = () => {
    if (!otherService.name.trim()) return;
    const name = otherService.name.trim();
    if (!selectedJobServices.includes(name)) {
      setSelectedJobServices((prev) => [...prev, name]);
    }
    // Prompt: "Add to services?"
    setAddToServicesPrompt({ ...otherService });
    setOtherService({ name: "", description: "", price: "" });
    setShowOtherService(false);
  };

  const handleConfirmAddToServices = async (accept) => {
    if (accept && addToServicesPrompt) {
      try {
        const created = await createService({
          site_id: siteId,
          name: addToServicesPrompt.name,
          description: addToServicesPrompt.description || null,
          price: addToServicesPrompt.price ? parseFloat(addToServicesPrompt.price) : null,
          is_active: true,
          booking_enabled: true,
          sort_order: services.length,
        });
        setServices((prev) => [...prev, created]);
      } catch (err) {
        console.error(err);
      }
    }
    setAddToServicesPrompt(null);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !selectedCustomer) return;
    setJobSaving(true);
    try {
      const payload = {
        site_id: siteId,
        customer_id: selectedCustomer.id,
        title: jobForm.title,
        services_performed: selectedJobServices,
        notes: jobForm.notes || null,
        amount_charged: jobForm.amount_charged ? parseFloat(jobForm.amount_charged) : null,
        completed_at: jobForm.completed_at ? new Date(jobForm.completed_at).toISOString() : new Date().toISOString(),
        images: [],
      };
      const created = await createCompletedJob(payload);

      // Upload images if any
      if (jobImages.length > 0) {
        const urls = [];
        for (const file of jobImages) {
          const url = await uploadJobImage(siteId, created.id, file);
          urls.push(url);
        }
        await updateCompletedJob(created.id, { images: urls });
        created.images = urls;
      }

      setCustomerJobs((prev) => [created, ...prev]);
      setShowJobForm(false);
      setJobForm({ title: "", notes: "", amount_charged: "", completed_at: "" });
      setSelectedJobServices([]);
      setJobImages([]);
    } catch (err) {
      console.error(err);
    } finally {
      setJobSaving(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Delete this job record?")) return;
    try {
      await deleteCompletedJob(jobId);
      setCustomerJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleJobImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setJobImages((prev) => [...prev, ...files].slice(0, 6));
  };

  const filtered = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.first_name || "").toLowerCase().includes(term) ||
      (c.last_name || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term) ||
      (c.vehicle_make || "").toLowerCase().includes(term) ||
      (c.vehicle_model || "").toLowerCase().includes(term) ||
      (c.license_plate || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: 200 }}>
        <div className="loading-spinner" />
        <span>Loading customers...</span>
      </div>
    );
  }

  // ── Customer Detail View ──
  if (selectedCustomer && !showForm) {
    return (
      <div className="admin-customer-detail">
        <div className="admin-section-header">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedCustomer(null)}
          >
            ← Back to Customers
          </button>
          <div className="admin-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openEditForm(selectedCustomer)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(selectedCustomer.id)}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="customer-detail-grid">
          {/* Info Panel */}
          <section className="panel">
            <div className="customer-detail-header">
              <div className="customer-avatar-lg">
                {(selectedCustomer.first_name?.[0] || "") + (selectedCustomer.last_name?.[0] || "")}
              </div>
              <div>
                <h2>
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <p className="muted">Customer since {formatDate(selectedCustomer.created_at)}</p>
              </div>
            </div>

            <div className="customer-info-grid">
              {selectedCustomer.email && (
                <div className="customer-info-item">
                  <span className="detail-label">Email</span>
                  <a href={`mailto:${selectedCustomer.email}`}>{selectedCustomer.email}</a>
                </div>
              )}
              {selectedCustomer.phone && (
                <div className="customer-info-item">
                  <span className="detail-label">Phone</span>
                  <a href={`tel:${selectedCustomer.phone}`}>{selectedCustomer.phone}</a>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="customer-info-item">
                  <span className="detail-label">Address</span>
                  <span>{selectedCustomer.address}</span>
                </div>
              )}
              {selectedCustomer.source && (
                <div className="customer-info-item">
                  <span className="detail-label">Source</span>
                  <span className="source-badge">{selectedCustomer.source}</span>
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            {(selectedCustomer.vehicle_make || selectedCustomer.vehicle_model) && (
              <div className="customer-vehicle-section">
                <h4>Vehicle Information</h4>
                <div className="customer-info-grid">
                  {selectedCustomer.vehicle_year && (
                    <div className="customer-info-item">
                      <span className="detail-label">Year</span>
                      <span>{selectedCustomer.vehicle_year}</span>
                    </div>
                  )}
                  {selectedCustomer.vehicle_make && (
                    <div className="customer-info-item">
                      <span className="detail-label">Make</span>
                      <span>{selectedCustomer.vehicle_make}</span>
                    </div>
                  )}
                  {selectedCustomer.vehicle_model && (
                    <div className="customer-info-item">
                      <span className="detail-label">Model</span>
                      <span>{selectedCustomer.vehicle_model}</span>
                    </div>
                  )}
                  {selectedCustomer.vehicle_color && (
                    <div className="customer-info-item">
                      <span className="detail-label">Color</span>
                      <span>{selectedCustomer.vehicle_color}</span>
                    </div>
                  )}
                  {selectedCustomer.license_plate && (
                    <div className="customer-info-item">
                      <span className="detail-label">License Plate</span>
                      <span>{selectedCustomer.license_plate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedCustomer.tags?.length > 0 && (
              <div className="customer-tags">
                {selectedCustomer.tags.map((tag, i) => (
                  <span key={i} className="customer-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Notes + Appointments */}
          <div className="customer-detail-right">
            {/* Notes */}
            <section className="panel">
              <h3>Notes</h3>
              <div className="note-input-row">
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="note-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNote();
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!newNote.trim()}
                  onClick={handleAddNote}
                >
                  Add
                </button>
              </div>

              {detailLoading ? (
                <div className="loading-state" style={{ minHeight: 60 }}>
                  <div className="loading-spinner" />
                </div>
              ) : customerNotes.length === 0 ? (
                <p className="muted">No notes yet.</p>
              ) : (
                <div className="notes-list">
                  {customerNotes.map((note) => (
                    <div key={note.id} className="note-item">
                      <p>{note.content}</p>
                      <div className="note-meta">
                        <span className="muted">{formatDate(note.created_at)}</span>
                        <button
                          type="button"
                          className="note-delete-btn"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Appointment History */}
            <section className="panel">
              <h3>Appointment History</h3>
              {detailLoading ? (
                <div className="loading-state" style={{ minHeight: 60 }}>
                  <div className="loading-spinner" />
                </div>
              ) : customerAppts.length === 0 ? (
                <p className="muted">No appointments yet.</p>
              ) : (
                <div className="customer-appt-list">
                  {customerAppts.map((a) => (
                    <div key={a.id} className="customer-appt-item">
                      <div className="customer-appt-date">{formatDate(a.scheduled_at)}</div>
                      <div className="customer-appt-info">
                        <strong>{a.title}</strong>
                        {a.service_name && <span className="muted"> · {a.service_name}</span>}
                      </div>
                      <span
                        className="status-badge-sm"
                        style={{
                          background: `${
                            { scheduled: "#2563eb", confirmed: "#10b981", completed: "#6b7280", cancelled: "#ef4444" }[a.status] || "#94a3b8"
                          }15`,
                          color:
                            { scheduled: "#2563eb", confirmed: "#10b981", completed: "#6b7280", cancelled: "#ef4444" }[a.status] || "#94a3b8",
                        }}
                      >
                        {(a.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed Jobs / Visit History */}
            <section className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Completed Jobs</h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowJobForm(!showJobForm);
                    setJobForm({ title: "", notes: "", amount_charged: "", completed_at: new Date().toISOString().slice(0, 16) });
                    setSelectedJobServices([]);
                    setJobImages([]);
                    setShowOtherService(false);
                    setAddToServicesPrompt(null);
                  }}
                >
                  {showJobForm ? "Cancel" : "+ Log Job"}
                </button>
              </div>

              {showJobForm && (
                <form className="admin-form" onSubmit={handleSaveJob} style={{ marginBottom: 16, padding: 12, background: "var(--bg-secondary, #f8fafc)", borderRadius: 8 }}>
                  <label className="field">
                    <span>Job Title *</span>
                    <input
                      type="text"
                      required
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      placeholder="e.g., Full Detail + Ceramic Coating"
                    />
                  </label>

                  {/* Multi-service selection */}
                  <div className="field">
                    <span className="detail-label">Services Performed</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      {services.filter((s) => s.is_active).map((s) => (
                        <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={selectedJobServices.includes(s.name)}
                            onChange={() => toggleJobService(s.name)}
                          />
                          <span>{s.name}</span>
                          {s.price && <span className="muted" style={{ fontSize: 12 }}>(${s.price})</span>}
                        </label>
                      ))}
                    </div>

                    {/* Other service toggle */}
                    {!showOtherService ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 8 }}
                        onClick={() => setShowOtherService(true)}
                      >
                        + Other Service
                      </button>
                    ) : (
                      <div style={{ marginTop: 8, padding: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 13 }}>Add a custom service</p>
                        <div className="form-grid">
                          <label className="field">
                            <span>Service Name *</span>
                            <input
                              type="text"
                              value={otherService.name}
                              onChange={(e) => setOtherService({ ...otherService, name: e.target.value })}
                              placeholder="e.g., Banner Installation"
                            />
                          </label>
                          <label className="field">
                            <span>Price</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={otherService.price}
                              onChange={(e) => setOtherService({ ...otherService, price: e.target.value })}
                              placeholder="0.00"
                            />
                          </label>
                        </div>
                        <label className="field">
                          <span>Description</span>
                          <input
                            type="text"
                            value={otherService.description}
                            onChange={(e) => setOtherService({ ...otherService, description: e.target.value })}
                            placeholder="Brief description of the service"
                          />
                        </label>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={!otherService.name.trim()}
                            onClick={handleAddOtherService}
                          >
                            Add to Job
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setShowOtherService(false); setOtherService({ name: "", description: "", price: "" }); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* "Add to services?" prompt */}
                    {addToServicesPrompt && (
                      <div style={{ marginTop: 8, padding: 10, background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 6 }}>
                        <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 13 }}>
                          Add "{addToServicesPrompt.name}" to your service list?
                        </p>
                        <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
                          This will save it as a service you offer so it appears on your website and is available for future jobs.
                          {addToServicesPrompt.description && <><br/>{addToServicesPrompt.description}</>}
                          {addToServicesPrompt.price && <><br/>Price: ${addToServicesPrompt.price}</>}
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleConfirmAddToServices(true)}>
                            Yes, Add to Services
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleConfirmAddToServices(false)}>
                            No, Just This Job
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show selected services summary */}
                    {selectedJobServices.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {selectedJobServices.map((name, i) => (
                          <span key={i} className="customer-tag" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {name}
                            <button
                              type="button"
                              onClick={() => toggleJobService(name)}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "inherit", padding: 0, lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Completed Date</span>
                      <input
                        type="datetime-local"
                        value={jobForm.completed_at}
                        onChange={(e) => setJobForm({ ...jobForm, completed_at: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>Total Amount Charged</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={jobForm.amount_charged}
                        onChange={(e) => setJobForm({ ...jobForm, amount_charged: e.target.value })}
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Notes</span>
                    <textarea
                      rows={2}
                      value={jobForm.notes}
                      onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                      placeholder="Any notes about the completed work..."
                    />
                  </label>
                  <div className="field">
                    <span className="detail-label">Photos (optional, up to 6)</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      {jobImages.map((f, i) => (
                        <div key={i} style={{ position: "relative", width: 60, height: 60, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                          <img src={URL.createObjectURL(f)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => setJobImages((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: "2px 4px" }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {jobImages.length < 6 && (
                        <button
                          type="button"
                          onClick={() => jobImageRef.current?.click()}
                          style={{ width: 60, height: 60, borderRadius: 6, border: "2px dashed #cbd5e1", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}
                        >
                          +
                        </button>
                      )}
                    </div>
                    <input
                      ref={jobImageRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleJobImageSelect}
                      style={{ display: "none" }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={jobSaving}>
                    {jobSaving ? "Saving..." : "Save Job Record"}
                  </button>
                </form>
              )}

              {detailLoading ? (
                <div className="loading-state" style={{ minHeight: 60 }}>
                  <div className="loading-spinner" />
                </div>
              ) : customerJobs.length === 0 ? (
                <p className="muted">No completed jobs yet. Use "Log Job" to record finished work.</p>
              ) : (
                <div className="customer-appt-list">
                  <p className="muted" style={{ marginBottom: 8 }}>{customerJobs.length} visit{customerJobs.length !== 1 ? "s" : ""} total</p>
                  {customerJobs.map((j) => (
                    <div key={j.id} className="customer-appt-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <div>
                          <div className="customer-appt-date">{formatDate(j.completed_at)}</div>
                          <div className="customer-appt-info">
                            <strong>{j.title}</strong>
                            {j.services_performed?.length > 0 && <span className="muted"> · {j.services_performed.join(", ")}</span>}
                            {j.amount_charged && <span className="muted"> · ${Number(j.amount_charged).toFixed(2)}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="note-delete-btn"
                          onClick={() => handleDeleteJob(j.id)}
                        >
                          ×
                        </button>
                      </div>
                      {j.notes && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{j.notes}</p>}
                      {j.images?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          {j.images.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ──
  if (showForm) {
    return (
      <div className="admin-customer-form">
        <section className="panel" style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2>{editingId ? "Edit Customer" : "Add New Customer"}</h2>
          <form className="admin-form" onSubmit={handleSave}>
            <div className="form-grid">
              <label className="field">
                <span>First Name *</span>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Last Name *</span>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </div>

            <fieldset className="fieldset">
              <legend>Vehicle Information</legend>
              <div className="form-grid">
                <label className="field">
                  <span>Year</span>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={form.vehicle_year}
                    onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Make</span>
                  <input
                    type="text"
                    value={form.vehicle_make}
                    onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })}
                    placeholder="e.g., Toyota"
                  />
                </label>
                <label className="field">
                  <span>Model</span>
                  <input
                    type="text"
                    value={form.vehicle_model}
                    onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
                    placeholder="e.g., Camry"
                  />
                </label>
                <label className="field">
                  <span>Color</span>
                  <input
                    type="text"
                    value={form.vehicle_color}
                    onChange={(e) => setForm({ ...form, vehicle_color: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>License Plate</span>
                  <input
                    type="text"
                    value={form.license_plate}
                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>

            <label className="field">
              <span>Address</span>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Tags (comma-separated)</span>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="vip, recurring, fleet"
              />
            </label>

            <label className="field">
              <span>Source</span>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="walk_in">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="social_media">Social Media</option>
                <option value="manual">Manual Entry</option>
              </select>
            </label>

            <div className="row-gap">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Customer" : "Add Customer"}
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
      </div>
    );
  }

  // ── Customer List View ──
  return (
    <div className="admin-customers">
      <div className="admin-section-header">
        <div>
          <h2>Customers (CRM)</h2>
          <p className="muted">{customers.length} total customers</p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowImport(!showImport)}
          >
            📥 Import
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setForm({ ...EMPTY_FORM });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Bulk Import Panel */}
      {showImport && (
        <section className="panel import-panel">
          <h3>📥 Bulk Import Customers</h3>
          <p className="muted">Upload a CSV file with columns: first_name, last_name, email, phone, address, vehicle_make, vehicle_model, vehicle_year, vehicle_color, license_plate, tags, source.</p>
          <p className="muted" style={{ marginTop: 4 }}>For Excel or Google Sheets, export as CSV first (File → Download → CSV).</p>
          <div className="import-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => importFileRef.current?.click()}
            >
              Choose CSV File
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={handleImportFile}
              style={{ display: "none" }}
            />
            {importRows.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleImportSubmit}
                disabled={importing}
              >
                {importing ? "Importing..." : `Import ${importRows.length} Customers`}
              </button>
            )}
          </div>
          {importStatus && <p className="import-status">{importStatus}</p>}
          {importRows.length > 0 && (
            <div className="import-preview">
              <strong>Preview (first 5 rows):</strong>
              <div className="import-preview-list">
                {importRows.slice(0, 5).map((r, i) => (
                  <div key={i} className="import-preview-row">
                    <span>{r.first_name} {r.last_name}</span>
                    <span className="muted">{r.email || "—"}</span>
                    <span className="muted">{r.phone || "—"}</span>
                  </div>
                ))}
                {importRows.length > 5 && <p className="muted">...and {importRows.length - 5} more</p>}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="customer-search">
        <input
          type="text"
          placeholder="Search customers by name, email, phone, vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon">👥</span>
          <h3>{searchTerm ? "No matching customers" : "No customers yet"}</h3>
          <p className="muted">
            {searchTerm
              ? "Try a different search term."
              : "Add customers manually or they will be created automatically when inquiries come in."}
          </p>
        </div>
      ) : (
        <div className="customer-list">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="customer-card"
              onClick={() => loadCustomerDetail(c)}
            >
              <div className="customer-card-left">
                <div className="customer-avatar">
                  {(c.first_name?.[0] || "") + (c.last_name?.[0] || "")}
                </div>
                <div className="customer-card-info">
                  <strong>
                    {c.first_name} {c.last_name}
                  </strong>
                  <span className="muted">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}
                  </span>
                  {(c.vehicle_make || c.vehicle_model) && (
                    <span className="muted customer-vehicle-line">
                      🚗 {[c.vehicle_year, c.vehicle_make, c.vehicle_model, c.vehicle_color]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="customer-card-right">
                {c.tags?.length > 0 && (
                  <div className="customer-card-tags">
                    {c.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="customer-tag-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="customer-card-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
