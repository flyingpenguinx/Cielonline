import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useQrPayload } from "../hooks/useQrPayload";

const QrTypeIcon = ({ type }) => {
  if (type === "card") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="10" y1="3" x2="10" y2="9"/></svg>;
  if (type === "url") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
};

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function QrBuilder({ cards, onSaveQr }) {
  const [type, setType] = useState("card");
  const [values, setValues] = useState({
    cardSlug: "",
    targetUrl: "",
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
    qrSlug: ""
  });
  const [dataUrl, setDataUrl] = useState("");
  const payload = useQrPayload(type, values);

  useEffect(() => {
    if (!payload) {
      setDataUrl("");
      return;
    }

    QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: "#0f172a" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [payload]);

  const setField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSaveQr(type, values, payload);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${values.qrSlug || type}.png`;
    a.click();
  };

  const qrTypes = [
    { value: "card", label: "Business Card", desc: "Link to your digital card" },
    { value: "url", label: "Website Link", desc: "Any URL you want to share" },
    { value: "wifi", label: "Wi-Fi Access", desc: "Auto-connect to your network" },
  ];

  return (
    <section className="builder-panel qr-builder-panel">
      <div className="qr-header">
        <h2>QR Code Workshop</h2>
        <p className="muted">Create branded QR codes for your cards, links, or Wi-Fi networks.</p>
      </div>

      <div className="qr-builder-grid">
        {/* Left column — controls */}
        <div className="qr-controls">
          {/* Step 1: QR Type */}
          <section className="qr-block">
            <div className="qr-block-title">
              <span className="qr-step-number">1</span>
              Choose QR type
            </div>
            <div className="qr-type-cards">
              {qrTypes.map((qt) => (
                <button
                  key={qt.value}
                  type="button"
                  className={`qr-type-card ${type === qt.value ? "active" : ""}`}
                  onClick={() => setType(qt.value)}
                >
                  <QrTypeIcon type={qt.value} />
                  <div className="qr-type-info">
                    <strong>{qt.label}</strong>
                    <span>{qt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Content */}
          <section className="qr-block">
            <div className="qr-block-title">
              <span className="qr-step-number">2</span>
              Add content
            </div>

            {type === "card" && (
              <label className="field">
                <span>Select card</span>
                <select value={values.cardSlug} onChange={(event) => setField("cardSlug", event.target.value)}>
                  <option value="">Choose a saved card...</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.slug}>
                      {card.full_name} ({card.slug})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {type === "url" && (
              <label className="field">
                <span>Target URL</span>
                <input
                  value={values.targetUrl}
                  onChange={(event) => setField("targetUrl", event.target.value)}
                  placeholder="https://example.com"
                />
              </label>
            )}

            {type === "wifi" && (
              <>
                <div className="form-grid">
                  <label className="field">
                    <span>Network name (SSID)</span>
                    <input value={values.ssid} onChange={(event) => setField("ssid", event.target.value)} placeholder="My WiFi Network" />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input type="password" value={values.password} onChange={(event) => setField("password", event.target.value)} placeholder="••••••••" />
                  </label>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Encryption</span>
                    <select value={values.encryption} onChange={(event) => setField("encryption", event.target.value)}>
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                  </label>
                  <label className="field checkbox-field">
                    <input
                      type="checkbox"
                      checked={values.hidden}
                      onChange={(event) => setField("hidden", event.target.checked)}
                    />
                    <span>Hidden network</span>
                  </label>
                </div>
              </>
            )}
          </section>

          {/* Step 3: Save */}
          <section className="qr-block">
            <div className="qr-block-title">
              <span className="qr-step-number">3</span>
              Name & save
            </div>
            <label className="field">
              <span>QR slug</span>
              <input value={values.qrSlug} onChange={(event) => setField("qrSlug", event.target.value)} placeholder="e.g. my-card-qr" />
            </label>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!payload || !values.qrSlug}>
              Save QR configuration
            </button>
          </section>
        </div>

        {/* Right column — preview */}
        <aside className="qr-output">
          <h3>Live Preview</h3>
          <div className="qr-preview-box">
            {dataUrl ? (
              <>
                <img className="qr-image" src={dataUrl} alt="Generated QR code" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownload}>
                  <DownloadIcon /> Download PNG
                </button>
              </>
            ) : (
              <div className="qr-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" opacity=".3">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
                </svg>
                <p className="muted">Fill in the details to preview your QR code</p>
              </div>
            )}
          </div>

          {payload && (
            <details className="collapse-block">
              <summary>Raw payload</summary>
              <div className="collapse-body">
                <label className="field">
                  <span>Generated QR payload</span>
                  <textarea rows={3} readOnly value={payload} className="payload-textarea" />
                </label>
              </div>
            </details>
          )}
        </aside>
      </div>
    </section>
  );
}
