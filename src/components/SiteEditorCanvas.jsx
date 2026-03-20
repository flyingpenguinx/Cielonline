import { useState } from "react";
import SiteBlock from "./SiteBlock";
import BlockToolbar from "./BlockToolbar";

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

  const resetDragState = () => {
    setDraggedBlockId(null);
    setDragTargetIndex(null);
  };

  const renderDropZone = (index) => (
    <div
      key={`drop-zone-${index}`}
      className={`site-block-drop-zone ${dragTargetIndex === index ? "active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (draggedBlockId) {
          setDragTargetIndex(index);
        }
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
    <div className="site-editor-canvas" onClick={() => onSelectBlock(null)}>
      {blocks.length === 0 && (
        <div className="canvas-empty">
          <p className="canvas-empty-icon">🏗️</p>
          <h3>Start building your page</h3>
          <p className="muted">Add your first content block using the toolbar below.</p>
        </div>
      )}

      {blocks.length > 0 && renderDropZone(0)}

      {blocks.map((block, i) => (
        <div key={block.id} className="site-block-stack-item">
          <SiteBlock
            block={block}
            index={i}
            totalBlocks={blocks.length}
            selected={block.id === selectedBlockId}
            editing={block.id === selectedBlockId}
            onSelect={onSelectBlock}
            onChange={onUpdateBlock}
            onDelete={onDeleteBlock}
            onMove={onMoveBlock}
            onDragStart={() => {
              setDraggedBlockId(block.id);
              onSelectBlock(block.id);
            }}
            onDragEnd={resetDragState}
          />
          {renderDropZone(i + 1)}
        </div>
      ))}

      <BlockToolbar onAdd={onAddBlock} />
    </div>
  );
}
