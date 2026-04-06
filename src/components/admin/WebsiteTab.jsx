import { useEffect, useState, useRef, useCallback } from "react";
import { useSiteEditor } from "../../hooks/useSiteEditor";
import SiteEditorCanvas from "../SiteEditorCanvas";
import BlockPropertiesPanel from "../BlockPropertiesPanel";
import SiteTemplateLibrary from "../SiteTemplateLibrary";
import ImageUploadField from "../ImageUploadField";
import {
  DEFAULT_SITE_CONTENT_FIELDS,
  fetchSiteContentEntries,
  getDefaultSiteContentEntries,
  upsertSiteContentEntries,
  uploadSiteImage,
  updateSiteSubscription,
} from "../../lib/sitePlatformApi";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const VIEWPORTS = [
  { key: "desktop", label: "Desktop", icon: "🖥️", width: "100%", maxWidth: "none" },
  { key: "tablet", label: "Tablet", icon: "📱", width: "768px", maxWidth: "768px" },
  { key: "mobile", label: "Mobile", icon: "📲", width: "375px", maxWidth: "375px" },
];

const CANVAS_PAGE_ORDER = ["Home", "Services", "Business", "Footer"];

function buildCanvasSections(entries) {
  const grouped = new Map();

  DEFAULT_SITE_CONTENT_FIELDS.forEach((field) => {
    const sectionKey = `${field.page || field.section}::${field.group || field.section}`;

    if (!grouped.has(sectionKey)) {
      grouped.set(sectionKey, {
        key: sectionKey,
        page: field.page || field.section,
        title: field.group || field.section,
        description: field.helpText || "",
        fields: [],
      });
    }

    const currentEntry = entries.find((entry) => entry.content_key === field.key);
    grouped.get(sectionKey).fields.push({
      ...field,
      value: currentEntry?.value_text ?? "",
    });
  });

  return [...grouped.values()].sort((left, right) => {
    const pageDelta = CANVAS_PAGE_ORDER.indexOf(left.page) - CANVAS_PAGE_ORDER.indexOf(right.page);
    if (pageDelta !== 0) return pageDelta;
    return left.title.localeCompare(right.title);
  });
}

