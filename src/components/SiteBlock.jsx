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

const RENDERERS = {
  hero: HeroBlock,
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  columns: ColumnsBlock,
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
