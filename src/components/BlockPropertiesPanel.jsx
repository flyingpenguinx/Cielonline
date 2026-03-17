export default function BlockPropertiesPanel({ block, onChange }) {
  if (!block) {
    return (
      <div className="panel block-props-panel">
        <h3>Properties</h3>
        <p className="muted">Select a block to edit its properties.</p>
      </div>
    );
  }

  const { block_type: type, content } = block;

  return (
    <div className="panel block-props-panel">
      <h3>Block Properties</h3>

      {/* Alignment — shared by hero, heading, text, button */}
      {["hero", "heading", "text", "button"].includes(type) && (
        <div className="field">
          <span>Alignment</span>
          <div className="style-row">
            {["left", "center", "right"].map((a) => (
              <button
                key={a}
                type="button"
                className={`style-chip ${content.align === a ? "selected" : ""}`}
                onClick={() => onChange(block.id, { align: a })}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Heading level */}
      {type === "heading" && (
        <div className="field">
          <span>Heading Level</span>
          <div className="style-row">
            {[1, 2, 3, 4].map((l) => (
              <button
                key={l}
                type="button"
                className={`style-chip ${content.level === l ? "selected" : ""}`}
                onClick={() => onChange(block.id, { level: l })}
              >
                H{l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero colors */}
      {type === "hero" && (
        <>
          <div className="field">
            <span>Background Color</span>
            <input
              type="color"
              value={content.backgroundColor || "#1e293b"}
              onChange={(e) => onChange(block.id, { backgroundColor: e.target.value })}
              className="color-picker-input"
            />
          </div>
          <div className="field">
            <span>Text Color</span>
            <div className="style-row">
              {["#ffffff", "#0f172a"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`style-chip ${content.textColor === c ? "selected" : ""}`}
                  onClick={() => onChange(block.id, { textColor: c })}
                >
                  {c === "#ffffff" ? "White" : "Dark"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Button variant */}
      {type === "button" && (
        <div className="field">
          <span>Style</span>
          <div className="style-row">
            {["primary", "secondary"].map((v) => (
              <button
                key={v}
                type="button"
                className={`style-chip ${content.variant === v ? "selected" : ""}`}
                onClick={() => onChange(block.id, { variant: v })}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image width */}
      {type === "image" && (
        <div className="field">
          <span>Width</span>
          <div className="style-row">
            {["50%", "75%", "100%"].map((w) => (
              <button
                key={w}
                type="button"
                className={`style-chip ${content.width === w ? "selected" : ""}`}
                onClick={() => onChange(block.id, { width: w })}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider style */}
      {type === "divider" && (
        <div className="field">
          <span>Style</span>
          <div className="style-row">
            {["solid", "dashed", "dotted"].map((s) => (
              <button
                key={s}
                type="button"
                className={`style-chip ${content.style === s ? "selected" : ""}`}
                onClick={() => onChange(block.id, { style: s })}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Columns count */}
      {type === "columns" && (
        <div className="field">
          <span>Number of Columns</span>
          <div className="style-row">
            {[2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`style-chip ${content.count === n ? "selected" : ""}`}
                onClick={() => {
                  const items = [...(content.items || [])];
                  while (items.length < n) items.push({ heading: `Column ${items.length + 1}`, text: "Content" });
                  onChange(block.id, { count: n, items: items.slice(0, n) });
                }}
              >
                {n} Columns
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