function VisualCanvasPanel({ site, siteId, viewport, zoom, iframeKey, iframeRef, onRefresh }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [selectedSectionKey, setSelectedSectionKey] = useState(null);
  const frameWrapperRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await fetchSiteContentEntries(siteId);
      if (loaded.length === 0) {
        setEntries(getDefaultSiteContentEntries(siteId));
      } else {
        const byKey = new Map(loaded.map((entry) => [entry.content_key, entry]));
        setEntries(
          DEFAULT_SITE_CONTENT_FIELDS.map((field, index) => ({
            site_id: siteId,
            content_key: field.key,
            label: field.label,
            field_type: field.type,
            section_name: field.section,
            page_path: field.key.startsWith("services.") ? "/services" : "/",
            sort_order: index,
            value_text: byKey.get(field.key)?.value_text ?? "",
            value_json: byKey.get(field.key)?.value_json ?? null,
            is_public: true,
          }))
        );
      }
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Unable to load visual canvas fields.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Measure the preview panel width for responsive iframe scaling
  useEffect(() => {
    const el = frameWrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((observed) => {
      for (const entry of observed) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sections = buildCanvasSections(entries).filter((section) => (
    pageFilter === "all" ? true : section.page === pageFilter
  ));

  useEffect(() => {
    if (sections.length === 0) {
      setSelectedSectionKey(null);
      return;
    }
    if (!selectedSectionKey || !sections.some((section) => section.key === selectedSectionKey)) {
      setSelectedSectionKey(sections[0].key);
    }
  }, [sections, selectedSectionKey]);

  const selectedSection = sections.find((section) => section.key === selectedSectionKey) ?? sections[0] ?? null;
  const currentViewport = VIEWPORTS.find((item) => item.key === viewport) || VIEWPORTS[0];
  const siteUrl = site.site_url || "";

  const updateEntryValue = (contentKey, valueText) => {
    setEntries((prev) => prev.map((entry) => (
      entry.content_key === contentKey ? { ...entry, value_text: valueText } : entry
    )));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await upsertSiteContentEntries(siteId, entries);
      setEntries(saved.length > 0 ? saved : entries);
      setStatus("Visual canvas changes saved.");
      onRefresh();
    } catch (error) {
      console.error(error);
      setStatus("Unable to save visual canvas changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="canvas-visual-layout">
      <aside className="canvas-layer-sidebar">
        <div className="canvas-sidebar-header">
          <div>
            <h3>Visual Layers</h3>
            <p className="muted">Edit sections of the live site without touching code.</p>
          </div>
          <div className="canvas-page-filter">
            {["all", ...CANVAS_PAGE_ORDER].map((page) => (
              <button
                key={page}
                type="button"
                className={`canvas-page-chip ${pageFilter === page ? "active" : ""}`}
                onClick={() => setPageFilter(page)}
              >
                {page === "all" ? "All" : page}
              </button>
            ))}
          </div>
        </div>

        <div className="canvas-layer-list">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`canvas-layer-card ${selectedSectionKey === section.key ? "active" : ""}`}
              onClick={() => setSelectedSectionKey(section.key)}
            >
              <span className="canvas-layer-page">{section.page}</span>
              <strong>{section.title}</strong>
              <span className="canvas-layer-meta">{section.fields.length} editable fields</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="canvas-preview-panel">
        <div className="canvas-preview-header">
          <div>
            <h3>{site.site_name} live canvas</h3>
            <p className="muted">
              This preview stays inside Cielonline. If the embed is blocked, move the site to Vercel so iframe headers stay under your control.
            </p>
          </div>
          <div className="canvas-preview-badges">
            <span className="canvas-preview-badge">{currentViewport.label}</span>
            <span className="canvas-preview-badge">{zoom}% zoom</span>
          </div>
        </div>

        <div className="canvas-frame-wrapper canvas-frame-wrapper-tight" ref={frameWrapperRef}>
          {(() => {
            const DESKTOP_WIDTH = 1440;
            const DESKTOP_HEIGHT = 1200;
            const padding = 32;
            const availableWidth = Math.max(containerWidth - padding, 300);
            const baseScale = Math.min(1, availableWidth / DESKTOP_WIDTH);
            const desktopScale = baseScale * (zoom / 100);

            if (viewport === "desktop") {
              return (
                <div
                  className="canvas-desktop-scaler"
                  style={{
                    width: `${DESKTOP_WIDTH * desktopScale}px`,
                    height: `${DESKTOP_HEIGHT * desktopScale}px`,
                    overflow: "hidden",
                    position: "relative",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="canvas-device-frame canvas-device-desktop"
                    style={{
                      width: `${DESKTOP_WIDTH}px`,
                      height: `${DESKTOP_HEIGHT}px`,
                      transform: `scale(${desktopScale})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      borderRadius: 0,
                      boxShadow: "none",
                    }}
                  >
                    {siteUrl ? (
                      <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={siteUrl}
                        className="canvas-iframe"
                        title={`${site.site_name} — Visual Canvas Preview`}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    ) : (
                      <div className="canvas-no-url">
                        <span className="canvas-no-url-icon">🌐</span>
                        <h3>No website URL configured</h3>
                        <p className="muted">Add a public site URL to preview this client website in the canvas.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
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
                    title={`${site.site_name} — Visual Canvas Preview`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div className="canvas-no-url">
                    <span className="canvas-no-url-icon">🌐</span>
                    <h3>No website URL configured</h3>
                    <p className="muted">Add a public site URL to preview this client website in the canvas.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      <aside className="canvas-inspector-panel">
        <div className="canvas-sidebar-header">
          <div>
            <h3>{selectedSection?.title || "Inspector"}</h3>
            <p className="muted">
              {selectedSection?.description || "Choose a section on the left to edit it here."}
            </p>
          </div>
          <div className="canvas-inspector-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadEntries}>
              ↻ Reload
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {status && <p className="status-banner">{status}</p>}

        {loading ? (
          <div className="loading-state" style={{ minHeight: 200 }}>
            <div className="loading-spinner" />
            <span>Loading visual canvas fields...</span>
          </div>
        ) : selectedSection ? (
          <div className="canvas-inspector-fields">
            {selectedSection.fields.map((field) => {
              const value = entries.find((entry) => entry.content_key === field.key)?.value_text ?? "";
              return (
                <label key={field.key} className="field canvas-field-card">
                  <span>{field.layerName || field.label}</span>
                  <small className="muted">{field.helpText || field.label}</small>
                  {field.type === "image" ? (
                    <ImageUploadField
                      value={value}
                      onChange={(url) => updateEntryValue(field.key, url)}
                      label=""
                      placeholder={field.placeholder}
                      compact
                      bucket="site-images"
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(event) => updateEntryValue(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type === "url" ? "url" : "text"}
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(event) => updateEntryValue(field.key, event.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="canvas-empty">
            <p className="canvas-empty-icon">🧩</p>
            <h3>No section selected</h3>
            <p className="muted">Pick a section in the layer list to edit its content here.</p>
          </div>
        )}

        <div className="canvas-hosting-note">
          <strong>Hosting note</strong>
          <p className="muted">
            GitHub Pages is fine for a static launch, but Vercel is the better long-term host for embedded previews, preview deployments, and onboarding more client websites.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ManagedContentPanel({ siteId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await fetchSiteContentEntries(siteId);
      if (loaded.length === 0) {
        setEntries(getDefaultSiteContentEntries(siteId));
      } else {
        const byKey = new Map(loaded.map((entry) => [entry.content_key, entry]));
        setEntries(
          DEFAULT_SITE_CONTENT_FIELDS.map((field, index) => ({
            site_id: siteId,
            content_key: field.key,
            label: field.label,
            field_type: field.type,
            section_name: field.section,
            page_path: field.key.startsWith("services.") ? "/services" : "/",
            sort_order: index,
            value_text: byKey.get(field.key)?.value_text ?? "",
            value_json: byKey.get(field.key)?.value_json ?? null,
            is_public: true,
          }))
        );
      }
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Unable to load managed content fields.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const updateEntryValue = (contentKey, valueText) => {
    setEntries((prev) => prev.map((entry) => (
      entry.content_key === contentKey ? { ...entry, value_text: valueText } : entry
    )));
  };

  const groupedEntries = DEFAULT_SITE_CONTENT_FIELDS.reduce((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {});

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await upsertSiteContentEntries(siteId, entries);
      setEntries(saved.length > 0 ? saved : entries);
      setStatus("Managed content saved.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to save managed content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel integration-content-panel">
      <div className="admin-section-header">
        <div>
          <h3>Managed Website Content</h3>
          <p className="muted">
            These fields map to the existing Vivid layout. Updating them changes content without changing the site design.
          </p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadEntries}>
            ↻ Refresh
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Content"}
          </button>
        </div>
      </div>

      {status && <p className="muted integration-status-text">{status}</p>}

      {loading ? (
        <div className="loading-state" style={{ minHeight: 160 }}>
          <div className="loading-spinner" />
          <span>Loading content fields...</span>
        </div>
      ) : (
        <div className="integration-content-grid">
          {Object.entries(groupedEntries).map(([sectionName, fields]) => (
            <div key={sectionName} className="integration-content-section">
              <h4>{sectionName}</h4>
              <div className="integration-content-fields">
                {fields.map((field) => {
                  const current = entries.find((entry) => entry.content_key === field.key);
                  const value = current?.value_text ?? "";
                  return (
                    <label key={field.key} className="field">
                      <span>{field.label}</span>
                      {field.type === "image" ? (
                        <ImageUploadField
                          value={value}
                          onChange={(url) => updateEntryValue(field.key, url)}
                          label=""
                          placeholder={field.placeholder}
                          compact
                          bucket="site-images"
                        />
                      ) : field.type === "textarea" ? (
                        <textarea
                          rows={4}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) => updateEntryValue(field.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type === "url" ? "url" : "text"}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(e) => updateEntryValue(field.key, e.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IntegrationPanel({ site }) {
  const [copied, setCopied] = useState(null);
  const bookingUrl = site.slug ? `https://cielonline.com/book/${site.slug}` : "https://cielonline.com/book/YOUR_SITE_SLUG";

  const bridgeSnippet = `<script
  src="https://cielonline.com/bridge.js"
  data-supabase-url="${SUPABASE_URL}"
  data-supabase-key="${SUPABASE_KEY}"
  data-site-slug="${site.slug || "your-site-slug"}"
  data-realtime="true"
><\/script>`;

  const formExample = `<form data-ciel="contact" data-success="Thanks! We'll be in touch soon.">
  <input name="firstName" placeholder="First name" required />
  <input name="lastName" placeholder="Last name" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="phone" placeholder="Phone" />
  <div data-ciel="service-checkboxes"></div>
  <input name="vehicle" placeholder="Vehicle (e.g. 2024 Tesla Model 3)" />
  <input name="preferred_date" type="date" />
  <textarea name="message" placeholder="Your message..."></textarea>
  <button type="submit">Send</button>
</form>`;

  const servicesExample = `<!-- Services auto-load from your Cielonline admin -->
<div data-ciel="services" data-show-price="true" data-show-duration="true"></div>`;

  const contentExample = `<!-- Text fields -->
<h1 data-ciel-field="home.hero.title_line_1">Your ride.</h1>
<p data-ciel-field="home.hero.description">Premium detailing copy lives here.</p>

<!-- Image fields -->
<img data-ciel-img="home.hero.background_image" src="fallback.jpg" alt="Hero">
<img data-ciel-img="home.about.image" src="fallback.jpg" alt="About us">

<!-- Background image -->
<div data-ciel-bg="home.hero.background_image" style="background-image:url(fallback.jpg)">

<!-- Gallery images -->
<img data-ciel-img="home.gallery.image_1" src="fallback.jpg" alt="Gallery 1">
<img data-ciel-img="home.gallery.image_2" src="fallback.jpg" alt="Gallery 2">

<!-- Testimonials -->
<blockquote data-ciel-field="home.testimonial_1.text">"Great service!"</blockquote>
<cite data-ciel-field="home.testimonial_1.author">John D.</cite>

<!-- Footer -->
<p data-ciel-field="footer.tagline">Premium auto detailing.</p>
<img data-ciel-img="footer.logo_image" src="logo.png" alt="Logo">

<!-- Links -->
<a href="${bookingUrl}" data-ciel-link="booking">Book Now</a>`;

  const bookingExample = `<a href="${bookingUrl}" data-ciel-link="booking">Book Now</a>`;

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
          {site.site_url && <> (<strong>{site.site_url}</strong>)</>} to connect it to Cielonline. Quote requests, booking links, content slots, services, and analytics can all be driven from this admin.
        </p>
        <div className="integration-callout">
          <strong>Recommended hosting: Vercel</strong>
          <p className="muted">
            GitHub Pages can stay live for now, but Vercel is the better target if you want reliable in-dashboard previews, preview deployments, and reusable onboarding for future client websites.
          </p>
        </div>
      </div>

      <div className="integration-steps">
        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">1</span>
            <div>
              <strong>Add the Bridge Script</strong>
              <p className="muted">Paste this before the closing <code>&lt;/body&gt;</code> tag on your website. Use the site slug so the same setup scales to future client sites.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{bridgeSnippet}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(bridgeSnippet, "bridge")}>
              {copied === "bridge" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">2</span>
            <div>
              <strong>Tag Your Contact Form</strong>
              <p className="muted">Add <code>data-ciel="contact"</code> to your quote form. The bridge reads common field names like firstName, lastName, name, email, phone, vehicle, and services.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{formExample}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(formExample, "form")}>
              {copied === "form" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">3</span>
            <div>
              <strong>Connect Booking Links</strong>
              <p className="muted">Point your existing booking buttons to the hosted booking portal. This preserves the site layout while moving scheduling into Cielonline.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{bookingExample}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(bookingExample, "booking")}>
              {copied === "booking" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">4</span>
            <div>
              <strong>Map Existing Text to Admin Fields</strong>
              <p className="muted">Add content keys to elements you want to control from the Website tab. This updates copy without changing spacing or CSS.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{contentExample}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(contentExample, "content")}>
              {copied === "content" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">5</span>
            <div>
              <strong>Auto-Load Services</strong>
              <p className="muted">Render live services anywhere you want. Prices and descriptions sync with the Services tab.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{servicesExample}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(servicesExample, "services")}>
              {copied === "services" ? "✓ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="integration-step">
          <div className="integration-step-header">
            <span className="integration-step-num">6</span>
            <div>
              <strong>JavaScript API</strong>
              <p className="muted">For custom workflows, use the global <code>window.Cielonline</code> API.</p>
            </div>
          </div>
          <div className="integration-code-block">
            <pre>{jsApiExample}</pre>
            <button className="integration-copy-btn" onClick={() => handleCopy(jsApiExample, "api")}>
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
  const [mode, setMode] = useState("canvas");
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
    activeTemplateKey,
    canUndo,
    canRedo,
    addBlock,
    applyTemplate,
    updateBlock,
    deleteBlock,
    moveBlock,
    reorderBlocks,
    undo,
    redo,
    saveBlocks,
    setSelectedBlockId,
  } = editor;

  const currentViewport = VIEWPORTS.find((v) => v.key === viewport) || VIEWPORTS[0];
  const siteUrl = site.site_url || "";
  const cielonlinePreviewUrl = site.slug ? `/s/${site.slug}` : "";

  const handleRefresh = useCallback(() => {
    setIframeKey((key) => key + 1);
  }, []);

  const handleOpenExternal = useCallback(() => {
    const url = mode === "editor" ? cielonlinePreviewUrl : siteUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, [mode, siteUrl, cielonlinePreviewUrl]);

  return (
    <div className="admin-website-tab">
      <div className="canvas-toolbar">
        <div className="canvas-toolbar-left">
          <div className="canvas-mode-toggle">
            <button type="button" className={`canvas-mode-btn ${mode === "canvas" ? "active" : ""}`} onClick={() => setMode("canvas")}>
              🎛️ Visual Canvas
            </button>
            <button type="button" className={`canvas-mode-btn ${mode === "editor" ? "active" : ""}`} onClick={() => setMode("editor")}>
              🧱 Block Editor
            </button>
            <button type="button" className={`canvas-mode-btn ${mode === "integrate" ? "active" : ""}`} onClick={() => setMode("integrate")}>
              🔗 Integrate
            </button>
          </div>
          {mode !== "integrate" && siteUrl && <span className="canvas-url-badge">{siteUrl}</span>}
          {mode === "editor" && cielonlinePreviewUrl && <span className="canvas-url-badge">cielonline.com{cielonlinePreviewUrl}</span>}
        </div>

        {mode !== "integrate" && (
          <div className="canvas-toolbar-center">
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
              <button type="button" className="canvas-zoom-btn" onClick={() => setZoom((value) => Math.max(25, value - 10))} title="Zoom out">
                −
              </button>
              <span className="canvas-zoom-label">{zoom}%</span>
              <button type="button" className="canvas-zoom-btn" onClick={() => setZoom((value) => Math.min(150, value + 10))} title="Zoom in">
                +
              </button>
            </div>
          </div>
        )}

        <div className="canvas-toolbar-right">
          {mode === "canvas" && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRefresh}>
              🔄 Refresh
            </button>
          )}
          {mode === "editor" && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!canUndo || saving}>
                ↶ Undo
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={redo} disabled={!canRedo || saving}>
                ↷ Redo
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={saveBlocks} disabled={saving}>
                {saving ? "Saving..." : "💾 Save"}
              </button>
            </>
          )}
          {mode !== "integrate" && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenExternal}
              disabled={mode === "editor" ? !cielonlinePreviewUrl : !siteUrl}
            >
              ↗ Open
            </button>
          )}
        </div>
      </div>

      {status && <p className="status-banner">{status}</p>}

      <div className={`canvas-stage ${mode === "integrate" ? "canvas-stage-flat" : ""}`}>
        {mode === "integrate" && (
          <>
            <ManagedContentPanel siteId={siteId} />
            <IntegrationPanel site={site} />
          </>
        )}

        {mode === "canvas" && (
          <VisualCanvasPanel
            site={site}
            siteId={siteId}
            viewport={viewport}
            zoom={zoom}
            iframeKey={iframeKey}
            iframeRef={iframeRef}
            onRefresh={handleRefresh}
          />
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
                onReorderBlocks={reorderBlocks}
                onAddBlock={addBlock}
              />
            </div>
            <div className="canvas-editor-sidebar">
              <SiteTemplateLibrary
                activeTemplateKey={activeTemplateKey}
                onApplyTemplate={applyTemplate}
                hasBlocks={blocks.length > 0}
              />
              <BlockPropertiesPanel block={selectedBlock} onChange={updateBlock} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}