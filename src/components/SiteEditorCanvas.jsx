import { useState, useRef, useEffect } from "react";
import SiteBlock from "./SiteBlock";
import BlockToolbar from "./BlockToolbar";

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

const BLOCK_ICONS = {
  hero: "🖼️",
  heading: "📝",
  text: "📄",
  image: "🖼",
  button: "🔘",
  divider: "—",
  spacer: "↕",
  columns: "▥",
  gallery: "🖼️",
  services_list: "💰",
  contact_form: "📬",
  video: "🎬",
  map: "📍",
};

export default function SiteEditorCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onReorderBlocks,
  onAddBlock,
}) {
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragTargetIndex, setDragTargetIndex] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [layerDragIdx, setLayerDragIdx] = useState(null);
  const [layerDragOverIdx, setLayerDragOverIdx] = useState(null);
  const blockRefs = useRef({});

  const resetDragState = () => {
    setDraggedBlockId(null);
    setDragTargetIndex(null);
  };

  // Scroll the selected block into view in the canvas
  useEffect(() => {
    if (selectedBlockId && blockRefs.current[selectedBlockId]) {
      blockRefs.current[selectedBlockId].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedBlockId]);

  const handleLayerClick = (blockId) => {
    onSelectBlock(blockId);
  };

  const handleLayerDragStart = (e, idx) => {
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
    setLayerDragIdx(idx);
  };

  const handleLayerDragOver = (e, idx) => {
    e.preventDefault();
    setLayerDragOverIdx(idx);
  };

  const handleLayerDrop = (idx) => {
    if (layerDragIdx !== null && layerDragIdx !== idx) {
      const sourceBlock = blocks[layerDragIdx];
      if (sourceBlock) {
        onReorderBlocks(sourceBlock.id, idx);
      }
    }
    setLayerDragIdx(null);
    setLayerDragOverIdx(null);
  };

  const renderDropZone = (index) => (
    <div
      key={`drop-zone-${index}`}
      className={`site-block-drop-zone ${dragTargetIndex === index ? "active" : ""} ${draggedBlockId ? "drag-active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragTargetIndex(index);
      }}
      onDragLeave={() => {
        setDragTargetIndex((prev) => (prev === index ? null : prev));
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (draggedBlockId) {
          onReorderBlocks(draggedBlockId, index);
        }
        resetDragState();
      }}
    >
      <span>Drop section here</span>
    </div>
  );

  return (
    <div className="editor-split-layout">
      {/* ── Left: Block Layer List ── */}
      <aside className="block-layer-panel">
        <div className="block-layer-header">
          <h3>Layers</h3>
          <span className="block-layer-count">{blocks.length} blocks</span>
        </div>

        <div className="block-layer-list">
          {blocks.length === 0 && (
            <p className="muted block-layer-empty">No blocks yet. Add one below.</p>
          )}
          {blocks.map((block, i) => (
            <div
              key={block.id}
              className={`block-layer-item ${block.id === selectedBlockId ? "active" : ""} ${block.id === hoveredBlockId ? "hovered" : ""} ${layerDragOverIdx === i ? "drag-over" : ""}`}
              onClick={() => handleLayerClick(block.id)}
              onMouseEnter={() => setHoveredBlockId(block.id)}
              onMouseLeave={() => setHoveredBlockId(null)}
              draggable
              onDragStart={(e) => handleLayerDragStart(e, i)}
              onDragOver={(e) => handleLayerDragOver(e, i)}
              onDrop={() => handleLayerDrop(i)}
              onDragEnd={() => { setLayerDragIdx(null); setLayerDragOverIdx(null); }}
            >
              <span className="block-layer-drag">⋮⋮</span>
              <span className="block-layer-icon">{BLOCK_ICONS[block.block_type] || "▢"}</span>
              <div className="block-layer-info">
                <span className="block-layer-name">{BLOCK_LABELS[block.block_type] || block.block_type}</span>
                <span className="block-layer-order">#{i + 1}</span>
              </div>
              <div className="block-layer-actions">
                <button
                  type="button"
                  className="block-layer-action-btn"
                  onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, -1); }}
                  disabled={i === 0}
                  title="Move up"
                >↑</button>
                <button
                  type="button"
                  className="block-layer-action-btn"
                  onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 1); }}
                  disabled={i === blocks.length - 1}
                  title="Move down"
                >↓</button>
                <button
                  type="button"
                  className="block-layer-action-btn block-layer-delete"
                  onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                  title="Delete block"
                >✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="block-layer-add-section">
          <BlockToolbar onAdd={onAddBlock} />
        </div>
      </aside>

      {/* ── Right: Live Preview Canvas ── */}
      <div className="editor-canvas-area">
        <div className="site-editor-canvas" onClick={() => onSelectBlock(null)}>
          {blocks.length === 0 && (
            <div className="canvas-empty">
              <p className="canvas-empty-icon">🏗️</p>
              <h3>Start building your page</h3>
              <p className="muted">Add your first content block using the layer list or the toolbar.</p>
            </div>
          )}

          {blocks.length > 0 && renderDropZone(0)}

          {blocks.map((block, i) => (
            <div
              key={block.id}
              className="site-block-stack-item"
              ref={(el) => { blockRefs.current[block.id] = el; }}
            >
              <SiteBlock
                block={block}
                index={i}
                totalBlocks={blocks.length}
                selected={block.id === selectedBlockId}
                editing={block.id === selectedBlockId}
                highlighted={block.id === hoveredBlockId}
                onSelect={onSelectBlock}
                onChange={onUpdateBlock}
                onDelete={onDeleteBlock}
                onMove={onMoveBlock}
                onDragStart={() => {
                  setDraggedBlockId(block.id);
                  onSelectBlock(block.id);
                }}
                onDragEnd={resetDragState}
                onDragOver={(e) => e.preventDefault()}
              />
              {renderDropZone(i + 1)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
