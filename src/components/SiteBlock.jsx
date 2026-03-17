const BLOCK_LABELS = {
  hero: "Hero Banner",
  heading: "Heading",
  text: "Text Block",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  columns: "Columns",
  gallery: "Gallery",
  services_list: "Services / Prices",
  contact_form: "Contact Form",
  video: "Video Embed",
  map: "Map Embed",
};

function HeroBlock({ content, editing, onChange }) {
  return (
    <div
      className="site-block-hero"
      style={{ backgroundColor: content.backgroundColor || "#1e293b", color: content.textColor || "#fff", textAlign: content.align || "center" }}
    >
      {editing ? (
        <>
          <input
            className="inline-edit inline-edit-hero-title"
            value={content.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Hero Title"
            style={{ color: content.textColor || "#fff" }}
          />
          <input
            className="inline-edit inline-edit-hero-sub"
            value={content.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Subtitle"
            style={{ color: content.textColor || "#fff" }}
          />
        </>
      ) : (
        <>
          <h1>{content.title || "Hero Title"}</h1>
          <p>{content.subtitle || "Subtitle"}</p>
        </>
      )}
    </div>
  );
}

function HeadingBlock({ content, editing, onChange }) {
  const Tag = `h${content.level || 2}`;
  if (editing) {
    return (
      <input
        className={`inline-edit inline-edit-h${content.level || 2}`}
        value={content.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Heading text"
        style={{ textAlign: content.align || "left" }}
      />
    );
  }
  return <Tag style={{ textAlign: content.align || "left" }}>{content.text || "Heading"}</Tag>;
}

function TextBlock({ content, editing, onChange }) {
  if (editing) {
    return (
      <textarea
        className="inline-edit inline-edit-text"
        value={content.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Type your text..."
        style={{ textAlign: content.align || "left" }}
        rows={4}
      />
    );
  }
  return <p style={{ textAlign: content.align || "left", whiteSpace: "pre-wrap" }}>{content.text || "Text block"}</p>;
}

function ImageBlock({ content, editing, onChange }) {
  return (
    <div className="site-block-image">
      {content.src ? (
        <img src={content.src} alt={content.alt || ""} style={{ width: content.width || "100%" }} />
      ) : (
        <div className="image-placeholder">
          <span>🖼</span>
          <span>No image set</span>
        </div>
      )}
      {editing && (
        <div className="image-edit-fields">
          <input
            className="inline-edit"
            value={content.src || ""}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="Image URL (paste link)"
          />
          <input
            className="inline-edit"
            value={content.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Alt text"
          />
          {content.src && (
            <input
              className="inline-edit"
              value={content.caption || ""}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          )}
        </div>
      )}
      {content.caption && !editing && <p className="image-caption">{content.caption}</p>}
    </div>
  );
}

function ButtonBlock({ content, editing, onChange }) {
  if (editing) {
    return (
      <div className="button-edit-row" style={{ textAlign: content.align || "center" }}>
        <input
          className="inline-edit"
          value={content.text || ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Button text"
        />
        <input
          className="inline-edit"
          value={content.url || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="Button URL"
        />
      </div>
    );
  }
  return (
    <div style={{ textAlign: content.align || "center" }}>
      <span className={`site-btn site-btn-${content.variant || "primary"}`}>{content.text || "Button"}</span>
    </div>
  );
}

function DividerBlock({ content }) {
  return <hr className="site-divider" style={{ borderStyle: content.style || "solid" }} />;
}

function SpacerBlock({ content, editing, onChange }) {
  if (editing) {
    return (
      <div className="spacer-edit" style={{ height: content.height || 40 }}>
        <label>
          Height: {content.height || 40}px
          <input
            type="range"
            min="8"
            max="120"
            value={content.height || 40}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </label>
      </div>
    );
  }
  return <div style={{ height: content.height || 40 }} />;
}

function ColumnsBlock({ content, editing, onChange }) {
  const items = content.items || [];
  return (
    <div className="site-block-columns" style={{ gridTemplateColumns: `repeat(${content.count || 2}, 1fr)` }}>
      {items.map((col, i) => (
        <div key={i} className="site-column">
          {editing ? (
            <>
              <input
                className="inline-edit inline-edit-h3"
                value={col.heading || ""}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], heading: e.target.value };
                  onChange({ items: next });
                }}
                placeholder="Column heading"
              />
              <textarea
                className="inline-edit inline-edit-text"
                value={col.text || ""}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], text: e.target.value };
                  onChange({ items: next });
                }}
                placeholder="Column text"
                rows={3}
              />
            </>
          ) : (
            <>
              <h3>{col.heading || "Column"}</h3>
              <p>{col.text || "Content"}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Gallery Block ── */
function GalleryBlock({ content, editing, onChange }) {
  const images = content.images || [];

  const addImage = () => {
    onChange({ images: [...images, { src: "", alt: "", caption: "" }] });
  };

  const updateImage = (idx, field, value) => {
    const next = images.map((img, i) => (i === idx ? { ...img, [field]: value } : img));
    onChange({ images: next });
  };

  const removeImage = (idx) => {
    onChange({ images: images.filter((_, i) => i !== idx) });
  };

  if (editing) {
    return (
      <div className="site-block-gallery editing">
        <div className="gallery-grid" style={{ gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)` }}>
          {images.map((img, i) => (
            <div key={i} className="gallery-item-edit">
              {img.src ? (
                <img src={img.src} alt={img.alt || ""} />
              ) : (
                <div className="image-placeholder small"><span>🖼</span></div>
              )}
              <input
                className="inline-edit"
                value={img.src || ""}
                onChange={(e) => updateImage(i, "src", e.target.value)}
                placeholder="Image URL"
              />
              <input
                className="inline-edit"
                value={img.caption || ""}
                onChange={(e) => updateImage(i, "caption", e.target.value)}
                placeholder="Caption (optional)"
              />
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeImage(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addImage} style={{ marginTop: 8 }}>
          + Add Image
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="site-block-gallery empty">
        <span>🖼️</span>
        <p className="muted">Gallery — click to add images</p>
      </div>
    );
  }

  return (
    <div className="site-block-gallery">
      <div className="gallery-grid" style={{ gridTemplateColumns: `repeat(${content.columns || 3}, 1fr)` }}>
        {images.map((img, i) => (
          <figure key={i} className="gallery-item">
            <img src={img.src} alt={img.alt || ""} />
            {img.caption && <figcaption>{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ── Services List Block (renders live from DB) ── */
function ServicesListBlock({ content, editing, onChange }) {
  return (
    <div className="site-block-services-list">
      <h2 style={{ textAlign: "center" }}>{content.heading || "Our Services"}</h2>
      <p className="muted" style={{ textAlign: "center", marginBottom: 16 }}>
        {editing
          ? "⚡ This block auto-renders your services from the Services tab — with live prices."
          : "Services and prices load from your service list automatically."
        }
      </p>
      <div className="services-preview-grid" style={{ gridTemplateColumns: `repeat(${content.columns || 2}, 1fr)` }}>
        {/* Preview placeholders */}
        {[1, 2, 3, 4].slice(0, content.columns || 2).map((n) => (
          <div key={n} className="service-preview-card">
            <strong>Service {n}</strong>
            {content.show_description !== false && <p className="muted">Description loads from Services tab</p>}
            <div className="service-preview-meta">
              {content.show_price !== false && <span className="service-price">$XX.XX</span>}
              {content.show_duration !== false && <span className="muted">60 min</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contact Form Block ── */
function ContactFormBlock({ content, editing, onChange }) {
  return (
    <div className="site-block-contact-form">
      {editing ? (
        <>
          <input
            className="inline-edit inline-edit-h2"
            value={content.heading || ""}
            onChange={(e) => onChange({ heading: e.target.value })}
            placeholder="Form heading"
          />
          <input
            className="inline-edit"
            value={content.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Subtitle text"
            style={{ marginBottom: 12 }}
          />
        </>
      ) : (
        <>
          <h2 style={{ textAlign: "center" }}>{content.heading || "Get in Touch"}</h2>
          {content.subtitle && <p className="muted" style={{ textAlign: "center" }}>{content.subtitle}</p>}
        </>
      )}
      <div className="contact-form-preview">
        <div className="form-preview-field"><span>Name</span></div>
        <div className="form-preview-field"><span>Email</span></div>
        <div className="form-preview-field"><span>Phone</span></div>
        {content.show_service_picker !== false && <div className="form-preview-field"><span>Service</span></div>}
        {content.show_vehicle_field !== false && <div className="form-preview-field"><span>Vehicle Info</span></div>}
        {content.show_preferred_date !== false && <div className="form-preview-field"><span>Preferred Date</span></div>}
        <div className="form-preview-field tall"><span>Message</span></div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          {editing ? (
            <input
              className="inline-edit"
              value={content.button_text || "Send Message"}
              onChange={(e) => onChange({ button_text: e.target.value })}
              placeholder="Button text"
              style={{ maxWidth: 200, textAlign: "center" }}
            />
          ) : (
            <span className="site-btn site-btn-primary">{content.button_text || "Send Message"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Video Block ── */
function VideoBlock({ content, editing, onChange }) {
  const getEmbedUrl = (url) => {
    if (!url) return "";
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return "";
  };

  const embedUrl = getEmbedUrl(content.url);

  return (
    <div className="site-block-video">
      {editing && (
        <input
          className="inline-edit"
          value={content.url || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="YouTube or Vimeo URL"
          style={{ marginBottom: 8 }}
        />
      )}
      {embedUrl ? (
        <div className="video-embed">
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="image-placeholder">
          <span>🎬</span>
          <span>Paste a YouTube or Vimeo URL</span>
        </div>
      )}
      {editing && (
        <input
          className="inline-edit"
          value={content.caption || ""}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Caption (optional)"
        />
      )}
      {content.caption && !editing && <p className="image-caption">{content.caption}</p>}
    </div>
  );
}

/* ── Map Block ── */
function MapBlock({ content, editing, onChange }) {
  return (
    <div className="site-block-map">
      {editing && (
        <input
          className="inline-edit"
          value={content.embed_url || ""}
          onChange={(e) => onChange({ embed_url: e.target.value })}
          placeholder='Google Maps embed URL (from "Share → Embed a map")'
          style={{ marginBottom: 8 }}
        />
      )}
      {content.embed_url ? (
        <div className="map-embed" style={{ height: content.height || 400 }}>
          <iframe
            src={content.embed_url}
            title="Map"
            style={{ border: 0, width: "100%", height: "100%" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="image-placeholder">
          <span>📍</span>
          <span>{editing ? 'Paste a Google Maps embed URL' : 'No map configured'}</span>
        </div>
      )}
    </div>
  );
}

const RENDERERS = {
  hero: HeroBlock,
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  columns: ColumnsBlock,
  gallery: GalleryBlock,
  services_list: ServicesListBlock,
  contact_form: ContactFormBlock,
  video: VideoBlock,
  map: MapBlock,
};

export default function SiteBlock({ block, selected, editing, onSelect, onChange, onDelete, onMove, totalBlocks, index }) {
  const Renderer = RENDERERS[block.block_type];
  if (!Renderer) return null;

  return (
    <div
      className={`site-block-wrapper ${selected ? "selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
    >
      {/* Block controls — visible when selected */}
      {selected && (
        <div className="site-block-controls">
          <span className="site-block-label">{BLOCK_LABELS[block.block_type] || block.block_type}</span>
          <div className="site-block-actions">
            <button
              type="button"
              className="block-action-btn"
              onClick={(e) => { e.stopPropagation(); onMove(block.id, -1); }}
              disabled={index === 0}
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              className="block-action-btn"
              onClick={(e) => { e.stopPropagation(); onMove(block.id, 1); }}
              disabled={index === totalBlocks - 1}
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className="block-action-btn block-action-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
              title="Delete block"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="site-block-content">
        <Renderer
          content={block.content}
          editing={editing}
          onChange={(partial) => onChange(block.id, partial)}
        />
      </div>
    </div>
  );
}
