import SiteBlock from "./SiteBlock";
import BlockToolbar from "./BlockToolbar";

export default function SiteEditorCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onAddBlock,
}) {
  return (
    <div className="site-editor-canvas" onClick={() => onSelectBlock(null)}>
      {blocks.length === 0 && (
        <div className="canvas-empty">
          <p className="canvas-empty-icon">🏗️</p>
          <h3>Start building your page</h3>
          <p className="muted">Add your first content block using the toolbar below.</p>
        </div>
      )}

      {blocks.map((block, i) => (
        <SiteBlock
          key={block.id}
          block={block}
          index={i}
          totalBlocks={blocks.length}
          selected={block.id === selectedBlockId}
          editing={block.id === selectedBlockId}
          onSelect={onSelectBlock}
          onChange={onUpdateBlock}
          onDelete={onDeleteBlock}
          onMove={onMoveBlock}
        />
      ))}

      <BlockToolbar onAdd={onAddBlock} />
    </div>
  );
}
