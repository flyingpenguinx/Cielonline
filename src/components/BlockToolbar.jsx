import { useState } from "react";

const BLOCK_TYPES = [
  { type: "hero",    label: "Hero Banner",  icon: "🖼️" },
  { type: "heading", label: "Heading",      icon: "📝" },
  { type: "text",    label: "Text Block",   icon: "📄" },
  { type: "image",   label: "Image",        icon: "🖼" },
  { type: "button",  label: "Button",       icon: "🔘" },
  { type: "columns", label: "Columns",      icon: "▥" },
  { type: "divider", label: "Divider",      icon: "—" },
  { type: "spacer",  label: "Spacer",       icon: "↕" },
];

export default function BlockToolbar({ onAdd }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="block-toolbar">
      <button
        type="button"
        className="btn btn-primary block-add-btn"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕ Close" : "+ Add Block"}
      </button>
      {open && (
        <div className="block-type-grid">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              className="block-type-option"
              onClick={() => {
                onAdd(bt.type);
                setOpen(false);
              }}
            >
              <span className="block-type-icon">{bt.icon}</span>
              <span className="block-type-label">{bt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
