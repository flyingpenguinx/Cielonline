import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function QrDashboardPage({ user }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [status, setStatus] = useState("");
  const [previews, setPreviews] = useState({});

  const loadQrCodes = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("qr_codes")
      .select("*, cards(full_name, slug)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setQrCodes(data ?? []);
    setLoading(false);

    // Generate preview images
    const newPreviews = {};
    for (const qr of data ?? []) {
      if (qr.qr_payload) {
        try {
          newPreviews[qr.id] = await QRCode.toDataURL(qr.qr_payload, {
            width: 200,
            margin: 2,
            color: { dark: "#0f172a" },
          });
        } catch {
          // skip
        }
      }
    }
    setPreviews(newPreviews);
  };

  useEffect(() => {
    loadQrCodes();
  }, []);

  const startEdit = (qr) => {
    setEditingId(qr.id);
    setEditValues({
      target_url: qr.target_url || "",
      wifi_ssid: qr.wifi_ssid || "",
      wifi_password: qr.wifi_password || "",
      wifi_encryption: qr.wifi_encryption || "WPA",
      wifi_hidden: qr.wifi_hidden || false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (qr) => {
    if (!isSupabaseConfigured || !supabase) return;

    let payload = qr.qr_payload;
    if (qr.type === "url") {
      payload = editValues.target_url;
    } else if (qr.type === "wifi") {
      const esc = (s) => s.replace(/[\\;,"':]/g, (c) => `\\${c}`);
      payload = `WIFI:T:${editValues.wifi_encryption};S:${esc(editValues.wifi_ssid)};P:${esc(editValues.wifi_password)};H:${editValues.wifi_hidden ? "true" : "false"};;`;
    }

    const updates = {
      target_url: qr.type === "url" ? editValues.target_url : qr.target_url,
      wifi_ssid: qr.type === "wifi" ? editValues.wifi_ssid : qr.wifi_ssid,
      wifi_password: qr.type === "wifi" ? editValues.wifi_password : qr.wifi_password,
      wifi_encryption: qr.type === "wifi" ? editValues.wifi_encryption : qr.wifi_encryption,
      wifi_hidden: qr.type === "wifi" ? editValues.wifi_hidden : qr.wifi_hidden,
      qr_payload: payload,
    };

    const { error } = await supabase.from("qr_codes").update(updates).eq("id", qr.id);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("QR updated successfully.");
    setEditingId(null);
    loadQrCodes();
  };

  const deleteQr = async (id) => {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.from("qr_codes").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("QR deleted.");
    loadQrCodes();
  };

  const downloadQr = (qr) => {
    const dataUrl = previews[qr.id];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${qr.slug}.png`;
    a.click();
  };

  const typeLabel = (type) => {
    if (type === "card") return "Business Card";
    if (type === "url") return "Website Link";
    if (type === "wifi") return "Wi-Fi";
    return type;
  };

  const typeIcon = (type) => {
    if (type === "card") return "🃏";
    if (type === "url") return "🔗";
    if (type === "wifi") return "📶";
    return "📱";
  };

  if (loading) {
    return (
      <main className="container main-space fade-in">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Loading QR codes...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="container main-space fade-in">
      <div className="admin-section-header">
        <div>
          <h2>QR Dashboard</h2>
          <p className="muted">View, preview, edit and manage all your QR codes.</p>
        </div>
      </div>

      {qrCodes.length === 0 ? (
        <section className="panel">
          <div className="admin-empty">
            <span className="admin-empty-icon">📱</span>
            <h3>No QR codes yet</h3>
            <p className="muted">Head over to the QR Builder to create your first QR code.</p>
          </div>
        </section>
      ) : (
        <div className="qr-dashboard-grid">
          {qrCodes.map((qr) => (
            <article key={qr.id} className="qr-dash-card">
              <div className="qr-dash-card-header">
                <div className="qr-dash-card-left">
                  <span className="qr-dash-type-icon">{typeIcon(qr.type)}</span>
                  <div>
                    <strong>{qr.slug}</strong>
                    <span className="qr-dash-type-badge">{typeLabel(qr.type)}</span>
                  </div>
                </div>
                <div className="qr-dash-card-actions">
                  {previews[qr.id] && (
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => downloadQr(qr)}>
                      ↓ PNG
                    </button>
                  )}
                  {editingId !== qr.id && qr.type !== "card" && (
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => startEdit(qr)}>
                      Edit
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteQr(qr.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="qr-dash-card-body">
                {/* Preview */}
                <div className="qr-dash-preview">
                  {previews[qr.id] ? (
                    <img src={previews[qr.id]} alt={`QR for ${qr.slug}`} className="qr-dash-img" />
                  ) : (
                    <div className="qr-empty-state" style={{ minHeight: 120 }}>
                      <p className="muted">No preview</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="qr-dash-info">
                  {qr.type === "card" && qr.cards && (
                    <p><strong>Card:</strong> {qr.cards.full_name} <span className="muted">(/c/{qr.cards.slug})</span></p>
                  )}
                  {qr.type === "url" && <p><strong>URL:</strong> {qr.target_url}</p>}
                  {qr.type === "wifi" && (
                    <>
                      <p><strong>SSID:</strong> {qr.wifi_ssid}</p>
                      <p><strong>Encryption:</strong> {qr.wifi_encryption}</p>
                      <p><strong>Hidden:</strong> {qr.wifi_hidden ? "Yes" : "No"}</p>
                    </>
                  )}
                  <p className="muted" style={{ fontSize: 12 }}>
                    Created: {new Date(qr.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Edit form */}
              {editingId === qr.id && (
                <div className="qr-dash-edit-form">
                  {qr.type === "url" && (
                    <label className="field">
                      <span>Target URL</span>
                      <input
                        value={editValues.target_url}
                        onChange={(e) => setEditValues((v) => ({ ...v, target_url: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </label>
                  )}
                  {qr.type === "wifi" && (
                    <>
                      <label className="field">
                        <span>Network name (SSID)</span>
                        <input
                          value={editValues.wifi_ssid}
                          onChange={(e) => setEditValues((v) => ({ ...v, wifi_ssid: e.target.value }))}
                        />
                      </label>
                      <label className="field">
                        <span>Password</span>
                        <input
                          type="password"
                          value={editValues.wifi_password}
                          onChange={(e) => setEditValues((v) => ({ ...v, wifi_password: e.target.value }))}
                        />
                      </label>
                      <label className="field">
                        <span>Encryption</span>
                        <select
                          value={editValues.wifi_encryption}
                          onChange={(e) => setEditValues((v) => ({ ...v, wifi_encryption: e.target.value }))}
                        >
                          <option value="WPA">WPA / WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">No Password</option>
                        </select>
                      </label>
                    </>
                  )}
                  <div className="row-gap">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(qr)}>
                      Save changes
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {status && <p className="status-banner" style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
