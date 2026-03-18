import { useState, useRef, useCallback } from "react";
import { useSiteEditor } from "../../hooks/useSiteEditor";
import SiteEditorCanvas from "../SiteEditorCanvas";
import BlockPropertiesPanel from "../BlockPropertiesPanel";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const VIEWPORTS = [
  { key: "desktop", label: "Desktop", icon: "🖥️", width: "100%", maxWidth: "none" },
  { key: "tablet",  label: "Tablet",  icon: "📱", width: "768px", maxWidth: "768px" },
  { key: "mobile",  label: "Mobile",  icon: "📲", width: "375px", maxWidth: "375px" },
];

/* ── Integration Code Panel ── */
function IntegrationPanel({ siteId, site }) {
  const [copied, setCopied] = useState(null);

  const bridgeSnippet = `<script
  src="https://cielonline.com/bridge.js"
  data-supabase-url="${SUPABASE_URL}"
  data-supabase-key="${SUPABASE_KEY}"
  data-site-id="${siteId}"
><\/script>`;

  const formExample = `<form data-ciel="contact" data-success="Thanks! We'll be in touch soon.">
  <input name="name" placeholder="Your Name" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="phone" placeholder="Phone" />
  <select name="service" data-ciel="service-picker" data-placeholder="Select a service..."></select>
  <input name="vehicle" placeholder="Vehicle (e.g. 2024 Tesla Model 3)" />
  <input name="preferred_date" type="date" />
  <textarea name="message" placeholder="Your message..."></textarea>
  <button type="submit">Send</button>
</form>`;

  const servicesExample = `<!-- Services auto-load from your Cielonline admin -->
<div data-ciel="services" data-show-price="true" data-show-duration="true"></div>`;

  const jsApiExample = `// Manual JavaScript API (also available)
// Submit an inquiry
window.Cielonline.submitInquiry({
  name: "John Doe",
  email: "john@example.com",
  phone: "555-1234",
  service: "Full Detail Package",
  vehicle: "2024 BMW M3 Black",
  message: "I'd like to schedule a detail"
});

// Fetch services
const services = await window.Cielonline.getServices();`;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="integration-panel">
      <div className="integration-intro">
        <h3>🔗 Connect {site.site_name} to Cielonline</h3>
        <p className="muted">
          Add these code snippets to your external website 
          {site.site_url && <> (<strong>{site.site_url}</strong>)</>} to connect 
          it to Cielonline. Contact form submissions will appear in your Inquiries tab,
          and services/prices will sync automatically.
        </p>
      </div>

      <div className="integration-steps">
        {/* Step 1 */}
        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">1</span>
            <div>
              <strong>Add the Bridge Script</strong>
              <p className="muted">Paste this before the closing <code>&lt;/body&gt;</code> tag on your website. This is the one line that connects everything.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{bridgeSnippet}</pre>
            <button
              className="integration-copy-btn"
              onClick={() => handleCopy(bridgeSnippet, "bridge")}
            >
              {copied === "bridge" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">2</span>
            <div>
              <strong>Tag Your Contact Form</strong>
              <p className="muted">Add <code>data-ciel="contact"</code> to your contact form. The bridge auto-intercepts submissions and sends them to your Inquiries tab. Name your inputs like below:</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{formExample}</pre>
            <button
              className="integration-copy-btn"
              onClick={() => handleCopy(formExample, "form")}
            >
              {copied === "form" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">3</span>
            <div>
              <strong>Auto-Load Services (Optional)</strong>
              <p className="muted">Add this anywhere you want to display your services. Prices and details sync automatically when you edit them in the Services tab.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{servicesExample}</pre>
            <button
              className="integration-copy-btn"
              onClick={() => handleCopy(servicesExample, "services")}
            >
              {copied === "services" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Step 4 */}
        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">4</span>
            <div>
              <strong>JavaScript API (Optional)</strong>
              <p className="muted">For custom integrations, use the global <code>window.Cielonline</code> API.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{jsApiExample}</pre>
            <button
              className="integration-copy-btn"
              onClick={() => handleCopy(jsApiExample, "api")}
            >
              {copied === "api" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="integration-flow-diagram">
        <h4>How It Works</h4>
        <div className="integration-flow">
          <div className="flow-node">
            <span className="flow-icon">🌐</span>
            <span>{site.site_name}</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-node">
            <span className="flow-icon">📡</span>
            <span>bridge.js</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-node">
            <span className="flow-icon">🗄️</span>
            <span>Supabase</span>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-node flow-node-highlight">
            <span className="flow-icon">⚡</span>
            <span>Cielonline Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteTab({ siteId, site, user }) {
  const [mode, setMode] = useState("live"); // "live" | "editor" | "integrate"
  const [viewport, setViewport] = useState("desktop");
  const [zoom, setZoom] = useState(100);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  const editor = useSiteEditor(user, siteId);
  const {
    blocks,
    selectedBlockId,
    selectedBlock,
    saving,
    status,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    saveBlocks,
    setSelectedBlockId,
  } = editor;

  const currentViewport = VIEWPORTS.find((v) => v.key === viewport) || VIEWPORTS[0];
  const siteUrl = site.site_url || "";
  const cielonlinePreviewUrl = site.slug ? `/s/${site.slug}` : "";

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    const url = mode === "live" ? siteUrl : cielonlinePreviewUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, [mode, siteUrl, cielonlinePreviewUrl]);

  return (
    <div className="admin-website-tab">
      {/* ── Canvas Toolbar ── */}
      <div className="canvas-toolbar">
        {/* Left: Mode toggle */}
        <div className="canvas-toolbar-left">
          <div className="canvas-mode-toggle">
            <button
              type="button"
              className={`canvas-mode-btn ${mode === "live" ? "active" : ""}`}
              onClick={() => setMode("live")}
            >
              🌐 Live Site
            </button>
            <button
              type="button"
              className={`canvas-mode-btn ${mode === "editor" ? "active" : ""}`}
              onClick={() => setMode("editor")}
            >
              ✏️ Page Editor
            </button>
            <button
              type="button"
              className={`canvas-mode-btn ${mode === "integrate" ? "active" : ""}`}
              onClick={() => setMode("integrate")}
            >
              🔗 Integrate
            </button>
          </div>
          {mode === "live" && siteUrl && (
            <span className="canvas-url-badge">{siteUrl}</span>
          )}
          {mode === "editor" && cielonlinePreviewUrl && (
            <span className="canvas-url-badge">cielonline.com{cielonlinePreviewUrl}</span>
          )}
        </div>

        {/* Center: Viewport controls (hidden in integrate mode) */}
        {mode !== "integrate" && <div className="canvas-toolbar-center">
          {VIEWPORTS.map((vp) => (
            <button
              key={vp.key}
              type="button"
              className={`canvas-viewport-btn ${viewport === vp.key ? "active" : ""}`}
              onClick={() => setViewport(vp.key)}
              title={vp.label}
            >
              {vp.icon}
            </button>
          ))}
          <span className="canvas-divider" />
          <div className="canvas-zoom">
            <button
              type="button"
              className="canvas-zoom-btn"
              onClick={() => setZoom((z) => Math.max(25, z - 10))}
              title="Zoom out"
            >
              −
            </button>
            <span className="canvas-zoom-label">{zoom}%</span>
            <button
              type="button"
              className="canvas-zoom-btn"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>}

        {/* Right: Actions */}
        <div className="canvas-toolbar-right">
          {mode === "live" && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRefresh}>
              🔄 Refresh
            </button>
          )}
          {mode === "editor" && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={saveBlocks}
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save"}
            </button>
          )}
          {mode !== "integrate" && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenExternal}
              disabled={mode === "live" ? !siteUrl : !cielonlinePreviewUrl}
            >
              ↗ Open
            </button>
          )}
        </div>
      </div>

      {status && <p className="status-banner">{status}</p>}

      {/* ── Canvas Area ── */}
      <div className={`canvas-stage ${mode === "integrate" ? "canvas-stage-flat" : ""}`}>
        {mode === "integrate" && (
          <IntegrationPanel siteId={siteId} site={site} />
        )}

        {mode === "live" && (
          <div className="canvas-frame-wrapper">
            <div
              className={`canvas-device-frame canvas-device-${viewport}`}
              style={{
                width: currentViewport.width,
                maxWidth: currentViewport.maxWidth,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {siteUrl ? (
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={siteUrl}
                  className="canvas-iframe"
                  title={`${site.site_name} — Live Preview`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              ) : (
                <div className="canvas-no-url">
                  <span className="canvas-no-url-icon">🌐</span>
                  <h3>No website URL configured</h3>
                  <p className="muted">
                    Add a website URL to <strong>{site.site_name}</strong> to preview it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "editor" && (
          <div className="canvas-editor-layout">
            <div
              className={`canvas-editor-main canvas-device-${viewport}`}
              style={{
                width: currentViewport.width,
                maxWidth: currentViewport.maxWidth === "none" ? "100%" : currentViewport.maxWidth,
                transform: viewport !== "desktop" ? `scale(${zoom / 100})` : undefined,
                transformOrigin: viewport !== "desktop" ? "top center" : undefined,
              }}
            >
              <SiteEditorCanvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onMoveBlock={moveBlock}
                onAddBlock={addBlock}
              />
            </div>
            <div className="canvas-editor-sidebar">
              <BlockPropertiesPanel
                block={selectedBlock}
                onChange={updateBlock}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
