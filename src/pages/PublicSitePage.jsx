import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { trackSiteEvent } from "../lib/sitePlatformApi";

/* ── Static block renderer (hero, heading, text, image, etc.) ── */
function renderStaticBlock(block) {
  const { block_type: type, content } = block;

  switch (type) {
    case "hero":
      return (
        <section
          key={block.id}
          className="pub-hero"
          style={{
            backgroundColor: content.backgroundColor || "#1e293b",
            color: content.textColor || "#fff",
            textAlign: content.align || "center",
          }}
        >
          <h1>{content.title}</h1>
          {content.subtitle && <p>{content.subtitle}</p>}
        </section>
      );

    case "heading": {
      const Tag = `h${content.level || 2}`;
      return <Tag key={block.id} style={{ textAlign: content.align || "left", color: content.textColor || "#0f172a" }}>{content.text}</Tag>;
    }

    case "text":
      return (
        <p key={block.id} style={{ textAlign: content.align || "left", whiteSpace: "pre-wrap", color: content.textColor || "#334155" }}>
          {content.text}
        </p>
      );

    case "image":
      return content.src ? (
        <figure key={block.id} className="pub-image">
          <img src={content.src} alt={content.alt || ""} style={{ width: content.width || "100%" }} />
          {content.caption && <figcaption>{content.caption}</figcaption>}
        </figure>
      ) : null;

    case "button":
      return (
        <div key={block.id} style={{ textAlign: content.align || "center" }}>
          <a
            className={`site-btn site-btn-${content.variant || "primary"}`}
            href={content.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: content.backgroundColor, color: content.textColor || undefined }}
          >
            {content.text || "Button"}
          </a>
        </div>
      );

    case "divider":
      return <hr key={block.id} style={{ borderStyle: content.style || "solid" }} className="pub-divider" />;

    case "spacer":
      return <div key={block.id} style={{ height: content.height || 40 }} />;

    case "columns":
      return (
        <div
          key={block.id}
          className="pub-columns"
          style={{
            gridTemplateColumns: `repeat(${content.count || 2}, 1fr)`,
            background: content.backgroundColor || undefined,
            color: content.textColor || undefined,
          }}
        >
          {(content.items || []).map((col, i) => (
            <div key={i} className="pub-column">
              {col.heading && <h3>{col.heading}</h3>}
              {col.text && <p>{col.text}</p>}
            </div>
          ))}
        </div>
      );

    case "gallery": {
      const images = content.images || [];
      if (images.length === 0) return null;
      return (
        <div key={block.id} className="pub-gallery">
          <div className="pub-gallery-grid" style={{ gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)` }}>
            {images.map((img, i) => (
              <figure key={i} className="pub-gallery-item">
                <img src={img.src} alt={img.alt || ""} />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      );
    }

    case "video": {
      if (!content.url) return null;
      const ytMatch = content.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      const vimeoMatch = content.url.match(/vimeo\.com\/(\d+)/);
      let embedUrl = "";
      if (ytMatch) embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      else if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      if (!embedUrl) return null;
      return (
        <div key={block.id} className="pub-video">
          <div className="pub-video-embed">
            <iframe
              src={embedUrl}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {content.caption && <p className="pub-video-caption">{content.caption}</p>}
        </div>
      );
    }

    case "map":
      if (!content.embed_url) return null;
      return (
        <div key={block.id} className="pub-map" style={{ height: content.height || 400 }}>
          <iframe
            src={content.embed_url}
            title="Map"
            style={{ border: 0, width: "100%", height: "100%" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      );

    default:
      return null;
  }
}

/* ── Services List (live from DB) ── */
function PubServicesList({ block, services }) {
  const { content } = block;
  const activeServices = services.filter((s) => s.is_active !== false);
  if (activeServices.length === 0) return null;

  return (
    <div key={block.id} className="pub-services-list" style={{ background: content.backgroundColor || undefined, color: content.textColor || undefined }}>
      {content.heading && <h2 style={{ textAlign: "center", color: content.textColor || undefined }}>{content.heading}</h2>}
      <div
        className="pub-services-grid"
        style={{ gridTemplateColumns: `repeat(${content.columns || 2}, 1fr)` }}
      >
        {activeServices.map((svc) => (
          <div key={svc.id} className="pub-service-card" style={{ background: content.cardBackground || undefined, color: content.textColor || undefined }}>
            <h3>{svc.name}</h3>
            {content.show_description !== false && svc.description && (
              <p>{svc.description}</p>
            )}
            <div className="pub-service-meta">
              {content.show_price !== false && svc.price != null && (
                <span className="pub-service-price">${parseFloat(svc.price).toFixed(2)}</span>
              )}
              {content.show_duration !== false && svc.duration_minutes && (
                <span className="pub-service-duration">{svc.duration_minutes} min</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contact Form (submits to inquiries table) ── */
function PubContactForm({ block, siteId, services }) {
  const { content } = block;
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", vehicle: "", preferred_date: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSubmitting(true);
    setErr("");
    try {
      const { error } = await supabase.from("inquiries").insert({
        site_id: siteId,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
        service_requested: form.service || null,
        vehicle_info: form.vehicle || null,
        preferred_date: form.preferred_date || null,
        status: "new",
        source: "website",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e) {
      setErr("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="pub-contact-form pub-contact-success" style={{ background: content.backgroundColor || undefined, color: content.textColor || undefined }}>
        <h2>✓</h2>
        <p>{content.success_message || "Thank you! We'll be in touch shortly."}</p>
      </div>
    );
  }

  const activeServices = services.filter((s) => s.is_active !== false);

  return (
    <div className="pub-contact-form" style={{ background: content.backgroundColor || undefined, color: content.textColor || undefined }}>
      {content.heading && <h2 style={{ textAlign: "center", color: content.textColor || undefined }}>{content.heading}</h2>}
      {content.subtitle && <p className="pub-form-subtitle" style={{ color: content.textColor || undefined, opacity: 0.8 }}>{content.subtitle}</p>}
      <form onSubmit={handleSubmit} className="pub-form">
        <div className="pub-form-row">
          <label className="pub-field">
            <span>Name *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="pub-field">
            <span>Email *</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
        </div>
        <div className="pub-form-row">
          <label className="pub-field">
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          {content.show_service_picker !== false && activeServices.length > 0 && (
            <label className="pub-field">
              <span>Service</span>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                <option value="">Select a service...</option>
                {activeServices.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {content.show_vehicle_field !== false && (
          <label className="pub-field">
            <span>Vehicle Info</span>
            <input
              type="text"
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              placeholder="e.g., 2024 Tesla Model 3 White"
            />
          </label>
        )}
        {content.show_preferred_date !== false && (
          <label className="pub-field">
            <span>Preferred Date</span>
            <input
              type="date"
              value={form.preferred_date}
              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
            />
          </label>
        )}
        <label className="pub-field">
          <span>Message</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        {err && <p className="pub-form-error">{err}</p>}
        <button type="submit" className="site-btn site-btn-primary pub-submit-btn" disabled={submitting}>
          {submitting ? "Sending..." : (content.button_text || "Send Message")}
        </button>
      </form>
    </div>
  );
}

/* ── Main Public Site Page ── */
export default function PublicSitePage() {
  const { slug } = useParams();
  const [site, setSite] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Service unavailable.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data: siteData, error: siteErr } = await supabase
        .from("client_sites")
        .select("*")
        .eq("slug", slug)
        .single();

      if (siteErr || !siteData) {
        setError("Site not found.");
        setLoading(false);
        return;
      }

      setSite(siteData);

      const [blocksRes, servicesRes] = await Promise.all([
        supabase
          .from("site_blocks")
          .select("*")
          .eq("site_id", siteData.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("services")
          .select("*")
          .eq("site_id", siteData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      setBlocks(blocksRes.data ?? []);
      setServices(servicesRes.data ?? []);
      setLoading(false);

      // Track page view for analytics
      try {
        await trackSiteEvent({
          site_id: siteData.id,
          event_type: "page_view",
          event_name: "site_page_view",
          page_path: `/s/${slug}`,
          metadata: { slug },
        });
      } catch (e) {
        // tracking is best-effort, don't block rendering
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: "60vh" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="container main-space fade-in" style={{ textAlign: "center" }}>
        <h2>{error}</h2>
        <p className="muted">The page you are looking for does not exist or is not published.</p>
      </main>
    );
  }

  return (
    <main className="public-site fade-in">
      {site.favicon_url && (
        <link rel="icon" href={site.favicon_url} />
      )}
      <div className="public-site-content">
        {blocks.map((block) => {
          if (block.block_type === "services_list") {
            return <PubServicesList key={block.id} block={block} services={services} />;
          }
          if (block.block_type === "contact_form") {
            return <PubContactForm key={block.id} block={block} siteId={site.id} services={services} />;
          }
          return renderStaticBlock(block);
        })}
      </div>
    </main>
  );
}
