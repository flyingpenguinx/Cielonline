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
    <section className="builder-panel qr-builder-panel">
      <h2>Create QR content</h2>
      <p className="muted">Choose a QR type, add only the required fields, then save the configuration.</p>
      <div className="qr-builder-grid">
        <div className="qr-controls">
          <section className="qr-block">
            <p className="qr-block-title">1) QR type</p>
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
          </section>

          <section className="qr-block">
            <p className="qr-block-title">2) Content</p>

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
              <>
                <div className="form-grid">
                  <label className="field">
                    <span>SSID</span>
                    <input value={values.ssid} onChange={(event) => setField("ssid", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input value={values.password} onChange={(event) => setField("password", event.target.value)} />
                  </label>
                </div>

                <details className="collapse-block">
                  <summary>Advanced Wi-Fi options</summary>
                  <div className="collapse-body form-grid">
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
                </details>
              </>
            ) : null}
          </section>

          <section className="qr-block">
            <p className="qr-block-title">3) Save</p>
            <label className="field">
              <span>QR slug (for tracking/management)</span>
              <input value={values.qrSlug} onChange={(event) => setField("qrSlug", event.target.value)} placeholder="e.g. carlos-main" />
            </label>

            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!payload || !values.qrSlug}>
              Save QR configuration
            </button>
          </section>
        </div>

        <aside className="qr-output">
          <h3>Live QR Preview</h3>
          <div className="qr-preview-box">
            {dataUrl ? <img className="qr-image" src={dataUrl} alt="Generated QR code" /> : <p className="muted">QR preview appears here.</p>}
          </div>

          <details className="collapse-block">
            <summary>Show raw payload</summary>
            <div className="collapse-body">
              <label className="field">
                <span>Generated QR payload</span>
                <textarea rows={4} readOnly value={payload} />
              </label>
            </div>
          </details>
        </aside>
      </div>
    </section>
  );
}
