import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useQrPayload } from "../hooks/useQrPayload";

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

    QRCode.toDataURL(payload, { width: 300, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [payload]);

  const setField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSaveQr(type, values, payload);
  };

  return (
    <section className="panel">
      <h2>Create QR content</h2>
      <div className="qr-builder-grid">
        <div className="qr-controls">
          <div className="tab-row">
            {[
              ["card", "Business Card"],
              ["url", "Website Link"],
              ["wifi", "Wi-Fi"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`tab ${type === value ? "active" : ""}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>QR slug (for tracking/management)</span>
            <input value={values.qrSlug} onChange={(event) => setField("qrSlug", event.target.value)} placeholder="e.g. carlos-main" />
          </label>

          {type === "card" ? (
            <label className="field">
              <span>Select card</span>
              <select value={values.cardSlug} onChange={(event) => setField("cardSlug", event.target.value)}>
                <option value="">Choose one</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.slug}>
                    {card.full_name} ({card.slug})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {type === "url" ? (
            <label className="field">
              <span>Target URL</span>
              <input
                value={values.targetUrl}
                onChange={(event) => setField("targetUrl", event.target.value)}
                placeholder="https://example.com"
              />
            </label>
          ) : null}

          {type === "wifi" ? (
            <div className="form-grid">
              <label className="field">
                <span>SSID</span>
                <input value={values.ssid} onChange={(event) => setField("ssid", event.target.value)} />
              </label>
              <label className="field">
                <span>Password</span>
                <input value={values.password} onChange={(event) => setField("password", event.target.value)} />
              </label>
              <label className="field">
                <span>Encryption</span>
                <select value={values.encryption} onChange={(event) => setField("encryption", event.target.value)}>
                  <option value="WPA">WPA</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No Password</option>
                </select>
              </label>
              <label className="field checkbox">
                <input
                  type="checkbox"
                  checked={values.hidden}
                  onChange={(event) => setField("hidden", event.target.checked)}
                />
                <span>Hidden network</span>
              </label>
            </div>
          ) : null}

          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!payload || !values.qrSlug}>
            Save QR configuration
          </button>
        </div>

        <aside className="qr-output">
          <label className="field">
            <span>Generated QR payload</span>
            <textarea rows={4} readOnly value={payload} />
          </label>

          <div className="qr-preview-box">
            {dataUrl ? <img className="qr-image" src={dataUrl} alt="Generated QR code" /> : <p className="muted">QR preview appears here.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
